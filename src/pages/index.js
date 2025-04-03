import { useState, useRef, useEffect } from "react";
// Card Search Component (with your existing code)
function CardSearch({ onSelect }) {
	const [query, setQuery] = useState("");
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const searchCard = async () => {
		if (!query.trim()) return;

		setLoading(true);
		setError("");
		setResult(null);

		try {
			const res = await fetch(`/api/search?name=${encodeURIComponent(query)}`);
			const data = await res.json();

			if (data.error) {
				setError("Card not found.");
			} else {
				setResult(data);
			}
		} catch (error) {
			setError("Error fetching card.");
			console.error("Error fetching card:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") searchCard();
	};

	return (
		<div className="p-4 border rounded-md">
			<input
				type="text"
				placeholder="Search for a card..."
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={handleKeyDown}
				className="border p-2 rounded w-full"
			/>
			<button
				onClick={searchCard}
				className="bg-blue-500 text-white px-4 py-2 mt-2 rounded w-full"
				disabled={loading}
			>
				{loading ? "Searching..." : "Search"}
			</button>

			{error && <p className="text-red-500 mt-2">{error}</p>}

			{result && (
				<div
					onClick={() => onSelect(result)}
					className="mt-4 p-4 border rounded-md cursor-pointer"
				>
					<h2 className="text-lg font-semibold">{result.name}</h2>
					<img
						src={result.image_uris?.normal}
						alt={result.name}
						className="mt-2 w-40"
					/>
					<p className="text-sm text-gray-600">{result.type_line}</p>
					<p className="text-sm italic">{result.oracle_text}</p>
				</div>
			)}
		</div>
	);
}

// New Image Upload Component
function ImageUploader({ onImageUpload }) {
	const fileInputRef = useRef(null);
	const [previewUrl, setPreviewUrl] = useState(null);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = () => {
				setPreviewUrl(reader.result);
				onImageUpload(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="p-4 border rounded-md mt-4">
			<h2 className="text-lg font-semibold mb-2">Upload Background Image</h2>
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileChange}
				accept="image/*"
				className="hidden"
			/>
			<button
				onClick={() => fileInputRef.current.click()}
				className="bg-green-500 text-white px-4 py-2 rounded w-full"
			>
				Choose Image
			</button>

			{previewUrl && (
				<div className="mt-4">
					<p className="text-sm text-gray-600 mb-2">Preview:</p>
					<img
						src={previewUrl}
						alt="Preview"
						className="w-40 h-40 object-cover rounded"
					/>
				</div>
			)}
		</div>
	);
}

// CardRenderer Component with reliable download
// CardRenderer Component with proxy solution
function CardRenderer({ card, backgroundImage }) {
	const [cardLoaded, setCardLoaded] = useState(false);
	const cardRef = useRef(null);
	const [proxyCardImage, setProxyCardImage] = useState(null);

	useEffect(() => {
		// Reset when card changes
		if (card) {
			setCardLoaded(false);
			setProxyCardImage(null);

			// Get the card image URL
			const cardImageUrl =
				card.image_uris?.normal ||
				card.image_uris?.large ||
				card.image_uris?.png;

			if (cardImageUrl) {
				// Create proxy request to your own backend
				fetch(`/api/proxy-image?url=${encodeURIComponent(cardImageUrl)}`)
					.then((response) => response.blob())
					.then((blob) => {
						const url = URL.createObjectURL(blob);
						setProxyCardImage(url);
					})
					.catch((error) => {
						console.error("Failed to proxy card image:", error);
					});
			}
		}
	}, [card]);

	if (!card) return null;

	// Card art area measurements
	const artAreaTop = 11; // % from top
	const artAreaHeight = 45; // % of card height
	const artAreaLeftRight = 8; // % from sides

	const downloadCard = async () => {
		if (!cardRef.current || !cardLoaded) {
			alert("Please wait for the card to fully load.");
			return;
		}

		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			// Create a new image for the card
			const cardImg = new Image();
			// No need for crossOrigin attribute since we're using a proxy/blob URL

			// Set up promise to wait for card image to load
			const cardLoadPromise = new Promise((resolve) => {
				cardImg.onload = resolve;
				cardImg.onerror = () => {
					alert("Could not load the card image for download.");
				};
				cardImg.src = proxyCardImage; // Use our proxied image
			});

			await cardLoadPromise;

			// Set canvas dimensions to match the card image
			canvas.width = cardImg.width;
			canvas.height = cardImg.height;

			// Draw the base card
			ctx.drawImage(cardImg, 0, 0, canvas.width, canvas.height);

			// If we have a background image, draw it in the art area
			if (backgroundImage) {
				const bgImg = new Image();
				bgImg.src = backgroundImage;

				await new Promise((resolve) => {
					bgImg.onload = resolve;
					bgImg.onerror = () => {
						alert("Could not load your custom background image.");
						resolve();
					};
				});

				// Calculate art area position and size
				const artX = canvas.width * (artAreaLeftRight / 100);
				const artY = canvas.height * (artAreaTop / 100);
				const artWidth = canvas.width - 2 * artX;
				const artHeight = canvas.height * (artAreaHeight / 100);

				// Draw the custom background in the art area
				ctx.drawImage(bgImg, artX, artY, artWidth, artHeight);
			}

			// Create download link
			const link = document.createElement("a");
			link.download = `custom-${card.name
				.replace(/\s+/g, "-")
				.toLowerCase()}.png`;
			link.href = canvas.toDataURL("image/png");
			link.click();
		} catch (error) {
			console.error("Error generating custom card:", error);
			alert("Failed to download card. Please try again.");
		}
	};

	return (
		<div className="p-4 border rounded-md mt-4">
			<h2 className="text-lg font-semibold mb-4">Your Custom Card</h2>

			<div className="relative" ref={cardRef}>
				{/* Base card image */}
				{proxyCardImage ? (
					<img
						src={proxyCardImage}
						alt={card.name}
						className="rounded-lg"
						style={{
							maxWidth: "100%",
							height: "auto",
							display: "block",
						}}
						onLoad={() => setCardLoaded(true)}
					/>
				) : (
					<div
						className="rounded-lg bg-gray-200 animate-pulse"
						style={{ height: "350px", width: "100%" }}
					>
						<p className="text-center pt-40">Loading card image...</p>
					</div>
				)}

				{/* Custom background image positioned in art area */}
				{backgroundImage && cardLoaded && (
					<div
						style={{
							position: "absolute",
							top: `${artAreaTop}%`,
							left: `${artAreaLeftRight}%`,
							right: `${artAreaLeftRight}%`,
							height: `${artAreaHeight}%`,
							backgroundImage: `url(${backgroundImage})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							borderRadius: "4px",
							border: "1px solid #000",
						}}
					/>
				)}
			</div>

			<div className="mt-4">
				<button
					onClick={downloadCard}
					className="bg-blue-500 text-white px-4 py-2 rounded w-full"
					disabled={!cardLoaded}
				>
					{cardLoaded ? "Download Custom Card" : "Loading card..."}
				</button>
			</div>
		</div>
	);
}

// Main App Component
export default function MTGCustomCardCreator() {
	const [selectedCard, setSelectedCard] = useState(null);
	const [backgroundImage, setBackgroundImage] = useState(null);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">MemeTG</h1>
			<p className="mb-4">
				Search for an MTG card and upload your own background image to create a
				custom card!
			</p>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<CardSearch onSelect={setSelectedCard} />
					<ImageUploader onImageUpload={setBackgroundImage} />
				</div>

				<div>
					<CardRenderer card={selectedCard} backgroundImage={backgroundImage} />
				</div>
			</div>
		</div>
	);
}
