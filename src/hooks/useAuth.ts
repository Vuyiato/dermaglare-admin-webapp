// src/hooks/useAuth.ts

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      setLoginError(error.message || "Failed to sign in");
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    loading,
    loginError,
    setLoginError,
    handleLogin,
    handleLogout,
  };
};
