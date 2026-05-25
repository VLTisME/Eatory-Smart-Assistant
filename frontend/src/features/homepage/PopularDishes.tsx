import { RiStarFill } from "react-icons/ri";
import { motion } from "framer-motion";
import ScrollReveal from "./Animation/ScrollReveal";
import { useLanguage } from "../../hooks/useLanguage";

const POPULAR_TEXT = {
	vi: {
		menu: "Thực đơn",
		title1: "Chọn món ăn yêu thích",
		title2: "từ Ẩm thực",
		desc: "Khám phá những món ăn Việt Nam được yêu thích nhất từ khắp mọi miền đất nước — được đánh giá bởi du khách, tuyển chọn dành cho bạn.",
	},
	en: {
		menu: "Food Menu",
		title1: "Pick your favorite dish",
		title2: "from Food",
		desc: "Discover the most loved Vietnamese dishes from every corner of the country — rated by travelers, curated for you.",
	},
};

const popularDishes = [
	{
		name: "Sushi Ren",
		rating: 4.9,
		image: "https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778596122/smart_tourism/ChIJS2I83prPdDER3O6qYkqgC8Y/ChIJS2I83prPdDER3O6qYkqgC8Y_008.jpg",
	},
	{
		name: "Phở Nhất Vị",
		rating: 4.8,
		image: "https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778571777/smart_tourism/ChIJ8XuNRUspdTERy38oQfU5oc8/ChIJ8XuNRUspdTERy38oQfU5oc8_002.jpg",
	},
	{
		name: "OKKIO Coffee",
		rating: 4.7,
		image: "https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778574494/smart_tourism/ChIJiyfmqrYvdTERFpK50X-rB5Y/ChIJiyfmqrYvdTERFpK50X-rB5Y_005.jpg",
	},
	{
		name: "Bros Korea",
		rating: 4.9,
		image: "https://res.cloudinary.com/dj8o6k6ol/image/upload/v1778574627/smart_tourism/ChIJJ_YTX4IvdTER-Bo0wjUNwdE/ChIJJ_YTX4IvdTER-Bo0wjUNwdE_001.jpg",
	},
];

export default function PopularDishes() {
	const { lang } = useLanguage();
	const t = POPULAR_TEXT[lang];

	return (
		<section className="bg-white py-28 px-4 lg:px-16">
			<div className="mx-auto max-w-7xl">
				<ScrollReveal delay={0.1}>
					<div className="mb-14 text-center">
						<span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold tracking-wider text-blue-600 uppercase">
							{t.menu}
						</span>
						<h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
							{t.title1}
							<br />
							<span className="text-blue-600">{t.title2}</span>
						</h2>
						<p className="mx-auto max-w-lg text-base text-gray-500">
							{t.desc}
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
								<div className="p-5 pt-3">
									<h3 className="mb-0.5 text-lg font-bold text-gray-900">
										{dish.name}
									</h3>
								</div>
							</motion.div>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}
