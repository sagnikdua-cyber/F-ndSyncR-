import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { adminAuth } from "@/lib/firebase/admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth?.verifyIdToken(idToken);
    
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const id = (await params).id;
    await NotificationService.markAsRead(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
