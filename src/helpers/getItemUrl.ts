export default function getItemUrl(experiment: { slug: string } | null) {
	let url = "#!"
	if (experiment) url = `/lab/experiments/${experiment.slug}`
	return url
}
