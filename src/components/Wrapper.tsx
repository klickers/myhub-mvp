import { DragDropProvider } from "@dnd-kit/react"
import Tasks from "@/components/models/task/Tasks"
import WeeklyAgenda from "@/components/models/agenda/WeeklyAgenda"

interface Props {
	tagId: number
}

export default function Wrapper({ tagId }: Props) {
	return (
		<DragDropProvider>
			<WeeklyAgenda />
			<Tasks filter={{ type: "tag", id: tagId }} />
		</DragDropProvider>
	)
}
