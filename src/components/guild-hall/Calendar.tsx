import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { useEffect, useState } from "react"
import { actions } from "astro:actions"
import { Status } from "@/generated/prisma/enums"
import { Icon } from "@iconify/react"

type CalendarEvent = {
	id: string
	title: string
	start: Date | string
	allDay?: boolean
	extendedProps: {
		type: "contract" | "task"
		status: Status
		contractId?: number
		taskId?: number
	}
}

export default function Calendar() {
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			const [contractsRes, tasksRes] = await Promise.all([
				actions.contract.list({
					status: Object.values(Status),
				}),
				actions.task.listAll({
					status: Object.values(Status),
				}),
			])

			const contracts = contractsRes.data ?? []
			const tasks = tasksRes.data ?? []

			const contractEvents: CalendarEvent[] = contracts.map(
				(contract) => ({
					id: `contract-${contract.id}`,
					title: contract.name,
					start: contract.dueDate,
					allDay: true,
					extendedProps: {
						type: "contract",
						status: contract.status,
						contractId: contract.id,
					},
				})
			)

			const taskEvents: CalendarEvent[] = tasks
				.filter((task) => task.deadline)
				.map((task) => ({
					id: `task-${task.id}`,
					title: task.name,
					start: task.deadline!,
					allDay: true,
					extendedProps: {
						type: "task",
						status: task.status,
						taskId: task.id,
						contractId: task.contractId ?? undefined,
					},
				}))

			setEvents([...contractEvents, ...taskEvents])
			setLoading(false)
		}

		load()
	}, [])

	if (loading) return <div>Loading calendar…</div>

	return (
		<FullCalendar
			plugins={[dayGridPlugin]}
			initialView="dayGridMonth"
			events={events}
			eventClassNames={(arg) => {
				switch (arg.event.extendedProps.type) {
					case "contract":
						return ["calendar-contract"]
					case "task":
						return ["calendar-task"]
					default:
						return []
				}
			}}
			eventContent={(arg) => {
				const { event } = arg
				const { type, status } = event.extendedProps

				return (
					<div>
						<div className="flex gap-1 items-center px-1 py-0.5">
							{type === "contract" ? (
								<Icon
									icon="mingcute:document-2-fill"
									className="flex-none"
								/>
							) : (
								<Icon
									icon="mingcute:check-circle-line"
									className="flex-none"
								/>
							)}{" "}
							{event.title}
						</div>

						{/* <div className="calendar-event-footer">
							<span className={`calendar-pill ${type}`}>
								{type}
							</span>
							<span className="calendar-status">{status}</span>
						</div> */}
					</div>
				)
			}}
		/>
	)
}
