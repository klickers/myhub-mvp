export default function getItemName(
	contract: { name: string } | null,
	guild: { name: string } | null,
	experiment: { name: string } | null,
) {
	let name = null
	if (contract) name = contract.name
	else if (guild) name = guild.name
	else if (experiment) name = experiment.name
	return name
}
