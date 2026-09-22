import { DragDropProvider } from "@dnd-kit/react"
import Tasks from "@/components/models/task/Tasks"
import WeeklyAgenda from "@/components/models/agenda/WeeklyAgenda"
import { useAgendaStore } from "@/stores/agenda"
import { useTasksStore } from "@/stores/tasks"
import { toast } from "react-toastify"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
}

export default function Wrapper({ filter }: Props) {
	const createAgendaItem = useAgendaStore((state) => state.createAgendaItem)
	const refetchTaskById = useTasksStore((state) => state.refetchTaskById)

	return (
		<DragDropProvider
			onDragEnd={async ({ operation }) => {
				const { source, target } = operation
				if (source && target) {
					const res = await createAgendaItem(
						target.data.date,
						source.data.type,
						source.id as number,
					)
					if (res === undefined)
						toast.error("Failed to add task to agenda")
					else {
						refetchTaskById(source.id as number)
						toast.success("Task added to agenda")
					}
				}
			}}
		>
			<WeeklyAgenda filter={filter} />
			<Tasks filter={filter} />
		</DragDropProvider>
	)
}
