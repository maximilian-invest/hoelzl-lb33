import { NextRequest, NextResponse } from 'next/server';
import { 
  loadProjectFromPostgres, 
  saveProjectToPostgres, 
  deleteProjectFromPostgres 
} from '@/lib/postgres-utils';

// GET /api/projects/[projectName] - Einzelnes Projekt laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const { projectName } = await params;
    const decodedName = decodeURIComponent(projectName);

    const result = await loadProjectFromPostgres(decodedName);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Projekt nicht gefunden' ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.data
    });
  } catch (error) {
    console.error('Fehler beim Laden des Projekts:', error);
    return NextResponse.json(
      { error: 'Projekt konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectName] - Projekt aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const { projectName } = await params;
    const decodedName = decodeURIComponent(projectName);
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Projektdaten sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await saveProjectToPostgres(decodedName, data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Projekt erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekts:', error);
    return NextResponse.json(
      { error: 'Projekt konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectName] - Projekt löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const { projectName } = await params;
    const decodedName = decodeURIComponent(projectName);

    const result = await deleteProjectFromPostgres(decodedName);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Projekt erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Fehler beim Löschen des Projekts:', error);
    return NextResponse.json(
      { error: 'Projekt konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
