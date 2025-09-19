"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export default function ResetPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      const res = await fetch("https://fbnrefoqrdhpfzqqmeer.supabase.co/functions/v1/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibnJlZm9xcmRocGZ6cXFtZWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTk5MjAsImV4cCI6MjA3Mjk5NTkyMH0.q1tygK0dfq6pTmOp-LH9gt3deSAaPhVhg8XcVM3zKCk`,
        },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim()
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null; // Body ist kein JSON
      }

      if (res.ok) {
        setIsSubmitted(true);
        addToast({
          type: "success",
          title: "Link gesendet",
          description: "Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.",
          duration: 6000,
        });
      } else {
        addToast({
          type: "error",
          title: "Netzwerkfehler",
          description: "Bitte versuchen Sie es später erneut.",
          duration: 6000,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Netzwerkfehler",
        description: "Bitte versuchen Sie es später erneut.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, addToast]);

  if (isSubmitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
        <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Passwort zurücksetzen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">E-Mail gesendet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Falls ein Konto mit der E-Mail-Adresse <strong>{email}</strong> existiert, 
                  haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
                </p>
              </div>
              
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-600">
                  Bitte prüfen Sie Ihr Postfach und folgen Sie den Anweisungen in der E-Mail.
                </p>
                <p className="text-sm text-gray-600">
                  Falls Sie keine E-Mail erhalten haben, überprüfen Sie auch Ihren Spam-Ordner.
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline" 
                  className="w-full cursor-pointer"
                >
                  Andere E-Mail-Adresse verwenden
                </Button>
                <Link href="/login">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Zurück zur Anmeldung
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
      <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
        </CardHeader>
        <CardContent className="mt-0">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </p>
            </div>

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

            <Button type="submit" disabled={!canSubmit} className="w-full mb-0 cursor-pointer">
              {isSubmitting ? "Wird gesendet…" : "Weiter"}
            </Button>
            
              <p className="text-center text-xs text-gray-500 mt-2">
                <a href="/login" className="underline">Zurück zur Anmeldung</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
