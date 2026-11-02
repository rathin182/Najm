export const FUTURE_PROJECT_STATUSES = [
  "Announced",
  "Planning",
  "Under construction",
  "Phased opening",
  "Building now",
  "Completed",
] as const;

export type FutureProjectStatus = (typeof FUTURE_PROJECT_STATUSES)[number];

export type FutureProject = {
  id: string;
  name: string;
  region: string;
  status: FutureProjectStatus;
  deadlineDate: string;
  deadlineNote: string;
  budget: number | null;
  text: string;
  image: string;
  imageAlt: string;
  published: boolean;
  order: number;
  latitude: number | null;
  longitude: number | null;
};

export type FutureProjectDraft = Omit<FutureProject, "id"> & { id?: string };

type LegacyProject = Partial<FutureProject> & {
  budget?: number | string | null;
  deadline?: string;
  id?: string;
  name?: string;
  status?: string;
};

export function parseBudget(value: string): number | null {
  const match = value.match(/([\d,.]+)\s*(trillion|billion|million)?/i);
  if (!match) return null;
  const amount = Number(match[1]?.replaceAll(",", ""));
  const unit = match[2]?.toLowerCase();
  const multiplier =
    unit === "trillion" ? 1e12 : unit === "billion" ? 1e9 : unit === "million" ? 1e6 : 1;
  return Number.isFinite(amount) ? amount * multiplier : null;
}

export function formatBudget(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Budget not set";
  return `SAR ${new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "long",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

export function formatDeadline(
  project: Pick<FutureProject, "deadlineDate" | "deadlineNote">,
): string {
  if (!project.deadlineDate) return project.deadlineNote || "Deadline not set";
  const date = new Date(`${project.deadlineDate}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return project.deadlineNote ? `${formattedDate} (${project.deadlineNote})` : formattedDate;
}

export function normalizeLegacyProjects(value: unknown): FutureProject[] | null {
  if (!Array.isArray(value)) return null;
  const projects: FutureProject[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const saved = item as LegacyProject;
    if (typeof saved.id !== "string" || typeof saved.name !== "string") return null;
    const oldBudget = typeof saved.budget === "string" ? parseBudget(saved.budget) : null;
    projects.push({
      id: saved.id,
      name: saved.name,
      region: typeof saved.region === "string" ? saved.region : "",
      status: FUTURE_PROJECT_STATUSES.includes(saved.status as FutureProjectStatus)
        ? (saved.status as FutureProjectStatus)
        : "Announced",
      deadlineDate: typeof saved.deadlineDate === "string" ? saved.deadlineDate : "",
      deadlineNote:
        typeof saved.deadlineNote === "string"
          ? saved.deadlineNote
          : typeof saved.deadline === "string"
            ? saved.deadline
            : "",
      budget: typeof saved.budget === "number" ? saved.budget : oldBudget,
      text: typeof saved.text === "string" ? saved.text : "",
      image: typeof saved.image === "string" ? saved.image : "",
      imageAlt: typeof saved.imageAlt === "string" ? saved.imageAlt : saved.name,
      published: saved.published === true,
      order: typeof saved.order === "number" ? saved.order : projects.length + 1,
      latitude: typeof saved.latitude === "number" ? saved.latitude : null,
      longitude: typeof saved.longitude === "number" ? saved.longitude : null,
    });
  }
  return projects;
}

export function emptyFutureProject(order: number): FutureProjectDraft {
  return {
    name: "",
    region: "",
    status: "Announced",
    deadlineDate: "",
    deadlineNote: "",
    budget: null,
    text: "",
    image: "",
    imageAlt: "",
    published: true,
    order,
    latitude: null,
    longitude: null,
  };
}
