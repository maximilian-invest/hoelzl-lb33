import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params;
    const { searchParams } = new URL(request.url);
    const locked = searchParams.get('locked') === 'true';

    // Hier könntest du eine echte Datenbank-Abfrage machen
    // Für jetzt simulieren wir das Laden des Projekts
    const projectData = {
      name: decodeURIComponent(projectName),
      locked,
      message: locked 
        ? 'Projekt wurde im gesperrten Modus geöffnet. PIN erforderlich zur Bearbeitung.'
        : 'Projekt wurde geöffnet.'
    };

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Fehler beim Laden des Projekts:', error);
    return NextResponse.json(
      { error: 'Projekt konnte nicht geladen werden' },
      { status: 500 }
    );
  }
}
