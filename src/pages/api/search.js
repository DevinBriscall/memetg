export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { name } = req.query;
	if (!name) {
		return res.status(400).json({ error: "Card name is required" });
	}

	try {
		const response = await fetch(
			`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
		);
		if (!response.ok) {
			throw new Error("Failed to fetch card data");
		}

		const cardData = await response.json();
		res.status(200).json(cardData);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}
