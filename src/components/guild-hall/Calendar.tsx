import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
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
	return (
		<FullCalendar
			plugins={[dayGridPlugin]}
			initialView="dayGridMonth"
			height="auto"
			/* ===============================
			   Load only events in view range
			   =============================== */
			events={async (info, successCallback) => {
				try {
					const start = info.start.toISOString()
					const end = info.end.toISOString()

					const statuses = Object.values(Status).filter(
						(status) => status !== Status.archived
					)
					const [contractsRes, tasksRes] = await Promise.all([
						actions.contract.list({
							status: statuses,
							from: new Date(start),
							to: new Date(end),
						}),
						actions.task.listAll({
							status: statuses,
							from: new Date(start),
							to: new Date(end),
							includeContract: true,
							includeGuild: true,
							includeExperiment: true,
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
								contract: {
									id: contract.id,
									slug: contract.slug,
								},
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
								...(task.contract && {
									contract: {
										id: task.contractId,
										slug: task.contract.slug,
									},
								}),
								...(task.guild && {
									guild: {
										id: task.guildId,
										slug: task.guild.slug,
									},
								}),
								...(task.experiment && {
									experiment: {
										id: task.experimentId,
										slug: task.experiment.slug,
									},
								}),
							},
						}))
					console.log(taskEvents)

					successCallback([...contractEvents, ...taskEvents])
				} catch (error) {
					console.error("Failed to load calendar events", error)
				}
			}}
			/* ===============================
			   Dynamic class names
			   =============================== */
			eventClassNames={(arg) => {
				const classes: string[] = []
				switch (arg.event.extendedProps.type) {
					case "contract":
						classes.push("calendar-contract")
						break
					case "task":
						classes.push("calendar-task")
						break
				}
				if (arg.event.extendedProps.status === Status.completed)
					classes.push("calendar-completed")
				else if (arg.event.extendedProps.status === Status.inprogress)
					classes.push("calendar-inprogress")
				else if (arg.event.extendedProps.status === Status.onhold)
					classes.push("calendar-onhold")
				return classes
			}}
			/* ===============================
			   Custom event rendering
			   =============================== */
			//    TODO: clicking event opens details, or side tray
			eventContent={(arg) => {
				const { event } = arg
				const { type } = event.extendedProps

				// TODO: open task in side tray on click; handle subtasks
				let url = "#!"
				if (event.extendedProps.contract)
					url = `/hall/contracts/${event.extendedProps.contract.slug}`
				else if (event.extendedProps.guild)
					url = `/hall/guilds/${event.extendedProps.guild.slug}`
				else if (event.extendedProps.experiment)
					url = `/lab/experiments/${event.extendedProps.experiment.slug}`

				return (
					<a
						href={url}
						className="flex gap-1 items-center px-1 py-0.5"
					>
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
						)}
						<span>{event.title}</span>
					</a>
				)
			}}
		/>
	)
}
