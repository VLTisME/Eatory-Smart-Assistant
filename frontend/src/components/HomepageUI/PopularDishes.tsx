import { RiStarFill, RiShoppingCart2Line } from "react-icons/ri";
import { motion } from "framer-motion";
import ScrollReveal from "./Animation/ScrollReveal";

const popularDishes = [
	{
		name: "Phở Bò Tái",
		region: "Hà Nội",
		price: "45.000₫",
		calories: "350 cal",
		rating: 4.9,
		image: "/featured_pho.png",
	},
	{
		name: "Bánh Mì Thịt",
		region: "TP. Hồ Chí Minh",
		price: "35.000₫",
		calories: "420 cal",
		rating: 4.8,
		image: "/featured_banhmi.png",
	},
	{
		name: "Gỏi Cuốn Tôm",
		region: "Miền Tây",
		price: "40.000₫",
		calories: "180 cal",
		rating: 4.7,
		image: "/featured_springrolls.png",
	},
	{
		name: "Bún Chả Hà Nội",
		region: "Hà Nội",
		price: "50.000₫",
		calories: "450 cal",
		rating: 4.9,
		image: "/featured_buncha.png",
	},
];

export default function PopularDishes() {
	return (
		<section className="bg-white py-28 px-4 lg:px-16">
			<div className="mx-auto max-w-7xl">
				<ScrollReveal delay={0.1}>
					<div className="mb-14 text-center">
						<span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold tracking-wider text-blue-600 uppercase">
							Featured Menu
						</span>
						<h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
							Pick your favorite dish
							<br />
							<span className="text-blue-600">from featured</span>
						</h2>
						<p className="mx-auto max-w-lg text-base text-gray-500">
							Discover the most loved Vietnamese dishes from every
							corner of the country — rated by travelers, curated
							for you.
						</p>
					</div>
				</ScrollReveal>

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{popularDishes.map((dish, i) => (
						<ScrollReveal key={dish.name} delay={0.15 + i * 0.1}>
							<motion.div
								whileHover={{ y: -8 }}
								transition={{ duration: 0.3, ease: "easeOut" }}
								className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-xl"
							>
								{/* Image */}
								<div className="relative overflow-hidden bg-linear-to-br from-blue-50 to-sky-50 p-6 pb-4">
									<img
										src={dish.image}
										alt={dish.name}
										className="mx-auto h-40 w-40 rounded-2xl object-cover transition-transform duration-500 group-hover:scale-110"
									/>

									{/* Rating badge */}
									<div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
										<RiStarFill className="text-xs text-amber-400" />
										<span className="text-xs font-bold text-gray-800">
											{dish.rating}
										</span>
									</div>
								</div>

								{/* Content */}
								<div className="p-5 pt-3">
									<h3 className="mb-0.5 text-lg font-bold text-gray-900">
										{dish.name}
									</h3>
									<p className="mb-2 text-xs font-medium text-gray-400">
										{dish.region} · {dish.calories}
									</p>

									<div className="flex items-center justify-between">
										<span className="text-xl font-bold text-blue-600">
											{dish.price}
										</span>
										<button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-all hover:scale-110 hover:bg-blue-700 hover:shadow-lg">
											<RiShoppingCart2Line className="text-base" />
										</button>
									</div>
								</div>
							</motion.div>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}
