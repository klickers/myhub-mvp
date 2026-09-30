import { useEffect } from "react"
import { Icon } from "@iconify/react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/react/daygrid"
import interactionPlugin from "@fullcalendar/react/interaction"
import themePlugin from "@fullcalendar/react/themes/classic"
import { useTasksStore } from "@/stores/tasks"
import saveTaskChange from "@/helpers/saveTaskChange"

import "@fullcalendar/react/skeleton.css"
import { format } from "date-fns"

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
				plugins={[dayGridPlugin, interactionPlugin, themePlugin]}
				initialView="dayGridMonth"
				height="auto"
				initialEvents={[]}
				headerToolbar={{
					left: "dayGridWeek,dayGridMonth",
					center: "title",
					right: "prev,today,next",
				}}
				nowIndicator
				editable
				buttons={{
					next: {
						iconContent: <Icon icon="mingcute:right-fill" />,
					},
					prev: {
						iconContent: <Icon icon="mingcute:left-fill" />,
					},
				}}
				// ===========================
				// Events
				// ===========================
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
						className:
							"event--task" + ` event--status-${task.status}`,
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
				// ===========================
				// Styling
				// ===========================
				toolbarClass="flex justify-between items-center mb-4"
				toolbarTitleClass="text-base font-semibold"
				buttonGroupClass="flex items-center gap-1"
				buttonClass={(info) =>
					"uppercase text-xs px-1 py-1 rounded-lg border border-gray-300 hover:bg-gray-100" +
					(info.isDisabled || info.isSelected ? " bg-gray-100" : "")
				}
				dayHeaderRowClass="font-semibold uppercase text-sm"
				dayHeaderAlign="start"
				dayHeaderClass="!px-1"
				dayHeaderContent={(info) => (
					<span>{format(info.date, "EEE")}</span>
				)}
				dayHeaderDividerClass="border-b border-gray-300"
				dayRowClass="!border-b !border-gray-300"
				dayCellClass={(info) =>
					"!p-1 border-r border-gray-300 text-sm" +
					(info.isToday ? " bg-blue-100" : "") +
					(info.isPast ? " opacity-70" : "") +
					(info.isFuture ? " text-gray-800" : "")
				}
				dayCellTopInnerClass="font-medium"
				dayCellInnerClass="text-xs"
				listItemEventClass="rounded-md bg-gray-50 p-1 mb-0.5"
			/>
		</div>
	)
}
