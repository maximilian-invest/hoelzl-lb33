import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email ist erforderlich' },
        { status: 400 }
      );
    }

    // TODO: Hier sollte die echte Passwort-Reset-Logik implementiert werden
    // In der echten Implementierung würden Sie:
    // 1. Prüfen ob Email in der Datenbank existiert
    // 2. Reset-Token generieren und in der Datenbank speichern
    // 3. Reset-Email mit Link senden

    // Simulierte Antwort
    return NextResponse.json({
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Passwort-Reset-Link gesendet.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

