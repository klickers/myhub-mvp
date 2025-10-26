import { computed, deepMap } from "nanostores"
import type { Session } from "@/types/session"

export const sessions = deepMap<Record<number, Session>>({})

export const sessionsByDay = computed(sessions, (sessions) => {
	const week: Session[][] = Array.from({ length: 7 }, () => [])
	for (const session of Object.values(sessions)) {
		const dayIndex = session.startTime.getDay()
		week[dayIndex].push(session)
	}
	return week
})
