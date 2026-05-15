import ScrollSelect from "./Scroll/ScrollSelect";
import SlideIn from "./Animation/SlideIn";
import BackgroundImage from "../../assets/vietnam.png";
import Navbar from "./Navbar/Navbar";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useFoodSearch } from "../../hooks/useFoodSearch";
import { useNavigate } from "react-router-dom";
import { UBND_COORDS } from "../../data/ubndCoords";

interface HeroSectionProps {
	selectedProvince: string;
	setSelectedProvince: (value: string) => void;
}

export default function HeroSection({
	selectedProvince,
	setSelectedProvince,
}: HeroSectionProps) {
	const navigate = useNavigate();
	const { province: detectedProvince, loading: geoLoading } =
		useGeolocation();

	const displayProvince = selectedProvince || detectedProvince;
	const { search, loading: searchLoading } = useFoodSearch();
	const isLoading = geoLoading || searchLoading;

	const handleSearch = () => {
		if (!displayProvince) return;
		const coords = UBND_COORDS[displayProvince];
		if (coords) {
			navigate(
				`/?lat=${coords.lat}&lng=${coords.lng}&province=${encodeURIComponent(displayProvince)}`,
				{ replace: true },
			);
		}
		search(displayProvince);
		localStorage.setItem("hasSearched", "true");

		setTimeout(() => {
			window.scrollTo({
				top: window.innerHeight * 0.8,
				behavior: "smooth",
			});
		}, 100);
	};

	return (
		<div
			id="hero"
			className="relative flex min-h-[calc(100vh+80px)] flex-col justify-between overflow-hidden bg-cover bg-center pb-20"
			style={{ backgroundImage: `url(${BackgroundImage})` }}
		>
			{/* Overlay */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/20" />

			<SlideIn
				delay={0.2}
				direction="up"
				className="flex flex-1 flex-col w-full"
			>
				<Navbar />

				<main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
					<h2 className="mb-2 text-sm font-semibold tracking-[0.3em] text-white uppercase drop-shadow-md md:text-base">
						Discover Your Next
					</h2>

					<h1 className="font-display mt-4 mb-6 text-[7rem] leading-[0.8] font-semibold tracking-normal text-white drop-shadow-xl md:text-[10rem] lg:text-[14rem]">
						ADVENTURE
					</h1>

					<p className="max-w-2xl text-sm leading-relaxed font-medium text-white/90 drop-shadow-md md:text-base">
						Experience the magic of exploring the world's most
						breathtaking destinations
						<br className="hidden md:block" />
						with our custom-designed travel packages for every
						adventurer.
					</p>
				</main>
			</SlideIn>

			{/* Search bar — compact, blur glass */}
			<SlideIn delay={0.6} direction="up">
				<div className="relative z-10 mx-auto mt-12 w-full max-w-xl px-4 pb-16">
					<div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl">
						{/* Location selector */}
						<div className="flex min-w-0 flex-1 items-center gap-2 pl-3">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="currentColor"
								className="h-4 w-4 shrink-0 text-blue-300"
							>
								<path
									fillRule="evenodd"
									d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
									clipRule="evenodd"
								/>
							</svg>
							<ScrollSelect
								value={displayProvince}
								onSelect={setSelectedProvince}
								isLoading={isLoading}
							/>
						</div>

						{/* Search button */}
						<button
							onClick={handleSearch}
							disabled={isLoading}
							aria-busy={isLoading}
							className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-white shadow-lg transition-all hover:bg-blue-600 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="2.5"
								stroke="currentColor"
								className="h-4 w-4"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
								/>
							</svg>
							<span className="hidden text-sm font-semibold sm:inline">
								{isLoading ? "Searching..." : "Search"}
							</span>
						</button>
					</div>
				</div>
			</SlideIn>
		</div>
	);
}
