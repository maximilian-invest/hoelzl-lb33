# Authentifizierungssystem

Dieses Dokument beschreibt das neue Email/Passwort-Authentifizierungssystem für allround.immo.

## Übersicht

Das System wurde von Magic-Link-Authentifizierung auf traditionelle Email/Passwort-Authentifizierung umgestellt und umfasst:

- **Login** mit Email und Passwort
- **Registrierung** mit Email, Passwort, Vor- und Nachname (optional: Firmenname)
- **Passwort-Reset** über Email-Link
- **Profil-Update** für Benutzerdaten
- **JWT-Token-basierte** Authentifizierung

## Seiten

### `/login`
- Email und Passwort-Eingabe
- Validierung der Eingaben
- Automatische Weiterleitung nach erfolgreichem Login
- Link zur Registrierung und Passwort-Reset

### `/register`
- Vollständiges Registrierungsformular mit:
  - Vor- und Nachname (erforderlich)
  - Email (erforderlich)
  - Passwort mit Bestätigung (erforderlich)
  - Firmenname (optional)
- Automatische Anmeldung nach erfolgreicher Registrierung

### `/reset-password`
- Email-Eingabe für Passwort-Reset
- Bestätigungsseite nach dem Senden
- Link zurück zur Anmeldung

### `/profile`
- Bearbeitung der Benutzerdaten (Vor-/Nachname, Firmenname)
- Email kann nicht geändert werden
- Abmelde-Funktion
- Automatische Weiterleitung bei ungültigem Token

## API-Endpunkte

### `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "companyName": "Firma GmbH"
  }
}
```

### `POST /api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Max",
  "lastName": "Mustermann",
  "companyName": "Firma GmbH"
}
```

**Response:** Wie Login

### `POST /api/auth/reset-password`
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset-Link wurde gesendet"
}
```

### `POST /api/auth/save-update-profile`
**Headers:** `Authorization: Bearer <jwt-token>`

```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "companyName": "Firma GmbH"
}
```

**Response:**
```json
{
  "success": true,
  "token": "updated-jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "companyName": "Firma GmbH"
  }
}
```

## Authentifizierung

### JWT-Token
- 24 Stunden gültig
- Enthält Benutzerdaten (ID, Email, Name, Firma)
- Automatische Erneuerung bei Profil-Updates
- Speicherung im localStorage

### AuthContext
- Zentraler State-Management für Authentifizierung
- Automatisches Laden der Benutzerdaten beim App-Start
- Logout-Funktion mit localStorage-Bereinigung

### Sicherheit
- Passwort-Validierung (mindestens 6 Zeichen)
- JWT-Token-Validierung bei geschützten Endpunkten
- Automatische Abmeldung bei ungültigem Token

## Umgebungsvariablen

Fügen Sie zu Ihrer `.env.local` hinzu:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Wichtig:** Verwenden Sie in der Produktion einen starken, zufälligen Secret!

## Komponenten

### `AuthNav`
Navigation-Komponente, die je nach Authentifizierungsstatus verschiedene Buttons anzeigt:
- Nicht angemeldet: "Anmelden" und "Registrieren"
- Angemeldet: Begrüßung, "Profil" und "Abmelden"

### `AuthProvider`
React Context Provider für Authentifizierung, umhüllt die gesamte App im Layout.

## Verwendung

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Bitte anmelden</div>;
  }
  
  return <div>Hallo, {user?.firstName}!</div>;
}
```

## TODO für Produktion

1. **Datenbankintegration**: Aktuelle Implementierung ist simuliert
2. **Passwort-Hashing**: bcrypt oder ähnliches verwenden
3. **Email-Versand**: Echte Email-Integration für Passwort-Reset
4. **Rate Limiting**: Schutz vor Brute-Force-Angriffen
5. **CSRF-Schutz**: Zusätzliche Sicherheitsmaßnahmen
6. **Session-Management**: Erweiterte Token-Verwaltung

