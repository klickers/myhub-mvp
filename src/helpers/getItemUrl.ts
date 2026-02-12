export default function getItemUrl(
	contract: { slug: string } | null,
	guild: { slug: string } | null,
	experiment: { slug: string } | null,
) {
	let url = "#!"
	if (contract) url = `/hall/contracts/${contract.slug}`
	else if (guild) url = `/hall/guilds/${guild.slug}`
	else if (experiment) url = `/lab/experiments/${experiment.slug}`
	return url
}
