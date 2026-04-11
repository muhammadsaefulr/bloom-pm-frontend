import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Action } from "svelte/action";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T> = T & {
	ref?: T extends HTMLInputElement
		? HTMLInputElement
		: T extends HTMLDivElement
			? HTMLDivElement
			: HTMLElement | null;
};
