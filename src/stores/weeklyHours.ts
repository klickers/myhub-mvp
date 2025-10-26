import { minutesToDots } from "@/helpers/time/minutesToDots"
import { atom, computed } from "nanostores"

export const weeklyMinutes = atom({
	planned: 0,
	available: 0,
})

export const formattedWeeklyHours = computed(weeklyMinutes, (hours) => ({
	planned: minutesToDots(hours.planned),
	available: minutesToDots(hours.available),
	buffer: minutesToDots(hours.available - hours.planned),
}))
