import { NextRequest, NextResponse } from 'next/server';
import { getAllProjectsFromPostgres, saveProjectToPostgres } from '@/lib/postgres-utils';

// GET /api/projects - Alle Projekte laden
export async function GET() {
  try {
    const result = await getAllProjectsFromPostgres();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: result.projects || {}
    });
  } catch (error) {
    console.error('Fehler beim Laden der Projekte:', error);
    return NextResponse.json(
      { error: 'Projekte konnten nicht geladen werden' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Neues Projekt speichern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, data } = body;

    if (!name || !data) {
      return NextResponse.json(
        { error: 'Projektname und Daten sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await saveProjectToPostgres(name, data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Projekt erfolgreich gespeichert'
    });
  } catch (error) {
    console.error('Fehler beim Speichern des Projekts:', error);
    return NextResponse.json(
      { error: 'Projekt konnte nicht gespeichert werden' },
      { status: 500 }
    );
  }
}
