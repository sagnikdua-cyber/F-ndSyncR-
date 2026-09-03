import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { StorageService } from '@/services/storage.service';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      if (adminAuth) {
        decodedToken = await adminAuth.verifyIdToken(token);
      } else {
        throw new Error("Admin Auth not initialized");
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    
    const contentType = request.headers.get('content-type') || '';
    const body: Record<string, unknown> = {};
    let imageUrl: string | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body.itemName = formData.get('itemName') as string;
      body.itemType = formData.get('itemType') as string;
      body.description = formData.get('description') as string;
      
      try {
        body.publicCharacteristics = JSON.parse(formData.get('publicCharacteristics') as string || '{}');
        body.privateCharacteristics = JSON.parse(formData.get('privateCharacteristics') as string || '{}');
      } catch {
        body.publicCharacteristics = {};
        body.privateCharacteristics = {};
      }
      
      const file = formData.get('image') as File | null;
      if (file) {
        if (process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY !== 'dummy_secret_key') {
          const uploadRes = await StorageService.uploadLostItemImage(file, file.name);
          if (uploadRes.error) throw new Error(uploadRes.error);
          imageUrl = uploadRes.url || null;
        } else {
          imageUrl = 'https://mock-storage.url/mock-lost-image.jpg';
        }
      }
    } else {
      const jsonBody = await request.json();
      body.itemName = jsonBody.itemName;
      body.itemType = jsonBody.itemType;
      body.description = jsonBody.description;
      body.publicCharacteristics = jsonBody.publicCharacteristics;
      body.privateCharacteristics = jsonBody.privateCharacteristics;
      imageUrl = jsonBody.imageUrl || null;
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    const now = new Date().toISOString();
    
    const lostItemData = {
      ownerId: uid,
      itemName: body.itemName,
      itemType: body.itemType,
      description: body.description,
      publicCharacteristics: body.publicCharacteristics || {},
      privateCharacteristics: body.privateCharacteristics || {},
      imageUrl: imageUrl,
      status: 'reported',
      matchingStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('lostItems').add(lostItemData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: unknown) {
    console.error('Lost Items API POST Error:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      if (adminAuth) {
        decodedToken = await adminAuth.verifyIdToken(token);
      } else {
        throw new Error("Admin Auth not initialized");
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    // Fetch items without orderBy to avoid requiring a composite index
    const snapshot = await adminDb.collection('lostItems').where('ownerId', '==', uid).get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort items locally by descending creation date
    items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

    return NextResponse.json({ items });
  } catch (error: unknown) {
    console.error('Lost Items API GET Error:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
