import { useCallback, useEffect, useState } from "react";
import type { SavedProject } from "../types/project";

const STORAGE_KEY = "cyld_projects";

function getProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProject[];
  } catch {
    return [];
  }
}

function persistProjects(projects: SavedProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function useProjects() {
  const [projects, setProjects] = useState<SavedProject[]>(getProjects);

  const refresh = useCallback(() => {
    setProjects(getProjects());
  }, []);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const saveProject = useCallback((p: SavedProject) => {
    setProjects((prev) => {
      const existing = prev.findIndex((x) => x.id === p.id);
      const next =
        existing >= 0 ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      persistProjects(next);
      return next;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((x) => x.id !== id);
      persistProjects(next);
      return next;
    });
  }, []);

  return { projects, saveProject, deleteProject, refresh };
}
