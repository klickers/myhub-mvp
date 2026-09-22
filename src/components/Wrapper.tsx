import { DragDropProvider } from "@dnd-kit/react"
import Tasks from "@/components/models/task/Tasks"
import WeeklyAgenda from "@/components/models/agenda/WeeklyAgenda"
import { useAgendaStore } from "@/stores/agenda"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
}

export default function Wrapper({ filter }: Props) {
	const createAgendaItem = useAgendaStore((state) => state.createAgendaItem)

	return (
		<DragDropProvider
			onDragEnd={({ operation }) => {
				const { source, target } = operation
				if (source && target) {
					createAgendaItem(
						target.data.date,
						source.data.type,
						source.id as number,
					)
				}
			}}
		>
			<WeeklyAgenda filter={filter} />
			<Tasks filter={filter} />
		</DragDropProvider>
	)
}
