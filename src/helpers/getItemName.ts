export default function getItemName(
	contract: { name: string } | null,
	guild: { name: string } | null,
	experiment: { name: string } | null,
	parentTask: { name: string } | null,
) {
	let name = null
	if (contract) name = contract.name
	else if (guild) name = guild.name
	else if (experiment) name = experiment.name
	else if (parentTask) name = parentTask.name
	return name
}
