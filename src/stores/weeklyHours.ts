import { minutesToDots } from "@/helpers/time/minutesToDots"
import { atom, computed } from "nanostores"
import { getDay } from "date-fns"

export const weeklyMinutes = atom({
	planned: 0,
	available: 0,
})

export const formattedWeeklyHours = computed(weeklyMinutes, (hours) => ({
	planned: minutesToDots(hours.planned),
	available: minutesToDots(hours.available),
	buffer: minutesToDots(hours.available - hours.planned),
}))

export const availableMinutesByDay = atom<number[]>([])

export const plannedUntilToday = computed(
	availableMinutesByDay,
	(availByDay) => {
		let tot = 0
		for (let i = 0; i <= getDay(new Date()); i++) tot += availByDay[i]
		return tot
	}
)
