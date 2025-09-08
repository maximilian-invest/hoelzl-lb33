# PostgreSQL Integration für LB33

Diese Anleitung erklärt, wie du die IndexedDB durch PostgreSQL ersetzt.

## 🚀 Schnellstart

### 1. PostgreSQL installieren

**macOS (mit Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Lade PostgreSQL von https://www.postgresql.org/download/windows/

### 2. Datenbank einrichten

```bash
# PostgreSQL als Superuser starten
sudo -u postgres psql

# Datenbank und Benutzer erstellen
CREATE DATABASE lb33_projects;
CREATE USER lb33_user WITH PASSWORD 'dein_sicheres_passwort';
GRANT ALL PRIVILEGES ON DATABASE lb33_projects TO lb33_user;
\q
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env.local` Datei im Projektverzeichnis:

```bash
cp env.example .env.local
```

Bearbeite `.env.local` mit deinen Datenbankdaten:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lb33_projects
DB_USER=lb33_user
DB_PASSWORD=dein_sicheres_passwort
```

### 4. Datenbankschema erstellen

```bash
# Mit deinem Benutzer verbinden
psql -h localhost -U lb33_user -d lb33_projects

# Schema ausführen
\i src/lib/schema.sql
\q
```

### 5. Anwendung starten

```bash
npm run dev
```

## 📊 Datenbankschema

Die PostgreSQL-Implementierung verwendet drei Haupttabellen:

### `projects`
- Speichert alle Projektdaten (cfgCases, finCases, texts, etc.)
- JSONB-Felder für flexible Datenspeicherung
- Automatische Zeitstempel für created_at/updated_at

### `images`
- Speichert hochgeladene Bilder mit Metadaten
- Verknüpft mit Projekten über project_name
- Unterstützt Caption, Breite, Höhe

### `pdfs`
- Speichert hochgeladene PDF-Dokumente
- Verknüpft mit Projekten über project_name
- Unterstützt benutzerdefinierte Namen

## 🔄 Migration von IndexedDB

Die neue PostgreSQL-Implementierung ist vollständig kompatibel mit der bestehenden API. Du musst nur die Imports in deinen Komponenten ändern:

**Vorher (IndexedDB):**
```typescript
import { saveProjectAdvanced, loadProjectAdvanced } from '@/lib/storage-utils';
```

**Nachher (PostgreSQL):**
```typescript
import { saveProjectAdvanced, loadProjectAdvanced } from '@/lib/storage-utils-postgres';
```

## 🛠 API-Endpunkte

### Projekte
- `GET /api/projects` - Alle Projekte laden
- `POST /api/projects` - Neues Projekt speichern
- `GET /api/projects/[name]` - Einzelnes Projekt laden
- `PUT /api/projects/[name]` - Projekt aktualisieren
- `DELETE /api/projects/[name]` - Projekt löschen

### Speicher
- `GET /api/storage` - Speicherinformationen abrufen
- `POST /api/storage/cleanup` - Speicher bereinigen

## 🔧 Vorteile der PostgreSQL-Lösung

### ✅ Vorteile
- **Skalierbarkeit**: Unbegrenzter Speicherplatz
- **Zuverlässigkeit**: ACID-Transaktionen
- **Performance**: Optimierte Indizes und Abfragen
- **Sicherheit**: Benutzerbasierte Zugriffskontrolle
- **Backup**: Einfache Datensicherung
- **Multi-User**: Mehrere Benutzer können gleichzeitig arbeiten

### ⚠️ Überlegungen
- **Server-Abhängigkeit**: Benötigt laufenden PostgreSQL-Server
- **Netzwerk**: API-Aufrufe statt lokaler Speicherung
- **Komplexität**: Mehr Infrastruktur zu verwalten

## 🚀 Deployment

### Vercel/Netlify
Verwende eine externe PostgreSQL-Datenbank (z.B. Supabase, Neon, Railway):

```env
DB_HOST=dein-db-host.com
DB_PORT=5432
DB_NAME=lb33_projects
DB_USER=dein_user
DB_PASSWORD=dein_passwort
```

### Docker
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: lb33_projects
      POSTGRES_USER: lb33_user
      POSTGRES_PASSWORD: dein_passwort
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔍 Troubleshooting

### Verbindungsfehler
```bash
# Prüfe, ob PostgreSQL läuft
brew services list | grep postgresql

# Teste Verbindung
psql -h localhost -U lb33_user -d lb33_projects -c "SELECT NOW();"
```

### Schema-Fehler
```bash
# Schema erneut ausführen
psql -h localhost -U lb33_user -d lb33_projects -f src/lib/schema.sql
```

### Performance-Optimierung
```sql
-- Indizes prüfen
\d+ projects
\d+ images
\d+ pdfs

-- Query-Performance analysieren
EXPLAIN ANALYZE SELECT * FROM projects WHERE name = 'test';
```
