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

interface ProjectFile {
  id: string;
  name: string;
  project_type: 'image' | 'pdf';
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  config?: ProjectConfig; // Optional, da es in der API-Antwort nicht enthalten ist
  project_files?: ProjectFile[]; // Neue Dateien aus der API
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

export async function fetchProject(token: string, projectId: string): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/get-project/${projectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch project: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('fetchProject API Response:', data);
  console.log('data.project:', data.project);
  return data.project;
}

export async function updateProject(
  token: string,
  projectId: string,
  projectData: CreateProjectRequest
): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/update-project`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ 
      projectId: projectId,
      ...projectData 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update project: ${response.status} ${errorText}`);
  }

  return response.json();
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

export async function uploadProjectFile(
  token: string,
  projectId: string,
  file: File
): Promise<{ success: boolean; message?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('project_id', projectId);

  const response = await fetch(`${API_BASE_URL}/upload-project-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getSignedUrl(
  token: string,
  fileId: string
): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE_URL}/get-signed-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ fileId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get signed URL: ${response.status} ${errorText}`);
  }

  return response.json();
}

export type { Project, CreateProjectRequest, ProjectConfig, ProjectFile };
