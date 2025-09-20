# Welcome-Flow und vereinfachte Registrierung

Dieses Dokument beschreibt die neuen Änderungen am Authentifizierungssystem.

## Übersicht der Änderungen

### 1. Vereinfachte Registrierung
Die Registrierung wurde vereinfacht und erfordert nur noch:
- **Email** (erforderlich)
- **Passwort** (erforderlich, mindestens 6 Zeichen)
- **Passwort bestätigen** (erforderlich)

### 2. Welcome-Seite
Nach der Registrierung werden Benutzer zur Welcome-Seite weitergeleitet, wo sie ihr Profil vervollständigen können:
- **Vorname** (erforderlich)
- **Nachname** (erforderlich)
- **Firmenname** (optional)
- **Marketing-E-Mails** (Toggle, optional)

### 3. Marketing-E-Mail Toggle
Ein neues Feature für Marketing-Einstellungen wurde hinzugefügt:
- Toggle-Box in der Welcome-Seite
- Toggle-Box in der Profil-Seite
- Speicherung in der Benutzerdatenbank
- Integration in JWT-Token

## Seiten

### `/register` (Vereinfacht)
- Nur Email und Passwort-Eingabe
- Automatische Weiterleitung zur Welcome-Seite nach Registrierung
- Keine Profildaten erforderlich

### `/welcome` (Neu)
- Profil-Vervollständigung nach Registrierung
- Vorname, Nachname, Firmenname
- Marketing-E-Mail Toggle
- "Später" Button zum Überspringen
- Automatische Weiterleitung zur Hauptseite nach Abschluss

### `/profile` (Erweitert)
- Alle Profildaten bearbeitbar
- Marketing-E-Mail Toggle hinzugefügt
- Erweiterte Beschreibung für Marketing-Einstellungen

## API-Endpunkte

### `POST /api/auth/register` (Vereinfacht)
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
    "firstName": "",
    "lastName": "",
    "companyName": "",
    "marketingEmails": false
  }
}
```

### `POST /api/auth/complete-profile` (Neu)
**Headers:** `Authorization: Bearer <jwt-token>`

```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "companyName": "Firma GmbH",
  "marketingEmails": true
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
    "companyName": "Firma GmbH",
    "marketingEmails": true
  }
}
```

### `POST /api/auth/save-update-profile` (Erweitert)
**Headers:** `Authorization: Bearer <jwt-token>`

```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "companyName": "Firma GmbH",
  "marketingEmails": true
}
```

**Response:** Wie complete-profile

## Datenstruktur

### User Interface (Erweitert)
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  marketingEmails: boolean; // Neu
}
```

### JWT Payload (Erweitert)
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  marketingEmails: boolean; // Neu
  iat?: number;
  exp?: number;
}
```

## Benutzerflow

### Neuer Benutzer
1. **Registrierung** (`/register`)
   - Email und Passwort eingeben
   - Automatische Weiterleitung zu `/welcome`

2. **Welcome-Seite** (`/welcome`)
   - Profildaten vervollständigen
   - Marketing-Einstellungen wählen
   - Weiterleitung zu `/` (Hauptseite)

### Bestehender Benutzer
1. **Login** (`/login`)
   - Email und Passwort eingeben
   - Direkte Weiterleitung zu `/` (Hauptseite)

2. **Profil bearbeiten** (`/profile`)
   - Alle Profildaten bearbeiten
   - Marketing-Einstellungen ändern

## Features

### Marketing-E-Mail Toggle
- **Welcome-Seite**: Toggle mit Beschreibung
- **Profil-Seite**: Toggle mit erweiterter Beschreibung
- **Speicherung**: In JWT-Token und Benutzerdaten
- **Standardwert**: `false` (nicht abonniert)

### Validierung
- **Vorname**: Mindestens 2 Zeichen
- **Nachname**: Mindestens 2 Zeichen
- **Passwort**: Mindestens 6 Zeichen
- **Email**: Gültige Email-Format

### Benutzerfreundlichkeit
- **"Später" Button**: Profil überspringen möglich
- **Automatische Weiterleitung**: Nach erfolgreichen Aktionen
- **Toast-Benachrichtigungen**: Für alle Aktionen
- **Responsive Design**: Mobile-optimiert

## Technische Details

### Token-Management
- JWT-Token enthalten alle Benutzerdaten inklusive Marketing-Einstellungen
- Automatische Token-Erneuerung bei Profil-Updates
- Token-Validierung bei geschützten Endpunkten

### State-Management
- AuthContext verwaltet alle Benutzerdaten
- Automatisches Laden der Benutzerdaten beim App-Start
- Konsistente Datenstruktur in allen Komponenten

### API-Design
- RESTful Endpunkte
- Konsistente Fehlerbehandlung
- JWT-basierte Authentifizierung
- Validierung auf Server- und Client-Seite

## Migration

### Bestehende Benutzer
- Bestehende Benutzer behalten ihre Profildaten
- `marketingEmails` wird auf `false` gesetzt (Standard)
- Keine Breaking Changes für bestehende Funktionalität

### Neue Benutzer
- Vereinfachter Registrierungsprozess
- Schrittweise Profil-Vervollständigung
- Bessere Benutzererfahrung

## Sicherheit

- Passwort-Validierung (mindestens 6 Zeichen)
- JWT-Token-Validierung
- Automatische Abmeldung bei ungültigem Token
- Sichere Speicherung der Marketing-Einstellungen

## TODO für Produktion

1. **Datenbankintegration**: Aktuelle Implementierung ist simuliert
2. **Email-Versand**: Marketing-E-Mails basierend auf Einstellungen
3. **Analytics**: Tracking der Marketing-Einstellungen
4. **GDPR-Compliance**: Datenschutz für Marketing-Einstellungen
5. **A/B-Testing**: Optimierung des Welcome-Flows



