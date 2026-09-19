export default function getItemName(
	experiment: { name: string } | null,
	parentTask: { name: string } | null,
) {
	let name = null
	if (experiment) name = experiment.name
	else if (parentTask) name = parentTask.name
	return name
}
