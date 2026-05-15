import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	RiArrowLeftLine,
	RiArrowRightLine,
	RiFireFill,
	RiStarFill,
} from "react-icons/ri";
import ScrollReveal from "./Animation/ScrollReveal";

const dishes = [
	{
		name: "Phở Bò Hà Nội",
		price: "45.000₫",
		rating: 4.9,
		sales: "2.3k orders today",
		image: "/featured_pho.png",
		description:
			"Experience the authentic taste of Hanoi's legendary beef pho — rich bone broth simmered for 12 hours, silky rice noodles, and tender sliced beef topped with fresh herbs.",
		tags: ["Signature", "Best Seller"],
	},
	{
		name: "Bánh Mì Sài Gòn",
		price: "35.000₫",
		rating: 4.8,
		sales: "1.8k orders today",
		image: "/featured_banhmi.png",
		description:
			"The iconic Saigon baguette — crispy on the outside, soft inside, stuffed with grilled pork, pâté, pickled daikon, fresh cilantro, and a kick of chili.",
		tags: ["Popular", "Street Food"],
	},
	{
		name: "Gỏi Cuốn Tôm",
		price: "40.000₫",
		rating: 4.7,
		sales: "1.2k orders today",
		image: "/featured_springrolls.png",
		description:
			"Fresh Vietnamese spring rolls wrapped in delicate rice paper with succulent shrimp, vermicelli, crisp lettuce, and aromatic herbs. Served with hoisin peanut dip.",
		tags: ["Healthy", "Fresh"],
	},
	{
		name: "Bún Chả Hà Nội",
		price: "50.000₫",
		rating: 4.9,
		sales: "1.5k orders today",
		image: "/featured_buncha.png",
		description:
			"Hanoi's beloved bún chả — smoky chargrilled pork patties and sliced pork belly served with cool rice noodles, fresh herbs, and tangy dipping sauce.",
		tags: ["Traditional", "Must Try"],
	},
];

export default function FeaturedDish() {
	const [current, setCurrent] = useState(0);
	const [direction, setDirection] = useState(0);
	const dish = dishes[current];

	const prev = () => {
		setDirection(-1);
		setCurrent((c) => (c - 1 + dishes.length) % dishes.length);
	};
	const next = () => {
		setDirection(1);
		setCurrent((c) => (c + 1) % dishes.length);
	};

	return (
		<section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-sky-50 py-24 px-4 lg:px-16">
			{/* Decorative dots */}
			<div className="pointer-events-none absolute top-16 left-8 h-32 w-32 rounded-full bg-blue-100/40" />
			<div className="pointer-events-none absolute right-12 bottom-20 h-48 w-48 rounded-full bg-sky-100/50" />
			<div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/30" />

			<div className="relative z-10 mx-auto max-w-7xl">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					{/* Left — Image */}
					<ScrollReveal delay={0.1}>
						<div className="relative flex items-center justify-center">
							{/* Prev arrow */}
							<button
								onClick={prev}
								className="absolute left-0 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 lg:-left-6"
							>
								<RiArrowLeftLine className="text-lg text-blue-600" />
							</button>

							{/* Dish image with animated glow */}
							<div className="relative">
								<div className="absolute inset-0 scale-90 rounded-full bg-linear-to-br from-blue-200 to-sky-200 opacity-50 blur-3xl" />
								<AnimatePresence mode="wait">
									<motion.div
										key={current}
										initial={{
											opacity: 0,
											x: direction >= 0 ? 80 : -80,
											scale: 0.85,
											rotateY: direction >= 0 ? 15 : -15,
										}}
										animate={{
											opacity: 1,
											x: 0,
											scale: 1,
											rotateY: 0,
										}}
										exit={{
											opacity: 0,
											x: direction >= 0 ? -80 : 80,
											scale: 0.85,
											rotateY: direction >= 0 ? -15 : 15,
										}}
										transition={{
											duration: 0.5,
											ease: [0.25, 0.46, 0.45, 0.94],
										}}
										className="relative"
									>
										<img
											src={dish.image}
											alt={dish.name}
											className="relative z-10 h-80 w-[320px] rounded-4xl object-cover shadow-2xl md:h-105 md:w-105"
										/>

										{/* Hot badge */}
										<div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-linear-to-r from-orange-400 to-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
											<RiFireFill className="text-sm" />
											{dish.sales}
										</div>
									</motion.div>
								</AnimatePresence>
							</div>

							{/* Next arrow */}
							<button
								onClick={next}
								className="absolute right-0 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 lg:-right-6"
							>
								<RiArrowRightLine className="text-lg text-blue-600" />
							</button>

							{/* Dots indicator */}
							<div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
								{dishes.map((_, i) => (
									<button
										key={i}
										onClick={() => {
											setDirection(i > current ? 1 : -1);
											setCurrent(i);
										}}
										className={`h-2.5 rounded-full transition-all duration-300 ${
											i === current
												? "w-8 bg-blue-500"
												: "w-2.5 bg-blue-200 hover:bg-blue-300"
										}`}
									/>
								))}
							</div>
						</div>
					</ScrollReveal>

					{/* Right — Info */}
					<ScrollReveal delay={0.3}>
						<AnimatePresence mode="wait">
							<motion.div
								key={current}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
							>
								<div className="mb-4 flex flex-wrap gap-2">
									{dish.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600"
										>
											{tag}
										</span>
									))}
								</div>

								<h2 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
									{dish.name}
								</h2>

								<div className="mb-4 flex items-center gap-3">
									<span className="text-3xl font-bold text-blue-600">
										{dish.price}
									</span>
									<div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
										<RiStarFill className="text-amber-400" />
										<span className="text-sm font-semibold text-amber-700">
											{dish.rating}
										</span>
									</div>
								</div>

								<p className="mb-8 max-w-md text-base leading-relaxed text-gray-500">
									{dish.description}
								</p>

								<button className="cursor-pointer rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl">
									Explore This Dish
								</button>
							</motion.div>
						</AnimatePresence>
					</ScrollReveal>
				</div>
			</div>
		</section>
	);
}
