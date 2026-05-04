import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2, MapPin, ChevronRight } from "lucide-react";
import { usePlaceSearch } from "../../hooks/usePlaceSearch";
import {
	getPlaceDetail,
	type PlacePrediction,
	type PlaceDetailResult,
} from "../../api/placeSearchAPI";

/* ═══════════════════════════════════════════════════════════════════════════
   SearchBar — Premium place-search autocomplete component
   ─────────────────────────────────────────────────────────────────────────
   Features:
     • 400 ms debounce + AbortController (no race conditions)
     • Client-side result cache (Map on RAM)
     • Keyboard nav: ↑ / ↓ / Enter / Esc
     • Loading spinner, clear (×) button, empty-state message
     • Keyword highlighting in dropdown results
     • Drill-down: has_children → re-search; leaf → flyTo
   ═══════════════════════════════════════════════════════════════════════════ */

interface SearchBarProps {
	/** Called when user reaches a final place (has_children=false) with full detail including lat/lng */
	onSelectPlace?: (place: PlaceDetailResult) => void;
}

function SearchBar({ onSelectPlace }: SearchBarProps) {
	const {
		query,
		setQuery,
		results,
		isLoading,
		isOpen,
		setIsOpen,
		activeIndex,
		setActiveIndex,
		error,
		clear,
		close,
	} = usePlaceSearch({ debounceMs: 400, limit: 10 });

	const [isFetchingDetail, setIsFetchingDetail] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// ── Select a result ─────────────────────────────────────────────────────
	// Drill-down logic:
	//   • has_children = true  → use description as new search query (re-open dropdown)
	//   • has_children = false → final place → call /detail to get lat/lng → flyTo
	const handleSelect = useCallback(
		async (prediction: PlacePrediction) => {
			if (prediction.has_children) {
				// ── Drill down: re-search with the description ──────────
				setQuery(prediction.description);
				setIsOpen(true);
				inputRef.current?.focus();
				return;
			}

			// ── Final place: fetch detail for coordinates ───────────────
			setQuery(prediction.description);
			close();

			if (!onSelectPlace) return;

			setIsFetchingDetail(true);
			try {
				const response = await getPlaceDetail(prediction.place_id);
				if (response.result) {
					onSelectPlace(response.result);
				}
			} catch (err) {
				console.error("Failed to fetch place details:", err);
			} finally {
				setIsFetchingDetail(false);
			}
		},
		[setQuery, setIsOpen, close, onSelectPlace],
	);

	// ── Keyboard navigation ─────────────────────────────────────────────────
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!isOpen || results.length === 0) {
				if (e.key === "Escape") {
					inputRef.current?.blur();
				}
				return;
			}

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setActiveIndex((prev) =>
						prev < results.length - 1 ? prev + 1 : 0,
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setActiveIndex((prev) =>
						prev > 0 ? prev - 1 : results.length - 1,
					);
					break;
				case "Enter":
					e.preventDefault();
					if (activeIndex >= 0 && activeIndex < results.length) {
						handleSelect(results[activeIndex]);
					}
					break;
				case "Escape":
					e.preventDefault();
					close();
					inputRef.current?.blur();
					break;
			}
		},
		[isOpen, results, activeIndex, setActiveIndex, handleSelect, close],
	);

	// ── Scroll active item into view ────────────────────────────────────────
	useEffect(() => {
		if (activeIndex < 0 || !listRef.current) return;
		const item = listRef.current.children[activeIndex] as HTMLElement;
		item?.scrollIntoView({ block: "nearest" });
	}, [activeIndex]);

	// ── Close dropdown on outside click ─────────────────────────────────────
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				close();
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [close]);

	// ── Keyword highlighting helper ─────────────────────────────────────────
	const highlightMatch = (text: string, keyword: string) => {
		if (!keyword.trim()) return text;
		const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(${escapedKw})`, "gi");
		const parts = text.split(regex);
		return parts.map((part, i) =>
			regex.test(part) ? (
				<span
					key={i}
					className="font-extrabold text-indigo-700 bg-indigo-500/10 rounded-xs px-px"
				>
					{part}
				</span>
			) : (
				part
			),
		);
	};

	// ── Whether to show dropdown ────────────────────────────────────────────
	const showDropdown =
		isOpen &&
		query.trim().length > 0 &&
		(results.length > 0 || error || (!isLoading && results.length === 0));

	return (
		<div
			ref={containerRef}
			className="relative w-100 m-4 z-100 font-sans pointer-events-auto"
		>
			{/* ── Input row ─────────────────────────────────────────────── */}
			<div
				className={`flex items-center gap-2 px-4 h-12 bg-white/92 backdrop-blur-lg backdrop-saturate-[1.8] border-[1.5px] border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.07),0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-250 ease-in-out hover:bg-white/97 hover:shadow-[0_6px_28px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] focus-within:bg-white focus-within:border-indigo-500/40 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_6px_28px_rgba(0,0,0,0.1)] group/wrapper ${showDropdown ? "rounded-t-2xl rounded-b-none border-b-black/5" : "rounded-2xl"}`}
			>
				<Search
					size={18}
					className="shrink-0 text-gray-400 transition-colors duration-200 group-focus-within/wrapper:text-indigo-500"
				/>

				<input
					ref={inputRef}
					id="place-search-input"
					type="text"
					value={query}
					placeholder="Tìm kiếm địa điểm…"
					autoComplete="off"
					onChange={(e) => {
						setQuery(e.target.value);
						if (!isOpen && e.target.value.trim()) setIsOpen(true);
					}}
					onFocus={() => {
						if (query.trim() && results.length > 0) setIsOpen(true);
					}}
					onKeyDown={handleKeyDown}
					className="flex-1 border-none outline-none bg-transparent text-[14px] font-medium text-gray-800 leading-normal placeholder:text-gray-400 placeholder:font-normal"
				/>

				{/* Loading spinner */}
				{(isLoading || isFetchingDetail) && (
					<Loader2
						size={16}
						className="shrink-0 text-indigo-500 animate-[spin_0.8s_linear_infinite]"
					/>
				)}

				{/* Clear button */}
				{query && !isLoading && !isFetchingDetail && (
					<button
						type="button"
						aria-label="Xóa từ khóa"
						onClick={clear}
						className="flex items-center justify-center w-6 h-6 border-none rounded-lg bg-black/5 text-gray-500 cursor-pointer transition-all duration-150 ease-out shrink-0 hover:bg-red-500/10 hover:text-red-500"
					>
						<X size={15} />
					</button>
				)}
			</div>

			{/* ── Dropdown ──────────────────────────────────────────────── */}
			{showDropdown && (
				<div className="absolute top-full left-0 right-0 bg-white/97 backdrop-blur-lg backdrop-saturate-[1.8] border-[1.5px] border-t-0 border-black/5 rounded-b-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden animate-[searchbar-slide-in_0.18s_ease-out]">
					{/* Error state */}
					{error && (
						<div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-400 text-[13px] font-medium">
							<span className="opacity-60">⚠️</span>
							<span>{error}</span>
						</div>
					)}

					{/* Empty state */}
					{!error && !isLoading && results.length === 0 && (
						<div className="flex items-center justify-center gap-2 px-4 py-6 text-gray-400 text-[13px] font-medium">
							<Search size={20} className="opacity-60" />
							<span>Không tìm thấy kết quả</span>
						</div>
					)}

					{/* Results list */}
					{results.length > 0 && (
						<ul
							ref={listRef}
							className="list-none m-0 p-1.5 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded"
							role="listbox"
							id="place-search-listbox"
						>
							{results.map((pred, idx) => {
								const mainText =
									pred.structured_formatting?.main_text ??
									pred.description;
								const secondaryText =
									pred.structured_formatting
										?.secondary_text ?? "";

								return (
									<li
										key={pred.place_id}
										role="option"
										aria-selected={idx === activeIndex}
										className={`flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer transition-[background,transform] duration-150 ease-out animate-[searchbar-item-enter_0.22s_ease-out_both] group/item hover:bg-[linear-gradient(135deg,rgba(99,102,241,0.06)_0%,rgba(168,85,247,0.04)_100%)] ${idx === activeIndex ? "bg-[linear-gradient(135deg,rgba(99,102,241,0.1)_0%,rgba(168,85,247,0.07)_100%)]" : ""}`}
										style={{
											animationDelay: `${idx * 30}ms`,
										}}
										onMouseEnter={() => setActiveIndex(idx)}
										onClick={() => handleSelect(pred)}
									>
										<MapPin
											size={16}
											className={`shrink-0 mt-0.5 transition-colors duration-150 group-hover/item:text-indigo-500 ${idx === activeIndex ? "text-indigo-500" : "text-indigo-300"}`}
										/>
										<div className="flex flex-col gap-0.5 min-w-0 flex-1">
											<span className="text-[13.5px] font-semibold text-gray-800 leading-[1.35] truncate">
												{highlightMatch(
													mainText,
													query,
												)}
											</span>
											{secondaryText && (
												<span className="text-[12px] font-normal text-gray-500 leading-[1.3] truncate">
													{highlightMatch(
														secondaryText,
														query,
													)}
												</span>
											)}
										</div>
										{/* Drill-down indicator for places with sub-areas */}
										{pred.has_children && (
											<ChevronRight
												size={14}
												className="shrink-0 mt-0.5 text-gray-300 group-hover/item:text-indigo-400 transition-colors duration-150"
											/>
										)}
									</li>
								);
							})}
						</ul>
					)}

					{/* Footer hint */}
					{results.length > 0 && (
						<div className="flex items-center justify-center gap-1 px-3 py-2 text-[11px] text-gray-400 border-t border-black/5 bg-gray-50/60 [&>kbd]:inline-flex [&>kbd]:items-center [&>kbd]:justify-center [&>kbd]:min-w-5 [&>kbd]:h-4.5 [&>kbd]:px-1 [&>kbd]:text-[10px] [&>kbd]:font-inherit [&>kbd]:font-semibold [&>kbd]:text-gray-500 [&>kbd]:bg-white [&>kbd]:border [&>kbd]:border-gray-200 [&>kbd]:rounded-sm [&>kbd]:shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
							<kbd>↑</kbd> <kbd>↓</kbd> di chuyển &nbsp;·&nbsp;{" "}
							<kbd>Enter</kbd> chọn &nbsp;·&nbsp; <kbd>Esc</kbd>{" "}
							đóng
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default SearchBar;
