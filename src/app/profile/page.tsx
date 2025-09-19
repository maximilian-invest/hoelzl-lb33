"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

export default function ProfilePage() {
  const { addToast } = useToast();
  const { user, token, logout, updateUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstNameError = useMemo(() => {
    if (firstName.length === 0) return "";
    return firstName.length >= 2 ? "" : "Vorname muss mindestens 2 Zeichen lang sein";
  }, [firstName]);

  const lastNameError = useMemo(() => {
    if (lastName.length === 0) return "";
    return lastName.length >= 2 ? "" : "Nachname muss mindestens 2 Zeichen lang sein";
  }, [lastName]);

  const canSubmit = useMemo(() => {
    return firstName.length >= 2 && 
           lastName.length >= 2 && 
           !isSubmitting;
  }, [firstName, lastName, isSubmitting]);

  const hasChanges = useMemo(() => {
    if (!user) return false;
    return firstName !== user.firstName || 
           lastName !== user.lastName || 
           companyName !== (user.companyName || '');
  }, [user, firstName, lastName, companyName]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      addToast({
        type: "warning",
        title: "Nicht angemeldet",
        description: "Bitte melden Sie sich an, um Ihr Profil zu bearbeiten.",
        duration: 3000,
      });
      router.push('/login');
      return;
    }

    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setCompanyName(user.companyName || '');
  }, [authLoading, isAuthenticated, user, addToast, router]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (firstName.length < 2 || lastName.length < 2) {
      addToast({
        type: "warning",
        title: "Name erforderlich",
        description: "Vor- und Nachname müssen mindestens 2 Zeichen lang sein.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }

      const res = await fetch("/api/auth/save-update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyName: companyName.trim()
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Aktualisierte Benutzerdaten über AuthContext speichern
        updateUser(data.user);
        
        addToast({
          type: "success",
          title: "Profil aktualisiert",
          description: "Ihre Profildaten wurden erfolgreich gespeichert.",
          duration: 3000,
        });
      } else {
        if (res.status === 401) {
          // Token ungültig, abmelden
          logout();
          addToast({
            type: "warning",
            title: "Sitzung abgelaufen",
            description: "Bitte melden Sie sich erneut an.",
            duration: 3000,
          });
          router.push('/login');
        } else {
          addToast({
            type: "error",
            title: "Fehler beim Speichern",
            description: data.error || "Das Profil konnte nicht aktualisiert werden.",
            duration: 6000,
          });
        }
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
  }, [firstName, lastName, companyName, addToast, router]);

  const handleLogout = useCallback(() => {
    logout();
    addToast({
      type: "success",
      title: "Abgemeldet",
      description: "Sie wurden erfolgreich abgemeldet.",
      duration: 3000,
    });
    router.push('/login');
  }, [logout, addToast, router]);

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Lade Profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Wird zur Login-Seite weitergeleitet
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
      <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profil bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-500">E‑Mail-Adresse</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Die E-Mail-Adresse kann nicht geändert werden.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium">Vorname *</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Max"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
                />
                {firstNameError && (
                  <p className="text-xs text-red-600">{firstNameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium">Nachname *</label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Mustermann"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
                />
                {lastNameError && (
                  <p className="text-xs text-red-600">{lastNameError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium">Firmenname (optional)</label>
              <input
                id="companyName"
                type="text"
                autoComplete="organization"
                placeholder="Musterfirma GmbH"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400"
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={!canSubmit || !hasChanges} 
                className="flex-1 cursor-pointer"
              >
                {isSubmitting ? "Wird gespeichert…" : "Speichern"}
              </Button>
              
              <Button 
                type="button"
                onClick={handleLogout}
                variant="outline"
                className="flex-1"
              >
                Abmelden
              </Button>
            </div>

            {hasChanges && (
              <p className="text-xs text-amber-600 text-center">
                Sie haben ungespeicherte Änderungen.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
