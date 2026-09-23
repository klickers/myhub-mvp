import { useDroppable } from "@dnd-kit/react"
import { isToday } from "date-fns"
import { toast } from "react-toastify"
import { Icon } from "@iconify/react"
import type { AgendaWithIncludes } from "@/types/prisma-custom"
import { useAgendaStore } from "@/stores/agenda"
import AgendaItem from "./AgendaItem"
import DayAgendaHeader from "./DayAgendaHeader"

interface Props {
	date: Date
	items: AgendaWithIncludes[]
	dropId?: string
	showHeader?: boolean
	addTaskId?: number // add task to agenda
}

export default function DayAgenda({
	date,
	items,
	dropId = date.toISOString(),
	showHeader = true,
	addTaskId,
}: Props) {
	const createAgendaItem = useAgendaStore((state) => state.createAgendaItem)

	const { isDropTarget, ref } = useDroppable({
		id: dropId,
		data: { date },
	})

	return (
		<div
			ref={ref}
			className={"p-1 " + (isToday(date) ? "bg-yellow-50" : "")}
		>
			{showHeader && <DayAgendaHeader date={date} />}
			<div className="space-y-0.5">
				{items.map((item) => (
					<AgendaItem
						item={item}
						key={item.id}
					/>
				))}
				{!isDropTarget && items.length === 0 && (
					<div className="rounded-sm border border-dashed border-gray-200 py-0.5 px-1 opacity-70">
						No items yet.
					</div>
				)}
				{isDropTarget && (
					<div className="rounded-sm border border-dashed border-gray-200 py-0.5 px-1 opacity-70">
						Drop task here
					</div>
				)}
				{addTaskId && (
					<button
						className="text-[10px] w-full rounded-sm border border-dashed border-gray-200 py-0.5 px-1 opacity-70 flex items-center gap-1 hover:opacity-100 hover:bg-gray-50"
						onClick={async () => {
							const res = await createAgendaItem(
								date,
								"task",
								addTaskId,
							)
							if (res === undefined)
								toast.error("Failed to add task to agenda")
							else toast.success("Task added to agenda")
						}}
					>
						<Icon icon="mingcute:add-fill" />
						<span>Add task</span>
					</button>
				)}
			</div>
		</div>
	)
}
