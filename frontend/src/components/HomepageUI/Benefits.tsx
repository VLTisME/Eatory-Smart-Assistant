import { MapPin, ChartColumnStacked, Images } from "lucide-react";
import ScrollReveal from "./Animation/ScrollReveal";

const benefits = [
	{
		icon: MapPin,
		title: "AI-Powered Food Maps",
		description:
			"Our intelligent system curates the best local dishes and restaurants across 63 provinces, helping you discover hidden culinary treasures effortlessly.",
		bgClass: "bg-gradient-to-br from-blue-500 to-blue-700",
		textClass: "text-white",
		descClass: "text-blue-100",
	},
	{
		icon: ChartColumnStacked,
		title: "Review Summary",
		description:
			"Get concise AI-powered review summaries so you can quickly understand food quality, price, and customer experience before choosing where to eat.",
		bgClass: "bg-gradient-to-br from-violet-500 to-purple-700",
		textClass: "text-white",
		descClass: "text-violet-100",
	},
	{
		icon: Images,
		title: "Image Processing",
		description:
			"Use image-powered tools for Translate Menu and Place Search to better understand dishes and instantly find nearby food spots from what you see.",
		bgClass: "bg-gradient-to-br from-sky-400 to-cyan-600",
		textClass: "text-white",
		descClass: "text-sky-100",
	},
];

export default function Benefits() {
	return (
		<section className="bg-linear-to-b from-blue-50 to-white py-28 px-4 lg:px-16">
			<div className="mx-auto max-w-7xl">
				<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_2fr]">
					{/* Left — Title */}
					<ScrollReveal delay={0.1}>
						<div>
							<span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold tracking-wider text-blue-600 uppercase">
								Why Eatory
							</span>
							<h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
								The benefits you
								<br />
								will get from
								<br />
								<span className="text-blue-600">Eatory</span>
							</h2>
							<p className="max-w-sm text-sm leading-relaxed text-gray-500">
								We combine AI technology with deep local
								knowledge to create the ultimate food tourism
								companion for every traveler in Vietnam.
							</p>
						</div>
					</ScrollReveal>

					{/* Right — Cards */}
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
						{benefits.map((b, i) => (
							<ScrollReveal key={b.title} delay={0.2 + i * 0.15}>
								<div
									className={`group ${b.bgClass} relative overflow-hidden rounded-3xl p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
								>
									{/* Decorative circle */}
									<div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />

									<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
										<b.icon
											className={`text-2xl ${b.textClass}`}
										/>
									</div>

									<h3
										className={`mb-3 text-lg font-bold ${b.textClass}`}
									>
										{b.title}
									</h3>
									<p
										className={`text-sm leading-relaxed ${b.descClass}`}
									>
										{b.description}
									</p>
								</div>
							</ScrollReveal>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
