import { useStore } from "@nanostores/react"
import { weekNumber } from "@/stores/calendar"

export default function WeeklyTitle() {
	const $weekNumber = useStore(weekNumber)

	return (
		<h1 className="mb-0">
			Week <span>{$weekNumber}</span>
		</h1>
	)
}
