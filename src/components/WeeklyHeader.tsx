import { useStore } from "@nanostores/react"
import { formattedWeeklyHours, plannedUntilToday } from "@/stores/weeklyHours"
import { minutesToDots } from "@/helpers/time/minutesToDots"
import { buckets } from "@/stores/buckets"

export default function WeeklyHeader() {
	const $weeklyHours = useStore(formattedWeeklyHours)
	const $buckets = useStore(buckets)
	const $plannedUntilToday = useStore(plannedUntilToday)

	return (
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
					<td>Available (till today)</td>
					<td>
						<span className="font-mono">
							{minutesToDots($plannedUntilToday)}
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
						<span className="font-mono">{$weeklyHours.buffer}</span>
					</td>
				</tr>
			</tbody>
		</table>
	)
}
