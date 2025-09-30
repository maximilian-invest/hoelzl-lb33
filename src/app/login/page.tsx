"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export default function LoginPage() {
  const { addToast } = useToast();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password && !isSubmitting;
  }, [email, password, isSubmitting]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const res = await fetch("https://fbnrefoqrdhpfzqqmeer.supabase.co/functions/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibnJlZm9xcmRocGZ6cXFtZWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTk5MjAsImV4cCI6MjA3Mjk5NTkyMH0.q1tygK0dfq6pTmOp-LH9gt3deSAaPhVhg8XcVM3zKCk`,
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(), 
          password: password 
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null; // Body ist kein JSON
      }

      if (res.ok) {
        // Benutzer über AuthContext anmelden
        login(data.session.access_token, data.profile);    
        addToast({
          type: "success",
          title: "Erfolgreich angemeldet",
          description: `Willkommen zurück!`,
          duration: 3000,
        });
        
        // Weiterleitung zur Hauptseite
        router.push('/');
      } else {
        addToast({
          type: "error",
          title: "Login fehlgeschlagen",
          description: "Ungültige Anmeldedaten.",
          duration: 6000,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Login fehlgeschlagen",
        description: "Ungültige Anmeldedaten.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, addToast, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
      <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>allround.immo – Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">E‑Mail-Adresse</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Passwort</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Ihr Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
              />
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full mb-0 cursor-pointer">
              {isSubmitting ? "Wird angemeldet…" : "Einloggen"}
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Kein Konto? <a href="/register" className="underline">Registrieren</a>
            </p>
            <p className="text-center text-xs text-gray-500">
              <a href="/reset-password" className="underline">Passwort vergessen?</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}