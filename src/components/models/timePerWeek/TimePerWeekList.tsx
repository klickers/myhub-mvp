import { useState } from "react"
import CreateTimePerWeek from "@/components/models/timePerWeek/CreateTimePerWeek"
import type { TimePerWeek } from "@/generated/prisma/client"

interface TimePerWeekListProps {
	initial: any[]
	itemType: "objective" | "task"
	id: number // objectiveId or taskId depending on itemType
	nextWeek?: number
}

export default function TimePerWeekList({
	initial,
	itemType,
	id,
	nextWeek,
}: TimePerWeekListProps) {
	const [timePerWeeks, setTimePerWeeks] = useState(initial)

	function handleNewEntry(entry: TimePerWeek) {
		setTimePerWeeks((prev) =>
			[entry, ...prev].sort(
				(a, b) => b.year - a.year || b.weekNumber - a.weekNumber
			)
		)
	}

	return (
		<div>
			<CreateTimePerWeek
				itemType={itemType}
				id={id}
				nextWeek={nextWeek}
				onCreate={handleNewEntry}
			/>

			<table className="mt-4">
				<thead className="text-right">
					<tr>
						<th className="font-normal">Year</th>
						<th className="font-normal pl-4">Week</th>
						<th className="font-normal pl-4">Scheduled Minutes</th>
						<th className="font-normal pl-4">Scheduled Hours</th>
					</tr>
				</thead>
				<tbody className="font-mono text-right">
					{timePerWeeks.map((tpw) => (
						<tr key={`${tpw.year}-${tpw.weekNumber}`}>
							<td>{tpw.year}</td>
							<td>{tpw.weekNumber}</td>
							<td>{tpw.scheduledTime}</td>
							<td>{(tpw.scheduledTime / 60).toFixed(2)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
