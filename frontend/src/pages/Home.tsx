import { useState, useEffect } from "react";

import HeroSection from "../components/HomepageUI/HeroSection";
import FeaturedDish from "../components/HomepageUI/FeaturedDish";
import WhyChooseUs from "../components/HomepageUI/WhyChooseUs";
import Benefits from "../components/HomepageUI/Benefits";
import PopularDishes from "../components/HomepageUI/PopularDishes";
import PromoSection from "../components/HomepageUI/PromoSection";
import Footer from "../components/HomepageUI/Footer";
import ScrollReveal from "../components/HomepageUI/Animation/ScrollReveal";

/**
 * Arch-shaped transition: a SVG "dome" that overlaps the previous section,
 * using the NEXT section's background color as the fill.
 */
function SectionWithArch({
	children,
	bgColor,
	bgClass,
	zIndex,
	id,
	archOverlap = 80,
}: {
	children: React.ReactNode;
	bgColor: string;
	bgClass: string;
	zIndex: number;
	id?: string;
	archOverlap?: number;
}) {
	return (
		<div id={id} className={`relative ${bgClass}`} style={{ zIndex }}>
			{/* Arch dome at top — overlaps previous section */}
			<div
				className="w-full overflow-hidden"
				style={{
					marginTop: `-${archOverlap}px`,
					position: "relative",
					zIndex: zIndex + 1,
				}}
			>
				<svg
					viewBox="0 0 1440 100"
					preserveAspectRatio="none"
					className="block w-full"
					style={{ height: "100px" }}
				>
					<path
						d="M0,100 L0,100 Q720,0 1440,100 L1440,100 Z"
						fill={bgColor}
					/>
				</svg>
			</div>
			{/* Content */}
			<div className="pt-4 pb-20">{children}</div>
		</div>
	);
}

export default function Home() {
	const [province, setProvince] = useState(() => {
		return localStorage.getItem("province") || "";
	});
	useEffect(() => {
		if (province) {
			localStorage.setItem("province", province);
		}
	}, [province]);

	return (
		<div className="overflow-x-hidden bg-white font-sans">
			{/* Hero Section — has id="hero" inside */}
			<HeroSection
				selectedProvince={province}
				setSelectedProvince={setProvince}
			/>

			{/* Featured Dish Carousel */}
			<SectionWithArch
				id="featured"
				bgColor="#eff6ff"
				bgClass="bg-blue-50"
				zIndex={10}
			>
				<FeaturedDish />
			</SectionWithArch>

			{/* Why Choose Us */}
			<SectionWithArch
				id="why-us"
				bgColor="#ffffff"
				bgClass="bg-white"
				zIndex={20}
			>
				<WhyChooseUs />
			</SectionWithArch>

			{/* Benefits */}
			<SectionWithArch
				id="benefits"
				bgColor="#eff6ff"
				bgClass="bg-blue-50"
				zIndex={30}
			>
				<Benefits />
			</SectionWithArch>

			{/* Popular Dishes */}
			<SectionWithArch
				id="popular"
				bgColor="#ffffff"
				bgClass="bg-white"
				zIndex={40}
			>
				<ScrollReveal delay={0.1}>
					<PopularDishes />
				</ScrollReveal>
			</SectionWithArch>

			{/* Promo CTA */}
			<div id="promo" className="relative" style={{ zIndex: 50 }}>
				<PromoSection />
			</div>

			{/* Footer */}
			<div className="relative" style={{ zIndex: 60 }}>
				<Footer />
			</div>
		</div>
	);
}
