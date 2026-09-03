import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { StorageService } from '@/services/storage.service';
import { AIService } from '@/services/ai.service';
import { MatchingService } from '@/services/matching.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing or invalid token" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth?.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    if (!decodedToken) {
      return NextResponse.json({ error: "Unauthorized: Token verification failed" }, { status: 401 });
    }

    // 1.2 Check Role (RBAC)
    if (decodedToken.role !== 'admin' && decodedToken.role !== 'intake') {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions for intake" }, { status: 403 });
    }

    // 1.5 Idempotency Check
    const idempotencyKey = request.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Idempotency-Key header is required" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    const existingDocs = await adminDb.collection('foundItems')
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existingDocs.empty) {
      const existingDoc = existingDocs.docs[0];
      return NextResponse.json({
        success: true,
        id: existingDoc.id,
        status: existingDoc.data().processingStatus,
        message: 'Item already processed (Idempotency check)'
      });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const sourceType = formData.get('sourceType') as string || 'web-upload';
    const captureDeviceId = formData.get('captureDeviceId') as string || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 3. Validate File
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 5MB limit' }, { status: 400 });
    }

    // 4. Upload to Storage
    let imageUrl = '';
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url') {
      const uploadRes = await StorageService.uploadFoundItemImage(file, file.name);
      if (uploadRes.error) {
        throw new Error(uploadRes.error);
      }
      imageUrl = uploadRes.url || '';
    } else {
      imageUrl = 'https://mock-storage.url/mock-image.jpg';
    }

    // 5. Process with AI
    // Convert File to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    const aiResult = await AIService.analyzeFoundItem(base64Image, file.type);

    // 6. Save to Firestore
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    const now = new Date();
    const expiryAt = new Date();
    expiryAt.setDate(now.getDate() + 7); // 7-day expiry logic

    const foundItemData = {
      sourceType,
      captureDeviceId,
      capturedAt: now.toISOString(),
      imageUrl,
      processingStatus: 'analyzed',
      matchingStatus: 'pending',
      objectType: aiResult.objectType || 'Unknown',
      publicCharacteristics: aiResult.publicCharacteristics || {},
      privateCharacteristics: aiResult.privateCharacteristics || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiryAt: expiryAt.toISOString(),
      uploadedBy: decodedToken.uid, // Track who uploaded it
      idempotencyKey: idempotencyKey
    };

    const docRef = await adminDb.collection('foundItems').add(foundItemData);

    // 7. Run Matching Logic
    try {
      const { matchingStatus } = await MatchingService.findMatchesForFoundItem(docRef.id, aiResult);
      
      // Update found item with match status
      await docRef.update({
        processingStatus: 'matched',
        matchingStatus: matchingStatus,
        updatedAt: new Date().toISOString()
      });
      
    } catch (matchError) {
      console.error('Matching failed but item was saved:', matchError);
      // We don't fail the request if matching throws, just leave it as 'pending'
    }

    return NextResponse.json({ 
      success: true, 
      id: docRef.id, 
      status: 'analyzed',
      message: 'Item received, analyzed, and stored successfully' 
    });

  } catch (error: unknown) {
    console.error('Found Item Intake API Error:', error);
    // Safe error response (don't leak internal details)
    return NextResponse.json({ error: 'An unexpected error occurred while processing the item' }, { status: 500 });
  }
}
