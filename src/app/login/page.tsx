"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const AUTH_FUNCTION_URL = "https://fbnrefoqrdhpfzqqmeer.supabase.co/functions/v1/auth-login-register";

function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export default function LoginPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailError = useMemo(() => {
    if (email.length === 0) return "";
    return isValidEmail(email) ? "" : "Bitte eine gültige E‑Mail-Adresse eingeben";
  }, [email]);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && !isSubmitting;
  }, [email, isSubmitting]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      addToast({
        type: "warning",
        title: "Ungültige E‑Mail",
        description: "Bitte geben Sie eine gültige E‑Mail-Adresse ein.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(AUTH_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibnJlZm9xcmRocGZ6cXFtZWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTk5MjAsImV4cCI6MjA3Mjk5NTkyMH0.q1tygK0dfq6pTmOp-LH9gt3deSAaPhVhg8XcVM3zKCk',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        addToast({
          type: "success",
          title: "Anmeldelink versendet",
          description: "Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Link, um sich anzumelden.",
          duration: 6000,
        });
        // Optional: Feld leeren
        setEmail("");
      } else {
        let details = "";
        try {
          const data = await res.json();
          details = typeof data?.message === "string" ? data.message : JSON.stringify(data);
        } catch {
          try {
            details = await res.text();
          } catch {
            if (res.status === 404) {
              details = "Benutzer nicht gefunden.";
            } else {
              details = "Unbekannter Fehler";
            }
          }
        }
        addToast({
          type: "error",
          title: "Login fehlgeschlagen",
          description: details?.slice(0, 300) || "Der Anmeldelink konnte nicht gesendet werden.",
          duration: 6000,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Netzwerkfehler",
        description: error instanceof Error ? error.message : "Bitte versuche es später erneut.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, addToast]);

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
              {emailError && (
                <p className="text-xs text-black-600">{emailError}</p>
              )}
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full mb-0 cursor-pointer">
              {isSubmitting ? "Wird gesendet…" : "Einloggen"}
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">Kein Konto? <a href="/register" className="underline">Registrieren</a></p>
            <p className="text-center text-xs text-gray-500">
              Wir senden Ihnen einen einmaligen Login‑Link an Ihre E‑Mail-Adresse.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


