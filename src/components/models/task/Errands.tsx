import { useCallback, useEffect, useState } from "react"
import { actions } from "astro:actions"
import EditableStatus from "@/components/form/EditableStatus"
import EditableText from "@/components/form/EditableText"
import SessionPlayButton from "@/components/models/session/SessionPlayButton"
import AddErrand from "./AddErrand"
import type { Task } from "@/generated/prisma/client"
import { Status } from "@/generated/prisma/enums"

export default function Errands() {
	const [errands, setErrands] = useState<Task[]>([])
	const [loading, setLoading] = useState(false)

	const reload = useCallback(async () => {
		setLoading(true)
		try {
			const res = await actions.task.listErrands({})
			setErrands(res.data ?? [])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void reload()
	}, [reload])

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h2 className="mb-0 text-lg font-semibold leading-tight text-gray-950">
						Errands
					</h2>
					{loading && (
						<p className="mt-0.5 text-xs text-gray-500">
							Loading...
						</p>
					)}
				</div>
				<AddErrand onAdded={reload} />
			</div>

			<div className="space-y-1.5">
				{!loading && errands.length === 0 && (
					<p className="rounded-md border border-dashed border-gray-300/80 bg-white/45 px-3 py-2 text-sm text-gray-500">
						No errands yet.
					</p>
				)}

				{errands.map((errand) => {
					const statusStyle = getStatusStyle(errand.status)

					return (
						<div
							key={errand.id}
							className={`group rounded-md border px-3 py-2 shadow-sm transition-colors ${statusStyle.row}`}
						>
							<div className="flex items-start gap-2">
								<div className="min-w-0 flex-1">
									<EditableText
										value={errand.name}
										onSave={(name) =>
											actions.task
												.update({
													id: errand.id,
													name,
												})
												.then(reload)
										}
										className={`w-full rounded-md px-1 py-0.5 text-sm font-semibold leading-snug text-gray-900 hover:bg-white/65 hover:no-underline ${
											errand.status ===
											Status.completed
												? "line-through decoration-gray-400"
												: ""
										}`}
										inputClassName="bg-white/90 text-sm"
									/>
								</div>
								<div className="-mr-1 inline-flex shrink-0 items-center gap-1">
									<SessionPlayButton
										itemType="task"
										itemId={errand.id}
									/>
								</div>
							</div>

							<div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
								<EditableStatus
									value={errand.status}
									onSave={(status) =>
										actions.task
											.update({
												id: errand.id,
												status,
											})
											.then(reload)
									}
									className="max-w-full rounded-md border-gray-300/80 bg-white/65 px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-gray-500 focus:outline-none"
								/>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function getStatusStyle(status: Status) {
	switch (status) {
		case Status.completed:
			return {
				row: "border-emerald-200/90 bg-emerald-50/80",
			}
		case Status.inprogress:
			return {
				row: "border-yellow-200/90 bg-yellow-50/80",
			}
		case Status.onhold:
			return {
				row: "border-gray-300/90 bg-gray-100/75",
			}
		case Status.archived:
			return {
				row: "border-gray-200 bg-white/45 opacity-70",
			}
		default:
			return {
				row: "border-gray-300/70 bg-white/65",
			}
	}
}
