import type { TaskNode } from "@/helpers/buildTaskTree"
import Task from "@/components/models/task/Task"

interface Props {
	tasks: TaskNode[]
}

export default function Tasks({ tasks }: Props) {
	return (
		<table>
			<thead>
				<tr>
					<th>Task</th>
					<th>Status</th>
					<th>Est. Time</th>
					<th>Deadline</th>
					<th>Tags</th>
					{/* Controls */}
					<th></th>
				</tr>
			</thead>
			<tbody>
				<Task
					tasks={tasks}
					depth={0}
				/>
			</tbody>
		</table>
	)
}
