import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, createToken, getTokenFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, companyName, marketingEmails } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Vor- und Nachname sind erforderlich' },
        { status: 400 }
      );
    }

    // JWT-Token aus Authorization Header extrahieren
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Autorisierung erforderlich' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Ungültiger Token' },
        { status: 401 }
      );
    }
      
    // TODO: Hier sollte das Profil in der Datenbank aktualisiert werden
    // In der echten Implementierung würden Sie:
    // 1. Benutzer anhand der userId aus dem Token finden
    // 2. Profildaten in der Datenbank aktualisieren
    // 3. Marketing-Einstellungen speichern
    // 4. Neuen JWT-Token mit aktualisierten Daten erstellen

    // Neuen JWT-Token mit aktualisierten Daten erstellen
    const updatedToken = createToken({
      userId: decoded.userId,
      email: decoded.email,
      firstName: firstName,
      lastName: lastName,
      companyName: companyName || '',
      marketingEmails: marketingEmails || false
    });

    return NextResponse.json({
      success: true,
      token: updatedToken,
      user: {
        id: decoded.userId,
        email: decoded.email,
        firstName: firstName,
        lastName: lastName,
        companyName: companyName || '',
        marketingEmails: marketingEmails || false
      }
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

