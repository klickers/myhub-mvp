export async function fetchFromClickUp(url: string) {
	const options = {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: import.meta.env.CLICKUP_PERSONAL_API_TOKEN,
		},
	}

	const res = await fetch("https://api.clickup.com/api/v2" + url, options)
	const json = await res.json()
	return json
}
