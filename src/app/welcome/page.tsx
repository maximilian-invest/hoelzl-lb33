"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomePage() {
  const { addToast } = useToast();
  const { login, user, updateUser, token } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [marketingEmails, setMarketingEmails] = useState(false);
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

  useEffect(() => {
    const hash = window.location.hash;
    const cleanedHash = hash.substring(1);
    const params = new URLSearchParams(cleanedHash);
    const accessToken = params.get("access_token");
    if (!accessToken) {
      addToast({
        type: "warning",
        title: "Nicht angemeldet",
        description: "Bitte melden Sie sich an, um fortzufahren.",
        duration: 3000,
      });
      router.push('/login');
      return;
    } else {
      login(accessToken, {
        userId: '',
        email: '',
        firstName: '',
        lastName: '',
        companyName: '',
        marketingEmails: false
      });
    }
  }, []);

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

      const res = await fetch("https://fbnrefoqrdhpfzqqmeer.supabase.co/functions/v1/create-update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          company_name: companyName.trim(),
          email_consent: marketingEmails
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null; // Body ist kein JSON
      }

      if (res.ok) {
        // Aktualisierte Benutzerdaten über AuthContext speichern
        updateUser(data.user);
        
        addToast({
          type: "success",
          title: "Profil vervollständigt",
          description: `Willkommen bei allround.immo, ${data.profile.first_name}!`,
          duration: 3000,
        });
        
        // Weiterleitung zur Hauptseite
        router.push('/');
      } else {
        if (res.status === 401) {
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
            description: data.error || "Das Profil konnte nicht vervollständigt werden.",
            duration: 6000,
          });
        }
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Netzwerkfehler",
        description: "Bitte versuche es später erneut.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, companyName, marketingEmails, token, updateUser, addToast, router]);

  const handleSkip = useCallback(() => {
    addToast({
      type: "info",
      title: "Profil übersprungen",
      description: "Sie können Ihr Profil später in den Einstellungen vervollständigen.",
      duration: 3000,
    });
    router.push('/');
  }, [addToast, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center p-4">
      <img src="/logo.png" alt="allround.immo" className="w-25 mr-10" />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Willkommen bei allround.immo!</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Bitte nennen Sie uns ein paar mehr Details, damit wir Ihr Konto einrichten können.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium">Vorname *</label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Maximilian"
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

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  id="marketingEmails"
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="marketingEmails" className="text-sm font-medium text-gray-700">
                  Ich möchte Marketing-E-Mails und Updates von allround.immo erhalten
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7">
                Sie können diese Einstellung jederzeit in Ihrem Profil ändern.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={!canSubmit} 
                className="flex-1 cursor-pointer"
              >
                {isSubmitting ? "Wird gespeichert…" : "Profil vervollständigen"}
              </Button>
              
              <Button 
                type="button"
                onClick={handleSkip}
                variant="outline"
                className="flex-1 cursor-pointer"
              >
                Später
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * Pflichtfelder
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

