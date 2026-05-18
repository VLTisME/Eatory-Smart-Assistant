import {
	RiLeafLine,
	RiMapPinLine,
	RiHeartPulseLine,
	RiSparklingLine,
} from "react-icons/ri";
import ScrollReveal from "./Animation/ScrollReveal";
import { useLanguage } from "../../hooks/useLanguage";

const WHY_TEXT = {
	vi: {
		title1: "Khám phá Việt Nam bằng",
		title2: "hương vị & niềm vui",
		desc: "Chúng tôi mang đến cho bạn những trải nghiệm ẩm thực tinh túy nhất trên mọi tỉnh thành — từ những quán ăn đường phố ẩn mình đến những đặc sản địa phương huyền thoại.",
		features: [
			{
				icon: RiLeafLine,
				label: "100% Công thức\nChuẩn vị",
				color: "from-emerald-400 to-emerald-600",
			},
			{
				icon: RiSparklingLine,
				label: "Nguyên liệu\nĐịa phương tươi ngon",
				color: "from-blue-400 to-blue-600",
			},
			{
				icon: RiMapPinLine,
				label: "Địa điểm ăn uống\nĐược tuyển chọn",
				color: "from-violet-400 to-violet-600",
			},
			{
				icon: RiHeartPulseLine,
				label: "Trải nghiệm\nVăn hóa phong phú",
				color: "from-rose-400 to-rose-600",
			},
		]
	},
	en: {
		title1: "Discover Vietnam with",
		title2: "taste & joy",
		desc: "We bring you the finest culinary experiences across every province — from hidden street food gems to legendary local specialties.",
		features: [
			{
				icon: RiLeafLine,
				label: "100% Authentic\nRecipes",
				color: "from-emerald-400 to-emerald-600",
			},
			{
				icon: RiSparklingLine,
				label: "Fresh Local\nIngredients",
				color: "from-blue-400 to-blue-600",
			},
			{
				icon: RiMapPinLine,
				label: "Curated Food\nLocations",
				color: "from-violet-400 to-violet-600",
			},
			{
				icon: RiHeartPulseLine,
				label: "Rich Cultural\nExperience",
				color: "from-rose-400 to-rose-600",
			},
		]
	}
};

export default function WhyChooseUs() {
	const { lang } = useLanguage();
	const t = WHY_TEXT[lang];
	const features = t.features;

	return (
		<section id="why-us" className="relative overflow-hidden bg-white py-28 px-4">
			<div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full border-2 border-blue-100/50" />
			<div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-2 border-sky-100/50" />

			<div className="mx-auto max-w-5xl">
				<ScrollReveal delay={0.1}>
					<h2 className="mx-auto mb-6 max-w-lg text-center text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
						{t.title1}{" "}
						<span className="bg-linear-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
							{t.title2}
						</span>
					</h2>
					<p className="mx-auto mb-16 max-w-xl text-center text-base leading-relaxed text-gray-500">
						{t.desc}
					</p>
				</ScrollReveal>

				<div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
					{features.map((f, i) => (
						<ScrollReveal key={f.label} delay={0.15 + i * 0.1}>
							<div className="group flex flex-col items-center gap-4">
								<div
									className={`flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br ${f.color} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl md:h-28 md:w-28`}
								>
									<f.icon className="text-3xl text-white md:text-4xl" />
								</div>
								<p className="max-w-30 text-center text-sm font-semibold leading-tight text-gray-700 whitespace-pre-line">
									{f.label}
								</p>
							</div>
						</ScrollReveal>
					))}
				</div>
			</div>
		</section>
	);
}
