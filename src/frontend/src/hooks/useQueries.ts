import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LayoutProject, PlacedElement } from "../backend.d";
import type { ElementStatus, ElementType } from "../backend.d";
import type { YardElement } from "../types/yard";
import { useActor } from "./useActor";

function toBackendElement(el: YardElement): PlacedElement {
  return {
    id: el.id,
    name: el.name,
    elementType: el.elementType as ElementType,
    width: el.width,
    height: el.height,
    xPosition: el.xPosition,
    yPosition: el.yPosition,
    rotationAngle: el.rotationAngle,
    color: el.color,
    status: el.status as ElementStatus,
  };
}

function fromBackendElement(el: PlacedElement): YardElement {
  return {
    id: el.id,
    name: el.name,
    elementType: el.elementType as YardElement["elementType"],
    width: el.width,
    height: el.height,
    xPosition: el.xPosition,
    yPosition: el.yPosition,
    rotationAngle: el.rotationAngle,
    color: el.color,
    status: el.status as YardElement["status"],
    height3d: 0.6,
    shape: "rectangle" as const,
  };
}

export function useListProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<LayoutProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProject(name: string) {
  const { actor, isFetching } = useActor();
  return useQuery<YardElement[]>({
    queryKey: ["project", name],
    queryFn: async () => {
      if (!actor || !name) return [];
      try {
        const project = await actor.getProject(name);
        return project.elements.map(fromBackendElement);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!name,
  });
}

export function useSaveProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectName,
      elements,
    }: { projectName: string; elements: YardElement[] }) => {
      if (!actor) throw new Error("No actor");
      try {
        await actor.createProject(projectName);
      } catch {
        // project may already exist
      }
      await actor.updateFullElementList(
        projectName,
        elements.map(toBackendElement),
      );
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["project", variables.projectName] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
