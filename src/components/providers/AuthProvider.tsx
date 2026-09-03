"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  studentData: DocumentData | null;
  claims: Record<string, unknown> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  studentData: null,
  claims: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<DocumentData | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Fetch claims (roles)
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          setClaims(tokenResult.claims);

          const docRef = doc(db, "students", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setStudentData(docSnap.data());
          } else {
            setStudentData(null);
          }
        } catch (error) {
          console.error("Error fetching student profile or claims:", error);
          setStudentData(null);
          setClaims(null);
        }
      } else {
        setStudentData(null);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const protectedRoutes = ['/dashboard', '/report-lost', '/my-lost-items', '/matches', '/notifications', '/verification', '/recovery', '/profile', '/admin', '/found-item'];
    const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

    if (isProtectedRoute && !user) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, studentData, claims, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
