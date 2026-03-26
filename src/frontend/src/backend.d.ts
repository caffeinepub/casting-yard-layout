import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LayoutProject {
    name: string;
    elements: Array<PlacedElement>;
}
export interface PlacedElement {
    id: bigint;
    height: number;
    status: ElementStatus;
    name: string;
    color: string;
    yPosition: number;
    xPosition: number;
    rotationAngle: number;
    width: number;
    elementType: ElementType;
}
export enum ElementStatus {
    complete = "complete",
    planned = "planned",
    inProgress = "inProgress"
}
export enum ElementType {
    beam = "beam",
    slab = "slab",
    wall = "wall",
    column = "column",
    girder = "girder"
}
export interface backendInterface {
    addElementToProject(projectName: string, element: PlacedElement): Promise<void>;
    createProject(name: string): Promise<void>;
    deleteProject(name: string): Promise<void>;
    getProject(name: string): Promise<LayoutProject>;
    listProjects(): Promise<Array<LayoutProject>>;
    removeElementFromProject(projectName: string, elementId: bigint): Promise<void>;
    updateElementInProject(projectName: string, elementId: bigint, newElement: PlacedElement): Promise<void>;
    updateFullElementList(projectName: string, newElements: Array<PlacedElement>): Promise<void>;
}
