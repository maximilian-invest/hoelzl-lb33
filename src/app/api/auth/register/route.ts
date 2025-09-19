import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // TODO: Hier sollte die echte Registrierung in der Datenbank erfolgen
    // In der echten Implementierung würden Sie:
    // 1. Prüfen ob Email bereits existiert
    // 2. Passwort hashen
    // 3. Benutzer in der Datenbank speichern (ohne Profildaten)
    // 4. Temporären JWT-Token erstellen

    // Simulierte Benutzerdaten (ohne Profildaten)
    const user = {
      id: Date.now().toString(), // Simulierte ID
      email: email,
      firstName: '',
      lastName: '',
      companyName: '',
      marketingEmails: false
    };

    // JWT-Token erstellen (ohne Profildaten)
    const token = createToken({
      userId: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      marketingEmails: user.marketingEmails
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        marketingEmails: user.marketingEmails
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
