export type TabId =
  | "stats"
  | "users"
  | "images"
  | "captions"
  | "flavors"
  | "llm"
  | "terms";

export const tabs: { id: TabId; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "users", label: "Users" },
  { id: "images", label: "Images" },
  { id: "captions", label: "Captions" },
  { id: "flavors", label: "Flavors" },
  { id: "llm", label: "LLM" },
  { id: "terms", label: "Terms" }
];
