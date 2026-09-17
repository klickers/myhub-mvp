import { useEffect, useState } from "react"
import { actions } from "astro:actions"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import { addDays, startOfDay } from "date-fns"
import { MakeTimeType, Status } from "@/generated/prisma/enums"
import type { Task } from "@/generated/prisma/browser"
import getItemUrl from "@/helpers/getItemUrl"
import getItemName from "@/helpers/getItemName"

function getAgendaTaskClasses(task: Task) {
	const classes = ["agenda-task-card"]

	if (task.status === Status.completed) classes.push("agenda-task-card--completed")
	else if (task.status === Status.inprogress)
		classes.push("agenda-task-card--inprogress")
	else if (task.status === Status.onhold) classes.push("agenda-task-card--onhold")

	if (task.makeTimeType === MakeTimeType.highlight)
		classes.push("agenda-task-card--highlight")
	else if (task.makeTimeType === MakeTimeType.batch)
		classes.push("agenda-task-card--batch")

	if (task.experimentId || task.experiment)
		classes.push("agenda-task-card--lab")
	else classes.push("agenda-task-card--guild")

	return classes.join(" ")
}

export default function Agenda() {
	const [todayTasks, setTodayTasks] = useState<Task[]>([])
	const [overdueTasks, setOverdueTasks] = useState<Task[]>([])

	const getTasks = async () => {
		const today = startOfDay(new Date())
		const res = await actions.task.listAll({
			from: today,
			to: addDays(today, 1),
			includeContract: true,
			includeGuild: true,
			includeExperiment: true,
		})
		setTodayTasks(res.data ?? [])

		const overdueRes = await actions.task.listAll({
			status: [Status.notstarted, Status.inprogress],
			to: today,
			includeContract: true,
			includeGuild: true,
			includeExperiment: true,
		})
		setOverdueTasks(overdueRes.data ?? [])
	}
	useEffect(() => {
		getTasks()
	}, [])

	return (
		<div>
			<h3 className="text-lg font-semibold">Today</h3>
			<div className="agenda-task-list mb-4">
				{todayTasks.length == 0 && (
					<p className="agenda-task-empty">Loading...</p>
				)}
				{todayTasks.map((task) => {
					const parentName = getItemName(
						task.contract,
						task.guild,
						task.experiment,
						null,
					)
					const itemUrl = getItemUrl(
						task.contract,
						task.guild,
						task.experiment,
					)

					return (
						<div
							className={getAgendaTaskClasses(task)}
							key={task.id}
						>
							<div className="calendar-event-card agenda-task-card__content">
								{parentName && (
									<a
										href={itemUrl}
										className="calendar-event-card__meta agenda-task-card__meta"
									>
										{parentName}
									</a>
								)}
								<a
									href={itemUrl}
									className="agenda-task-card__title"
								>
									{task.name}
								</a>
							</div>
							<div className="agenda-task-card__action">
								<SessionPlayButton
									itemType="task"
									itemId={task.id}
								/>
							</div>
						</div>
					)
				})}
			</div>
			<h3 className="text-lg font-semibold">Overdue</h3>
			<div className="mb-3">
				{overdueTasks.map((task) => (
					<div
						className="flex justify-between items-center"
						key={task.id}
					>
						<a
							href={getItemUrl(
								task.contract,
								task.guild,
								task.experiment,
							)}
							className="text-sm"
						>
							{task.name}
						</a>
						<SessionPlayButton
							itemType="task"
							itemId={task.id}
						/>
					</div>
				))}
			</div>
		</div>
	)
}
