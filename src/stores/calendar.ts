import { atom } from "nanostores"
import type { CalendarApi } from "@fullcalendar/core/index.js"
import { getWeek } from "date-fns"

export const calendarApi = atom<CalendarApi | undefined>(undefined)

export const weekNumber = atom<number>(getWeek(new Date()))
