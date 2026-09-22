import { format } from "date-fns"
import { useDroppable } from "@dnd-kit/react"

interface Props {
	date: Date
}

export default function DayAgenda({ date }: Props) {
	const { isDropTarget, ref } = useDroppable({ id: "droppable" })

	return (
		<div>
			<p className="flex gap-1 uppercase">
				<span className="font-semibold">{format(date, "EEE")}</span>
				<span>{format(date, "MM/dd")}</span>
			</p>
			<div ref={ref}>
				<div className="rounded-sm border border-gray-200 bg-gray-50 py-0.5 px-1">
					{isDropTarget
						? "Draggable element is over me"
						: "Drag something over me"}
				</div>
			</div>
		</div>
	)
}
