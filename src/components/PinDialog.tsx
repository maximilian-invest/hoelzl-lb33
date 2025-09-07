"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Lock, CheckCircle, XCircle } from "lucide-react";

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPinVerified: (pin: string) => void;
  title?: string;
  description?: string;
}

export function PinDialog({ 
  isOpen, 
  onClose, 
  onPinVerified, 
  title = "PIN eingeben",
  description = "Geben Sie den 4-stelligen PIN ein, um fortzufahren:"
}: PinDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus auf Input wenn Dialog geöffnet wird
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // PIN auf 4 Ziffern begrenzen
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  // PIN verifizieren
  const handleVerify = async () => {
    if (pin.length !== 4) {
      setError("Bitte geben Sie einen 4-stelligen PIN ein");
      return;
    }

    setIsVerifying(true);
    
    // Simuliere Verifikation (hier könntest du eine echte API-Verifikation einbauen)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Für Demo-Zwecke: PIN "1234" ist gültig
    if (pin === "1234") {
      onPinVerified(pin);
      setPin("");
      setError("");
    } else {
      setError("Falscher PIN. Versuchen Sie es erneut.");
    }
    
    setIsVerifying(false);
  };

  // Enter-Taste für Verifikation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.length === 4) {
      handleVerify();
    }
  };

  // Dialog schließen
  const handleClose = () => {
    setPin("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white dark:bg-slate-800">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="pin-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              PIN (4 Ziffern)
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="pin-input"
                type="password"
                value={pin}
                onChange={handlePinChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                placeholder="••••"
                maxLength={4}
                disabled={isVerifying}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <XCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isVerifying}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleVerify}
              disabled={pin.length !== 4 || isVerifying}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifiziere...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Bestätigen
                </div>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
