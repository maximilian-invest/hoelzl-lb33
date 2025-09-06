import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, deleteProject, Project } from '@/lib/projects'

export default function ProjektePage() {
  const [projects, setProjects] = useState<Project[]>([])

  const refresh = () => {
    setProjects(getProjects())
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleDelete = (id: string) => {
    deleteProject(id)
    refresh()
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Projekte</h1>
      <div className="mb-4">
        <Link href="/projekt/neu" className="px-4 py-2 bg-blue-500 text-white rounded">
          Neues Projekt
        </Link>
      </div>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center space-x-4">
            <span className="flex-1">
              {p.title} – {p.updatedAt}
            </span>
            <Link href={`/projekt/${p.id}`} className="px-2 py-1 bg-gray-200 rounded">
              Öffnen
            </Link>
            <button
              onClick={() => handleDelete(p.id)}
              className="px-2 py-1 bg-red-500 text-white rounded"
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
