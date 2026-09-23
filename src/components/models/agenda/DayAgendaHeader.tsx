import { format, isToday } from "date-fns"

interface Props {
	date: Date
}

export default function DayAgendaHeader({ date }: Props) {
	return (
		<p className="flex gap-1 uppercase">
			<span className="font-semibold">{format(date, "EEE")}</span>
			<span>{format(date, "MM/dd")}</span>
		</p>
	)
}
