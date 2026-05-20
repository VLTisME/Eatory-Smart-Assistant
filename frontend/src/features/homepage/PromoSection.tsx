import { RiArrowRightUpLine, RiMapPinLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import ScrollReveal from "./Animation/ScrollReveal";
import { useLanguage } from "../../hooks/useLanguage";

const PROMO_TEXT = {
	vi: {
		badge: "63 Tỉnh thành · Hơn 1000 Món ăn",
		title1: "Để vị giác của bạn",
		title2: "khám phá thế giới",
		desc: "Từ những con phố nhộn nhịp của Sài Gòn đến vùng cao nguyên thanh bình của Sapa — để Eatory dẫn dắt hành trình ẩm thực của bạn qua trái tim Việt Nam.",
		btn: "Khám phá ngay",
		startWith: "Bắt đầu với",
		discount: "10% OFF",
		firstTrip: "Chuyến đầu tiên",
	},
	en: {
		badge: "63 Provinces · 1000+ Dishes",
		title1: "Let your taste",
		title2: "explore the world",
		desc: "From the bustling streets of Saigon to the serene highlands of Sapa — let Eatory guide your culinary journey through the heart of Vietnam.",
		btn: "Start Exploring",
		startWith: "Starting with",
		discount: "10% OFF",
		firstTrip: "First Trip",
	},
};

export default function PromoSection() {
	const { lang } = useLanguage();
	const t = PROMO_TEXT[lang];

	return (
		<section
			id="promo"
			className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 py-28 px-4 lg:px-16"
		>
			<div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-16 -bottom-16 h-60 w-60 rounded-full bg-sky-400/15 blur-3xl" />
			<div className="pointer-events-none absolute top-1/4 right-1/3 h-32 w-32 rounded-full bg-white/5" />
			<div className="pointer-events-none absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full border border-white/10" />

			<div
				className="pointer-events-none absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						"radial-gradient(circle, white 1px, transparent 1px)",
					backgroundSize: "32px 32px",
				}}
			/>

			<div className="relative z-10 mx-auto max-w-6xl">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					<ScrollReveal delay={0.1}>
						<div>
							<div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 backdrop-blur-sm">
								<RiMapPinLine className="text-sky-300" />
								<span className="text-xs font-semibold text-white/90">
									{t.badge}
								</span>
							</div>

							<h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
								{t.title1}
								<br />
								<span className="bg-linear-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
									{t.title2}
								</span>
							</h2>

							<p className="mb-8 max-w-md text-base leading-relaxed text-blue-100/80">
								{t.desc}
							</p>

							<Link
								to="/MainPage"
								className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-semibold text-blue-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl duration-400"
							>
								<span>{t.btn}</span>
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-transform group-hover:rotate-45">
									<RiArrowRightUpLine className="text-base" />
								</div>
							</Link>
						</div>
					</ScrollReveal>
					<ScrollReveal delay={0.3}>
						<div className="relative flex items-center justify-center">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-4">
									<div className="overflow-hidden rounded-3xl shadow-xl">
										<img
											src="https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778570629/smart_tourism/ChIJ1w88TZ0pdTERT4ch6NBVciY/ChIJ1w88TZ0pdTERT4ch6NBVciY_008.jpg"
											alt="Coffe"
											className="h-48 w-full object-cover transition-transform duration-500 hover:scale-110"
										/>
									</div>
									<div className="overflow-hidden rounded-3xl shadow-xl">
										<img
											src="https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778596901/smart_tourism/ChIJzVJD4tcndTERP0sVs7w_M4E/ChIJzVJD4tcndTERP0sVs7w_M4E_008.jpg"
											alt="Sup"
											className="h-32 w-full object-cover transition-transform duration-500 hover:scale-110"
										/>
									</div>
								</div>
								<div className="mt-8 space-y-4">
									<div className="overflow-hidden rounded-3xl shadow-xl">
										<img
											src="https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778575637/smart_tourism/ChIJOf82eTAvdTERL7EwXnZu_Go/ChIJOf82eTAvdTERL7EwXnZu_Go_007.jpg"
											alt="Fruit"
											className="h-32 w-full object-cover transition-transform duration-500 hover:scale-110"
										/>
									</div>
									<div className="overflow-hidden rounded-3xl shadow-xl">
										<img
											src="https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778596122/smart_tourism/ChIJS2I83prPdDER3O6qYkqgC8Y/ChIJS2I83prPdDER3O6qYkqgC8Y_003.jpg"
											alt="Sushi"
											className="h-48 w-full object-cover transition-transform duration-500 hover:scale-110"
										/>
									</div>
								</div>
							</div>
							<div className="absolute -right-2 top-8 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-sm md:-right-12">
								<p className="text-xs font-semibold text-gray-500">
									{t.startWith}
								</p>
								<p className="text-xl font-bold text-blue-600">
									EATORY
								</p>
							</div>
							<div className="absolute -left-2 bottom-32 flex items-center gap-2 rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 px-4 py-2 shadow-lg md:-left-15">
								<span className="text-sm font-bold text-white">
									{t.discount}
								</span>
								<span className="text-xs text-emerald-100">
									{t.firstTrip}
								</span>
							</div>
						</div>
					</ScrollReveal>
				</div>
			</div>
		</section>
	);
}
