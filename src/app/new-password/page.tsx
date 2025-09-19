"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function NewPasswordPage() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const accessToken = searchParams.get("access_token") || searchParams.get("token") || "";


  const passwordError = useMemo(() => {
    if (password.length && password.length < 6) return "Mindestens 6 Zeichen erforderlich";
  }, [password]);

  const samePasswordError = useMemo(() => {
    if (password.length && confirmPassword.length && confirmPassword != password) return "Die Passwörter stimmen nicht überein";
  }, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    return !!accessToken && password.length >= 6 && password === confirmPassword && !isSubmitting;
  }, [accessToken, password, confirmPassword, isSubmitting]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      addToast({
        type: "error",
        title: "Ungültiger Link",
        description: "Der Link ist ungültig oder abgelaufen.",
        duration: 6000,
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        type: "warning",
        title: "Passwort zu kurz",
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      addToast({
        type: "warning",
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfen Sie Ihre Passwort-Eingabe.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("https://fbnrefoqrdhpfzqqmeer.supabase.co/auth/v1/new-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password }),
      });

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (res.ok) {
        setIsSubmitted(true);
        addToast({
          type: "success",
          title: "Passwort gesetzt",
          description: "Ihr Passwort wurde erfolgreich aktualisiert.",
          duration: 6000,
        });
      } else {
        addToast({
          type: "error",
          title: "Fehler",
          description: data?.error_description || data?.message || "Das Passwort konnte nicht gesetzt werden.",
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
  }, [accessToken, password, confirmPassword, addToast]);

  if (!accessToken && !isSubmitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
        <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Dieser Link ist ungültig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">Der Link zum Setzen des Passworts ist ungültig oder abgelaufen.</p>
              <div className="flex flex-col space-y-2">
                <Link href="/reset-password">
                  <Button variant="outline" className="w-full cursor-pointer">Neuen Link anfordern</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full cursor-pointer">Zurück zur Anmeldung</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
        <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Passwort aktualisiert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
              <div className="flex flex-col space-y-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full cursor-pointer">Zur Anmeldung</Button>
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
          <CardTitle>Neues Passwort setzen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Neues Passwort *</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
              />
              {passwordError && (
                <p className="text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">Passwort bestätigen *</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
              />
              {samePasswordError && (
                <p className="text-xs text-red-600">{samePasswordError}</p>
              )}
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full mb-0 cursor-pointer">
              {isSubmitting ? "Wird gespeichert…" : "Passwort setzen"}
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


