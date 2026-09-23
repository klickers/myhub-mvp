import { DragDropProvider } from "@dnd-kit/react"
import Tasks from "@/components/models/task/Tasks"
import WeeklyAgenda from "@/components/models/agenda/WeeklyAgenda"
import { useAgendaStore } from "@/stores/agenda"
import { useTasksStore } from "@/stores/tasks"
import { toast } from "react-toastify"
import { format, isSameDay } from "date-fns"

interface Props {
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
		| { type: "group"; id: number }
	showTasks?: boolean
}

export default function Wrapper({ filter, showTasks = true }: Props) {
	const createAgendaItem = useAgendaStore((state) => state.createAgendaItem)
	const updateAgendaItem = useAgendaStore((state) => state.updateAgendaItem)
	const refetchTaskById = useTasksStore((state) => state.refetchTaskById)

	return (
		<DragDropProvider
			onDragEnd={async ({ operation }) => {
				const { source, target } = operation
				if (source && target) {
					let res = undefined
					if (
						source.type === "agenda-item" &&
						!isSameDay(source.data.date, target.data.date)
					) {
						res = await updateAgendaItem(source.id as number, {
							id: source.id as number,
							date: target.data.date,
						})

						if (res === undefined)
							toast.error("Failed to move agenda item")
						else
							toast.success(
								"Agenda item moved successfully from " +
									format(source.data.date, "MMM d") +
									" to " +
									format(target.data.date, "MMM d"),
							)
					} else if (source.type === "task") {
						res = await createAgendaItem(
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
				}
			}}
		>
			<WeeklyAgenda filter={filter} />
			{showTasks && <Tasks filter={filter} />}
		</DragDropProvider>
	)
}
