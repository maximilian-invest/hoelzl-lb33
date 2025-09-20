interface ProjectConfig {
  adresse: string;
  stadtteil: string;
  bauart: 'bestand' | 'neubau';
  objektTyp: string;
  baujahr: number;
  sanierungen: string[];
  energiewerte: {
    hwb: number;
    fgee: number;
    heizung: string;
    dachung: string;
    fenster: string;
    waermedaemmung: string;
  };
  units: Array<{
    flaeche: number;
    miete: number;
    typ: 'wohnung' | 'gewerbe';
    stockwerk: string;
    bezeichnung: string;
    zimmer?: number;
    schlafzimmer?: number;
    wc?: number;
    balkon?: boolean;
    balkonGroesse?: number;
    terrasse?: boolean;
    terrasseGroesse?: number;
    garten?: boolean;
    gartenGroesse?: number;
    keller?: boolean;
    kellerGroesse?: number;
    parkplatz?: boolean;
    parkplatzAnzahl?: number;
    aufzug?: boolean;
    einbaukueche?: boolean;
    badewanne?: boolean;
    dusche?: boolean;
  }>;
  kaufpreis: number;
  nebenkosten: number;
  ekQuote: number;
  tilgung: number;
  laufzeit: number;
  marktMiete: number;
  wertSteigerung: number;
}

interface CreateProjectRequest {
  name: string;
  description: string;
  config: ProjectConfig;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  config?: ProjectConfig; // Optional, da es in der API-Antwort nicht enthalten ist
}

const API_BASE_URL = 'https://fbnrefoqrdhpfzqqmeer.supabase.co/functions/v1';

export async function createProject(
  token: string,
  projectData: CreateProjectRequest
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/create-project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create project: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function fetchProjects(token: string): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/fetch-projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch projects: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  // Die API gibt die Projekte in einem 'project' Array zurück
  return data.project || [];
}

export async function deleteProject(token: string, projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/delete-project`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId: projectId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete project: ${response.status} ${errorText}`);
  }
}

export type { Project, CreateProjectRequest, ProjectConfig };
