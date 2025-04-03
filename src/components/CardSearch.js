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
