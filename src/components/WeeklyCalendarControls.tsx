import { Icon } from "@iconify/react"
import { useStore } from "@nanostores/react"
import { calendarApi, weekNumber } from "@/stores/calendar"
import { isThisWeek } from "date-fns"

export default function WeeklyCalendarControls() {
	const $weekNumber = useStore(weekNumber) // TODO: temporary fix to trigger rerenders
	const $calendarApi = useStore(calendarApi)

	return (
		<div className="flex gap-3">
			<button
				className="text-xl"
				onClick={() => $calendarApi?.prev()}
			>
				<Icon icon="pixelarticons:arrow-left" />
			</button>
			<button
				onClick={() => $calendarApi?.today()}
				className={
					$calendarApi && isThisWeek($calendarApi?.getDate())
						? "px-1 border border-black bg-black text-white"
						: "px-1 border border-black"
				}
			>
				Today
			</button>
			<button
				className="text-xl"
				onClick={() => $calendarApi?.next()}
			>
				<Icon icon="pixelarticons:arrow-right" />
			</button>
		</div>
	)
}
