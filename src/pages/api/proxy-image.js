// File: pages/api/proxy-image.js (if using Next.js)
// Or implement similar logic in your preferred backend framework

export default async function handler(req, res) {
	const { url } = req.query;

	if (!url) {
		return res.status(400).json({ error: "URL parameter is required" });
	}

	try {
		// Fetch the image
		const response = await fetch(url);

		if (!response.ok) {
			return res.status(response.status).json({
				error: `Failed to fetch image: ${response.statusText}`,
			});
		}

		// Get the image data as an ArrayBuffer
		const imageBuffer = await response.arrayBuffer();

		// Get the content type
		const contentType = response.headers.get("content-type");

		// Set appropriate headers
		res.setHeader("Content-Type", contentType);
		res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

		// Send the image data
		res.status(200).send(Buffer.from(imageBuffer));
	} catch (error) {
		console.error("Error proxying image:", error);
		res.status(500).json({ error: "Failed to proxy image" });
	}
}
