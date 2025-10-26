import { Icon } from "@iconify/react"
import { useStore } from "@nanostores/react"
import { calendarApi, weekNumber } from "@/stores/calendar"
import { formattedWeeklyHours } from "@/stores/weeklyHours"
import { minutesToDots } from "@/helpers/time/minutesToDots"
import { buckets } from "@/stores/buckets"

export default function WeeklyHeader() {
	const $calendarApi = useStore(calendarApi)
	const $weekNumber = useStore(weekNumber)
	const $weeklyHours = useStore(formattedWeeklyHours)
	const $buckets = useStore(buckets)

	return (
		<>
			<h1 className="text-5xl font-semibold mb-10">
				Week <span>{$weekNumber}</span>
			</h1>
			<div className="flex justify-between items-end">
				<div>
					<table>
						<tbody>
							<tr>
								<td>Used Hours</td>
								<td>
									<span className="font-mono">
										{minutesToDots(
											Object.values($buckets).reduce(
												(acc, { totalUsedTime }) =>
													acc + totalUsedTime,
												0
											)
										)}
									</span>
								</td>
							</tr>
							<tr>
								<td>Planned Hours</td>
								<td>
									<span className="font-mono">
										{minutesToDots(
											Object.values($buckets).reduce(
												(acc, { totalScheduledTime }) =>
													acc + totalScheduledTime,
												0
											)
										)}
									</span>
								</td>
							</tr>
							<tr>
								<td className="pr-2">Available Hours</td>
								<td>
									<span className="font-mono">
										{$weeklyHours.available}
									</span>
								</td>
							</tr>
							<tr>
								<td>Buffer Hours</td>
								<td>
									<span className="font-mono">
										{$weeklyHours.buffer}
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div className="flex gap-4">
					<button
						className="text-xl"
						onClick={() => $calendarApi?.prev()}
					>
						<Icon icon="pixelarticons:arrow-left" />
					</button>
					<button onClick={() => $calendarApi?.today()}>Today</button>
					<button
						className="text-xl"
						onClick={() => $calendarApi?.next()}
					>
						<Icon icon="pixelarticons:arrow-right" />
					</button>
				</div>
			</div>
		</>
	)
}
