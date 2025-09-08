import { NextRequest, NextResponse } from 'next/server';
import { getPostgresStorageInfo, cleanupPostgres } from '@/lib/postgres-utils';

// GET /api/storage - Speicherinformationen abrufen
export async function GET() {
  try {
    const storageInfo = await getPostgresStorageInfo();
    
    return NextResponse.json({
      success: true,
      storage: storageInfo
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Speicherinformationen:', error);
    return NextResponse.json(
      { error: 'Speicherinformationen konnten nicht abgerufen werden' },
      { status: 500 }
    );
  }
}

// POST /api/storage/cleanup - Speicher bereinigen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'cleanup') {
      const result = await cleanupPostgres();
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Speicher erfolgreich bereinigt',
        freedBytes: result.freedBytes
      });
    }

    return NextResponse.json(
      { error: 'Unbekannte Aktion' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Fehler bei der Speicherbereinigung:', error);
    return NextResponse.json(
      { error: 'Speicher konnte nicht bereinigt werden' },
      { status: 500 }
    );
  }
}
