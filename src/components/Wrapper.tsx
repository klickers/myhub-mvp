import { DragDropProvider } from "@dnd-kit/react"
import Tasks from "@/components/models/task/Tasks"
import WeeklyAgenda from "@/components/models/agenda/WeeklyAgenda"
import { useAgendaStore } from "@/stores/agenda"

interface Props {
	tagId: number
}

export default function Wrapper({ tagId }: Props) {
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
			<WeeklyAgenda />
			<Tasks filter={{ type: "tag", id: tagId }} />
		</DragDropProvider>
	)
}
