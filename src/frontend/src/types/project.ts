export interface SavedProject {
  id: string;
  projectName: string;
  yardLength: number;
  yardWidth: number;
  elementCount: number;
  lastModified: string; // ISO string
  data: string; // full JSON string of the .cyld file
}
