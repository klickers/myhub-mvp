import React, { useState } from "react"
import { actions } from "astro:actions"
import { getWeek, getYear } from "date-fns"

interface CreateTimePerWeekProps {
	itemType: "objective" | "task"
	id: number // objectiveId or taskId depending on itemType
	nextWeek?: number
	onCreate?: (entry: any) => void
}

export default function CreateTimePerWeek({
	itemType,
	id,
	nextWeek,
	onCreate,
}: CreateTimePerWeekProps) {
	const [formState, setFormState] = useState({
		year: getYear(new Date()),
		weekNumber: nextWeek || getWeek(new Date()),
		scheduledTime: 0,
	})

	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)

		await actions.getOrCreateWeek.orThrow({
			year: formState.year,
			weekNumber: formState.weekNumber,
		})
		const entry = await actions.createTimePerWeek.orThrow({
			year: Number(formState.year),
			weekNumber: Number(formState.weekNumber),
			scheduledTime: Number(formState.scheduledTime),
			itemType,
			...(itemType === "objective"
				? { objectiveId: id }
				: { taskId: id }),
		})

		setLoading(false)
		if (onCreate) onCreate(entry)
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex gap-2 w-full"
		>
			<input
				type="number"
				value={formState.year}
				onChange={(e) =>
					setFormState({
						...formState,
						year: Number(e.target.value),
					})
				}
				required
			/>
			<input
				type="number"
				min={1}
				max={53}
				value={formState.weekNumber}
				onChange={(e) =>
					setFormState({
						...formState,
						weekNumber: Number(e.target.value),
					})
				}
				required
			/>
			<input
				type="number"
				min={0}
				value={formState.scheduledTime}
				onChange={(e) =>
					setFormState({
						...formState,
						scheduledTime: Number(e.target.value),
					})
				}
				required
			/>
			<button
				type="submit"
				disabled={loading}
				className="button button--primary"
			>
				{loading ? "Adding..." : "Add"}
			</button>
		</form>
	)
}
