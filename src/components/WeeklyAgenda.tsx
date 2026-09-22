import { format } from "date-fns"

export default function WeeklyAgenda() {
	const days = [
		{
			day: "Sunday",
			date: new Date(),
		},
		{
			day: "Monday",
			date: new Date(),
		},
		{
			day: "Tuesday",
			date: new Date(),
		},
		{
			day: "Wednesday",
			date: new Date(),
		},
		{
			day: "Thursday",
			date: new Date(),
		},
		{
			day: "Friday",
			date: new Date(),
		},
		{
			day: "Saturday",
			date: new Date(),
		},
	]

	return (
		<div className="grid grid-cols-7 gap-2 mb-6 text-xs">
			{days.map((day) => (
				<div>
					<p className="flex gap-1 uppercase">
						<span className="font-semibold">
							{format(day.date, "EEE")}
						</span>
						<span>{format(day.date, "MM/dd")}</span>
					</p>
					<div className="rounded-sm border border-gray-200 bg-gray-50 py-0.5 px-1">
						Sample task name goes here
					</div>
				</div>
			))}
		</div>
	)
}
