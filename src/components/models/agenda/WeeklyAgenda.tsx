import { useEffect } from "react"
import DayAgenda from "./DayAgenda"
import { useAgendaStore } from "@/stores/agenda"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
}

export default function WeeklyAgenda({ filter }: Props) {
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
					filter={filter}
				/>
			))}
		</div>
	)
}
