export interface Project {
  id: string
  title: string
  updatedAt: string
}

const STORAGE_KEY = 'projects'

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Project[]
  } catch {
    return []
  }
}

export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return
  const projects = getProjects().filter((p) => p.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}
