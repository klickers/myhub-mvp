import { useCallback, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useTasksStore } from "@/stores/tasks"
import saveTaskChange from "@/helpers/saveTaskChange"

export default function TasksCalendar() {
	const openSideTray = useTasksStore((state) => state.openSideTray)
	const loadTasks = useTasksStore((state) => state.loadTasks)
	const tasks = useTasksStore((state) => state.tasks)

	useEffect(() => {
		loadTasks()
	}, [])

	return (
		<div className="calendar calendar--tasks">
			<FullCalendar
				plugins={[dayGridPlugin, interactionPlugin]}
				initialView="dayGridMonth"
				height="auto"
				initialEvents={[]}
				headerToolbar={{
					left: "dayGridWeek,dayGridMonth",
					center: "title",
					right: "today prev,next",
				}}
				nowIndicator
				editable
				events={tasks
					.filter((task) => task.deadline)
					.map((task) => ({
						id: `task-${task.id}`,
						title: task.name,
						start: task.deadline!,
						extendedProps: {
							type: "task",
							task,
						},
						classNames: [
							"event--task",
							`event--status-${task.status}`,
						],
					}))}
				eventContent={(arg) => {
					const { event } = arg
					return (
						<div>
							{event.extendedProps.task ? (
								<div
									className="cursor-pointer whitespace-pre-wrap"
									onClick={() =>
										openSideTray(
											event.extendedProps.task.id ?? -1,
										)
									}
								>
									{event.title}
								</div>
							) : (
								<span>Error loading task</span>
							)}
						</div>
					)
				}}
				eventDrop={(info) => {
					if (info.event.start != info.event.extendedProps.deadline)
						saveTaskChange({
							id: info.event.extendedProps.task.id,
							deadline: info.event.start,
						})
				}}
			/>
		</div>
	)
}
