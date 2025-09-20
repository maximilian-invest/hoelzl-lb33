"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AuthNav() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex space-x-2">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Anmelden
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">
            Registrieren
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-sm text-gray-600">
        Hallo, {user?.first_name}!
      </span>
      <Link href="/profile">
        <Button variant="outline" size="sm">
          Profil
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={logout}
      >
        Abmelden
      </Button>
    </div>
  );
}

