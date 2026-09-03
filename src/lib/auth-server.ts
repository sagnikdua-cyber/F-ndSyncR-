import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { DecodedIdToken } from "firebase-admin/auth";

export async function requireAdminAuth(req: NextRequest): Promise<{ decodedToken?: DecodedIdToken; error?: NextResponse }> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 }) };
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    if (!adminAuth) {
      return { error: NextResponse.json({ error: "Internal Error: Firebase Admin not initialized" }, { status: 500 }) };
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (decodedToken.role !== "admin") {
      return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }) };
    }

    return { decodedToken };
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return { error: NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 }) };
  }
}
