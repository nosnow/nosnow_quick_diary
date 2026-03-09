export type TemplateFieldType = "scale" | "boolean" | "text" | "number";

export type BaseTemplateField = {
  id: string;
  label: string;
  type: TemplateFieldType;
};

export type ScaleTemplateField = BaseTemplateField & {
  type: "scale";
  min?: number;
  max?: number;
  scoreDescriptions?: Record<string, string>;
};

export type BooleanTemplateField = BaseTemplateField & {
  type: "boolean";
};

export type TextTemplateField = BaseTemplateField & {
  type: "text";
};

export type NumberTemplateField = BaseTemplateField & {
  type: "number";
};

export type TemplateField =
  | ScaleTemplateField
  | BooleanTemplateField
  | TextTemplateField
  | NumberTemplateField;

export type DiaryRecord = Record<string, string | number | boolean | null>;
