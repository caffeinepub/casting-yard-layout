import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { YardElement } from "../types/yard";

// This app stores data in localStorage via useProjects hook.
// The backend canister integration is stubbed here.

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectName: _projectName,
      elements: _elements,
    }: { projectName: string; elements: YardElement[] }) => {
      // No-op: projects are saved to localStorage via useProjects
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
