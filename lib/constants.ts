import { TemplateField } from "@/lib/types";

export const TEMPLATE_KEY = "journal:template";
export const INDEX_KEY = "journal:index";
export const FIELD_LABELS_KEY = "journal:field-labels";
export const FIELD_DEFINITIONS_KEY = "journal:field-definitions";
export const DESCRIPTION_KEY = "journal:description";
export const DEFAULT_DESCRIPTION = "每天仅一条日记，键格式：journal:YYYY-MM-DD（编辑会更新当天记录）。";

export const DEFAULT_TEMPLATE: TemplateField[] = [
  { id: "mood", type: "scale", label: "Mood", min: 1, max: 5 },
  { id: "energy", type: "scale", label: "Energy", min: 1, max: 5 },
  { id: "exercise", type: "boolean", label: "Exercise" },
  { id: "note", type: "text", label: "Note" }
];
