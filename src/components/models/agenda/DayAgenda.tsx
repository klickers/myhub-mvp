import { useMemo, useState } from "react"
import { useDroppable } from "@dnd-kit/react"
import { format, isSameDay, isToday } from "date-fns"
import { useAgendaStore } from "@/stores/agenda"
import { useTasksStore } from "@/stores/tasks"
import { Icon } from "@iconify/react"
import EditableText from "@/components/form/EditableText"
import TrashButton from "@/components/TrashButton"
import { toast } from "react-toastify"
import { actions } from "astro:actions"

interface Props {
	date: Date
	filter:
		| { type: "all" }
		| { type: "tag"; id: number }
		| { type: "task"; id: number }
}

export default function DayAgenda({ date, filter }: Props) {
	const agenda = useAgendaStore((state) => state.agenda)
	const updateAgendaItem = useAgendaStore((state) => state.updateAgendaItem)
	const removeAgendaItem = useAgendaStore((state) => state.removeAgendaItem)
	const refreshTaskById = useTasksStore((state) => state.refetchTaskById)

	const agendaItems = useMemo(() => {
		return agenda.filter((item) => {
			switch (filter.type) {
				case "tag":
					return (
						isSameDay(item.date, date) &&
						item.task?.tags.some((tag) => tag.tagId === filter.id)
					)
				// case "task":
				// 	return where one parent task is the filter.id
				case "all":
				default:
					return isSameDay(item.date, date)
			}
		})
	}, [agenda, date, filter])
	const saveAgendaChange = async (
		patch: Parameters<typeof actions.agenda.update>[0],
	) => {
		const res = await updateAgendaItem(patch.id, patch)
		if (res === undefined) toast.error("Failed to update agenda item")
		else toast.success("Agenda item updated successfully")
	}
	const handleAgendaItemRemoval = async (id: number, taskId: number) => {
		const res = await removeAgendaItem(id)
		if (res === undefined) toast.error("Failed to remove agenda item")
		else toast.success("Agenda item removed successfully")
		refreshTaskById(taskId)
	}

	const { isDropTarget, ref } = useDroppable({
		id: date.toISOString(),
		data: { date },
	})

	const [openEditingId, setOpenEditingId] = useState<number | null>(null)
	const openSideTray = useTasksStore((state) => state.openSideTray)

	return (
		<div
			ref={ref}
			className={isToday(date) ? "bg-yellow-100" : ""}
		>
			<p className="flex gap-1 uppercase">
				<span className="font-semibold">{format(date, "EEE")}</span>
				<span>{format(date, "MM/dd")}</span>
			</p>
			<div className="space-y-0.5">
				{agendaItems.map((item) => (
					<div
						key={item.id}
						className={
							"relative rounded-sm border border-gray-200 bg-gray-50 py-0.5 px-1" +
							(item.status === "completed"
								? " border-green-200 bg-green-50"
								: "")
						}
					>
						<button
							onClick={() =>
								item.task && openSideTray(item.task.id)
							}
							className="absolute right-0.5 top-0.5 text-xs text-gray-500 hover:text-gray-800"
						>
							<Icon icon="mingcute:external-link-line" />
						</button>
						<span
							className="cursor-pointer"
							onClick={() =>
								setOpenEditingId(
									openEditingId === item.id ? null : item.id,
								)
							}
						>
							{item.task?.name}
						</span>
						{(item.description || openEditingId === item.id) && (
							<EditableText
								value={item.description || "No description"}
								onSave={(description) =>
									saveAgendaChange({
										id: item.id,
										description,
									})
								}
								className="text-[10px] text-gray-500"
								inputClassName="text-[10px] text-gray-500"
							/>
						)}
						{openEditingId === item.id && (
							<TrashButton
								onClick={() =>
									handleAgendaItemRemoval(
										item.id,
										item.task?.id ?? 0,
									)
								}
							/>
						)}
					</div>
				))}
				{!isDropTarget && agendaItems.length === 0 && (
					<div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 py-0.5 px-1 opacity-70">
						No agenda items yet.
					</div>
				)}
				{isDropTarget && (
					<div className="rounded-sm border border-dashed border-gray-200 bg-gray-50 py-0.5 px-1 opacity-70">
						Drop task here
					</div>
				)}
			</div>
		</div>
	)
}
