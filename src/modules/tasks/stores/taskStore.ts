import { writable, derived } from "svelte/store";

export type TaskStatus = "To do" | "Doing" | "Done";
export type TaskPriority = "Urgent" | "Normal" | "Low";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: { name: string; color: string }[];
  attachments: number;
  comments: number;
  checklist: string | null;
  users: string[];
}

export const labels = writable([
  { id: "todo", name: "To do", color: "bg-orange-500 text-white" },
  { id: "doing", name: "Doing", color: "bg-blue-500 text-white" },
  { id: "done", name: "Done", color: "bg-pink-500 text-white" },
]);

// Initial mock data
const initialTasks: Task[] = [
  {
    id: 1,
    title: "Q3 Evaluation",
    description: "Q3 team and product evaluation",
    status: "To do",
    priority: "Urgent",
    dueDate: "11 Jan 2025",
    tags: [
      { name: "Internal", color: "text-emerald-700 bg-emerald-50" },
      { name: "Urgent", color: "text-rose-700 bg-rose-50" },
    ],
    attachments: 2,
    comments: 2,
    checklist: "2/2",
    users: [
      "https://ui-avatars.com/api/?name=J&background=random",
      "https://ui-avatars.com/api/?name=S&background=random",
    ],
  },
  {
    id: 2,
    title: "Monthly report",
    description: "Monthly team and individual reports",
    status: "To do",
    priority: "Normal",
    dueDate: "11 Jan 2025",
    tags: [
      { name: "Internal", color: "text-emerald-700 bg-emerald-50" },
      { name: "Lead", color: "text-amber-700 bg-amber-50" },
    ],
    attachments: 1,
    comments: 3,
    checklist: null,
    users: [
      "https://ui-avatars.com/api/?name=A&background=random",
      "https://ui-avatars.com/api/?name=B&background=random",
    ],
  },
  {
    id: 3,
    title: "Factory Visit",
    description: "Jakarta factory visit",
    status: "To do",
    priority: "Urgent",
    dueDate: "11 Jan 2025",
    tags: [{ name: "Lead", color: "text-amber-700 bg-amber-50" }],
    attachments: 0,
    comments: 1,
    checklist: "4/12",
    users: [
      "https://ui-avatars.com/api/?name=C&background=random",
      "https://ui-avatars.com/api/?name=D&background=random",
    ],
  },
  {
    id: 4,
    title: "Print Brochures",
    description: "Print the latest marketing brochures",
    status: "To do",
    priority: "Normal",
    dueDate: "11 Jan 2025",
    tags: [{ name: "Lead", color: "text-amber-700 bg-amber-50" }],
    attachments: 0,
    comments: 0,
    checklist: null,
    users: [],
  },
  {
    id: 5,
    title: "Preparation of Q2 report",
    description: "Making monthly reports",
    status: "Doing",
    priority: "Normal",
    dueDate: "12 Jan 2025",
    tags: [{ name: "Internal", color: "text-emerald-700 bg-emerald-50" }],
    attachments: 0,
    comments: 4,
    checklist: null,
    users: [
      "https://ui-avatars.com/api/?name=E&background=random",
      "https://ui-avatars.com/api/?name=F&background=random",
    ],
  },
  {
    id: 6,
    title: "March product exhibition",
    description: "Preparation for the March product exhibition",
    status: "Doing",
    priority: "Urgent",
    dueDate: "12 Jan 2025",
    tags: [{ name: "Urgent", color: "text-rose-700 bg-rose-50" }],
    attachments: 1,
    comments: 0,
    checklist: null,
    users: ["https://ui-avatars.com/api/?name=G&background=random"],
  },
  {
    id: 7,
    title: "Digital Marketing",
    description: "Marketing campaign for the month of Ramadhan...",
    status: "Done",
    priority: "Low",
    dueDate: "10 Jan 2025",
    tags: [
      { name: "Internal", color: "text-emerald-700 bg-emerald-50" },
      { name: "Lead", color: "text-amber-700 bg-amber-50" },
    ],
    attachments: 1,
    comments: 0,
    checklist: null,
    users: [
      "https://ui-avatars.com/api/?name=H&background=random",
      "https://ui-avatars.com/api/?name=I&background=random",
    ],
  },
  {
    id: 8,
    title: "Event 3.3",
    description: "Preparation for event 3.3",
    status: "Done",
    priority: "Urgent",
    dueDate: "10 Jan 2025",
    tags: [{ name: "Urgent", color: "text-rose-700 bg-rose-50" }],
    attachments: 0,
    comments: 0,
    checklist: null,
    users: [
      "https://ui-avatars.com/api/?name=J&background=random",
      "https://ui-avatars.com/api/?name=K&background=random",
      "https://ui-avatars.com/api/?name=L&background=random",
    ],
  },
  {
    id: 9,
    title: "New Product Development",
    description: "Preparation for new product launch Q2",
    status: "Done",
    priority: "Normal",
    dueDate: "10 Jan 2025",
    tags: [{ name: "Lead", color: "text-amber-700 bg-amber-50" }],
    attachments: 0,
    comments: 3,
    checklist: "4/12",
    users: ["https://ui-avatars.com/api/?name=M&background=random"],
  },
];

export const tasksData = writable<Task[]>(initialTasks);

export const filterQuery = writable("");
export const activeLabelFilter = writable("All Tasks"); // "All Tasks", "To do", "Doing", "Done"
export const activeSort = writable("none"); // "none", "title", "dueDate", "priority"

export const filteredTasks = derived(
  [tasksData, filterQuery, activeLabelFilter, activeSort],
  ([$tasksData, $filterQuery, $activeLabelFilter, $activeSort]) => {
    let result = [...$tasksData];

    if ($filterQuery.trim() !== "") {
      const q = $filterQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    if ($activeLabelFilter !== "All Tasks") {
      result = result.filter((t) => t.status === $activeLabelFilter);
    }

    if ($activeSort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if ($activeSort === "dueDate") {
      // Very basic string sort for dummy dates
      result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if ($activeSort === "priority") {
      const priorityMap: Record<string, number> = {
        Urgent: 1,
        Normal: 2,
        Low: 3,
      };
      result.sort(
        (a, b) => (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4)
      );
    }

    return result;
  }
);
