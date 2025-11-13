import { atom } from "nanostores"

export const businessHours = atom<
	{ id: number; daysOfWeek: number[]; startTime: string; endTime: string }[]
>([])
