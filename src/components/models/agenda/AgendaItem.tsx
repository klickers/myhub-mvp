import { useState } from "react"
import { Icon } from "@iconify/react"
import EditableText from "@/components/form/EditableText"
import TrashButton from "@/components/TrashButton"
import type { AgendaWithIncludes } from "@/types/prisma-custom"
import { useTasksStore } from "@/stores/tasks"
import { useAgendaStore } from "@/stores/agenda"
import { toast } from "react-toastify"
import { actions } from "astro:actions"

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
		refreshTaskById(taskId)
	}

	const [openEditing, setOpenEditing] = useState<boolean>(false)
	const openSideTray = useTasksStore((state) => state.openSideTray)

	return (
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
				onClick={() => item.task && openSideTray(item.task.id)}
				className="absolute right-0.5 top-0.5 text-xs text-gray-500 hover:text-gray-800"
			>
				<Icon icon="mingcute:external-link-line" />
			</button>
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
				<TrashButton
					className="absolute bottom-0.5 right-0.5"
					onClick={() =>
						handleAgendaItemRemoval(item.id, item.task?.id ?? 0)
					}
				/>
			)}
		</div>
	)
}
