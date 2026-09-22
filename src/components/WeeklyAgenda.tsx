import { useEffect } from "react"
import DayAgenda from "./DayAgenda"
import { useAgendaStore } from "@/stores/agenda"

export default function WeeklyAgenda() {
	const loadAgenda = useAgendaStore((state) => state.loadAgenda)
	const days = useAgendaStore((state) => state.days)

	useEffect(() => {
		loadAgenda()
	}, [])

	return (
		<div className="grid grid-cols-7 gap-2 mb-6 text-xs">
			{days.map((day, index) => (
				<DayAgenda
					key={index}
					date={day.date}
				/>
			))}
		</div>
	)
}
