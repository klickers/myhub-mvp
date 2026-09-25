import { useState } from "react"
import { Icon } from "@iconify/react"
import EditableText from "@/components/form/EditableText"
import TrashButton from "@/components/TrashButton"
import type { AgendaWithIncludes } from "@/types/prisma-custom"
import { useTasksStore } from "@/stores/tasks"
import { useAgendaStore } from "@/stores/agenda"
import { toast } from "react-toastify"
import { actions } from "astro:actions"
import { useDraggable } from "@dnd-kit/react"
import SessionPlayButton from "../session/SessionPlayButton"
import SideTrayOpenButton from "@/components/SideTrayOpenButton"

interface Props {
	item: AgendaWithIncludes
}

export default function AgendaItem({ item }: Props) {
	const updateAgendaItem = useAgendaStore((state) => state.updateAgendaItem)
	const removeAgendaItem = useAgendaStore((state) => state.removeAgendaItem)
	const refreshTaskById = useTasksStore((state) => state.refetchTaskById)

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
		setOpenEditing(false)
		refreshTaskById(taskId)
	}
	const handleAgendaItemStatusChange = async (
		status: "notstarted" | "inprogress" | "completed",
	) => {
		const res = await updateAgendaItem(item.id, { id: item.id, status })
		if (res === undefined)
			toast.error("Failed to update agenda item status")
		else toast.success("Agenda item status updated successfully")
		setOpenEditing(false)
		// refreshTaskById(taskId)
	}

	const [openEditing, setOpenEditing] = useState<boolean>(false)
	const openSideTray = useTasksStore((state) => state.openSideTray)

	const { ref } = useDraggable({
		id: item.id,
		type: "agenda-item",
		data: {
			date: item.date,
		},
	})

	return (
		<div
			ref={ref}
			className={
				"relative rounded-sm border py-0.5 px-1" +
				(item.status === "completed"
					? " border-green-200 bg-green-50"
					: item.status === "inprogress"
						? " border-amber-200 bg-amber-50"
						: " border-gray-200 bg-gray-50")
			}
		>
			<SideTrayOpenButton
				onClick={() => item.task && openSideTray(item.task.id)}
				className="absolute right-0.5 top-0.5 text-xs text-gray-500 hover:text-gray-800"
			/>
			<span
				className="cursor-pointer"
				onClick={() => setOpenEditing(!openEditing)}
			>
				{item.task?.name}
			</span>
			{(item.description || openEditing) && (
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
			{openEditing && (
				<div className="flex gap-1 justify-between mt-0.5">
					<div className="flex gap-0.5">
						<button
							className="text-gray-400 hover:text-gray-600"
							onClick={() =>
								handleAgendaItemStatusChange("notstarted")
							}
						>
							<Icon icon="mingcute:circle-dash-fill" />
						</button>
						<button
							className="text-yellow-400 hover:text-yellow-600"
							onClick={() =>
								handleAgendaItemStatusChange("inprogress")
							}
						>
							<Icon icon="mingcute:semicircle-dash-fill" />
						</button>
						<button
							className="text-green-400 hover:text-green-600"
							onClick={() =>
								handleAgendaItemStatusChange("completed")
							}
						>
							<Icon icon="mingcute:check-circle-dash-fill" />
						</button>
						{item.task && (
							<SessionPlayButton
								itemType="task"
								itemId={item.task.id}
							/>
						)}
					</div>
					<TrashButton
						className=""
						onClick={() =>
							handleAgendaItemRemoval(item.id, item.task?.id ?? 0)
						}
					/>
				</div>
			)}
		</div>
	)
}
