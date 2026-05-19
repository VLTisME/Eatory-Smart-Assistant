import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	RiMapPinLine,
	RiFacebookFill,
	RiInstagramLine,
	RiTwitterXLine,
	RiYoutubeFill,
	RiArrowRightUpLine,
} from "react-icons/ri";
import Logo from "../../assets/logo.svg";
import { useLanguage } from "../../hooks/useLanguage";

const FOOTER_TEXT = {
	vi: {
		start: "BẮT ĐẦU",
		adventure: "HÀNH TRÌNH",
		desc: "Đăng ký nhận bản tin của chúng tôi và nhận hướng dẫn ẩm thực độc quyền, mẹo nội bộ và cảm hứng điểm đến cho hành trình ẩm thực tiếp theo của bạn.",
		emailPlaceholder: "Nhập địa chỉ email của bạn...",
		subscribe: "Đăng ký",
		aboutDesc:
			"Người bạn đồng hành du lịch ẩm thực hỗ trợ bởi AI của bạn — khám phá, trải nghiệm và thưởng thức hương vị đích thực của Việt Nam trên 63 tỉnh thành.",
		quickLinks: "Liên kết nhanh",
		topDestinations: "Điểm đến hàng đầu",
		contactUs: "Liên hệ chúng tôi",
		allRights: "Mọi quyền được bảo lưu",
		privacy: "Chính sách bảo mật",
		terms: "Điều khoản dịch vụ",
		links: [
			{ label: "Trang chủ", to: "/" },
			{ label: "Khám phá bản đồ", to: "/MainPage" },
			{ label: "Về chúng tôi", to: "#" },
			{ label: "Liên hệ", to: "#" },
		],
	},
	en: {
		start: "START YOUR",
		adventure: "ADVENTURE",
		desc: "Sign up for our newsletter and receive exclusive food guides, insider tips, and destination inspiration for your next culinary journey.",
		emailPlaceholder: "Enter your email address...",
		subscribe: "Subscribe",
		aboutDesc:
			"Your AI-powered food tourism companion — discover, explore, and savor the authentic flavors of Vietnam across all 63 provinces.",
		quickLinks: "Quick Links",
		topDestinations: "Top Destinations",
		contactUs: "Contact Us",
		allRights: "All Rights Reserved",
		privacy: "Privacy Policy",
		terms: "Terms of Service",
		links: [
			{ label: "Home", to: "/" },
			{ label: "Explore Map", to: "/MainPage" },
			{ label: "About Us", to: "#" },
			{ label: "Contact", to: "#" },
		],
	},
};

const destinations = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Huế", "Hội An"];

const socials = [
	{ icon: RiFacebookFill, href: "#", label: "Facebook" },
	{ icon: RiInstagramLine, href: "#", label: "Instagram" },
	{ icon: RiTwitterXLine, href: "#", label: "Twitter" },
	{ icon: RiYoutubeFill, href: "#", label: "YouTube" },
];

export default function Footer() {
	const { lang } = useLanguage();
	const t = FOOTER_TEXT[lang];
	const navigate = useNavigate();
	const [promoEmail, setPromoEmail] = useState("");

	const handleSubscribe = (e: React.FormEvent) => {
		e.preventDefault();
		if (promoEmail.trim()) {
			navigate(`/AuthPage?mode=signup&email=${encodeURIComponent(promoEmail.trim())}`);
		}
	};

	return (
		<>
			<section className="relative overflow-hidden bg-linear-to-r from-blue-600 to-blue-800 py-20 px-4">
				<div
					className="pointer-events-none absolute inset-0 opacity-5"
					style={{
						backgroundImage:
							"radial-gradient(circle, white 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
				<div className="relative z-10 mx-auto max-w-4xl text-center">
					<h2 className="font-display mb-4 text-5xl font-bold tracking-wide text-white md:text-7xl">
						{t.start}
						<br />
						{t.adventure}
					</h2>
					<p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-blue-100/80 md:text-base">
						{t.desc}
					</p>
					<form onSubmit={handleSubscribe} className="mx-auto flex max-w-md flex-col items-center gap-3 sm:flex-row">
						<input
							type="email"
							placeholder={t.emailPlaceholder}
							value={promoEmail}
							onChange={(e) => setPromoEmail(e.target.value)}
							className="w-full rounded-full bg-white/15 px-6 py-3.5 text-sm text-white placeholder-blue-200/60 outline-none ring-1 ring-white/20 backdrop-blur-sm transition-all focus:bg-white/20 focus:ring-white/40"
							required
						/>
						<button
							type="submit"
							className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
						>
							{t.subscribe}
							<RiArrowRightUpLine className="text-base" />
						</button>
					</form>
				</div>
			</section>
			<footer className="relative overflow-hidden bg-gray-950 pt-20 text-white">
				<div className="mx-auto max-w-7xl px-6 md:px-12">
					<div className="relative z-10 mb-16 grid grid-cols-1 gap-12 md:grid-cols-12">
						<div className="md:col-span-4 lg:col-span-5">
							<Link
								to="/"
								className="mb-4 flex items-center gap-2"
							>
								<img
									src={Logo}
									alt="Eatory logo"
									className="h-10 w-auto"
								/>
								<span className="text-2xl font-bold tracking-wide">
									EATORY
								</span>
							</Link>
							<p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
								{t.aboutDesc}
							</p>
							<div className="flex gap-3">
								{socials.map((s) => (
									<a
										key={s.label}
										href={s.href}
										aria-label={s.label}
										className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition-all hover:scale-110 hover:bg-blue-600 hover:text-white"
									>
										<s.icon className="text-sm" />
									</a>
								))}
							</div>
						</div>
						<div className="md:col-span-2 lg:col-span-2">
							<h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-300">
								{t.quickLinks}
							</h4>
							<ul className="space-y-3.5 text-sm text-gray-400">
								{t.links.map((link) => (
									<li key={link.label}>
										<Link
											to={link.to}
											className="transition-colors hover:text-white"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div className="md:col-span-3 lg:col-span-2">
							<h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-300">
								{t.topDestinations}
							</h4>
							<ul className="space-y-3.5 text-sm text-gray-400">
								{destinations.map((d) => (
									<li key={d}>
										<a
											href="#"
											className="flex items-center gap-1.5 transition-colors hover:text-white"
										>
											<RiMapPinLine className="text-xs text-blue-400" />
											{d}
										</a>
									</li>
								))}
							</ul>
						</div>
						<div className="md:col-span-3 lg:col-span-3">
							<h4 className="mb-6 text-sm font-bold uppercase tracking-wider text-gray-300">
								{t.contactUs}
							</h4>
							<ul className="space-y-3.5 text-sm text-gray-400">
								<li>eatory@support.com</li>
								<li>+84 (0) 123 456 789</li>
								<li>Ho Chi Minh City, Vietnam</li>
							</ul>
						</div>
					</div>
					<hr className="relative z-10 border-gray-800" />
					<div className="relative z-10 flex flex-col items-center justify-center gap-4 py-8 text-center text-sm text-gray-500 md:flex-row">
						<span>© 2024 Eatory . {t.allRights}</span>
						<span className="hidden md:inline">|</span>
						<a
							href="#"
							className="transition-colors hover:text-white"
						>
							{t.privacy}
						</a>
						<span className="hidden md:inline">|</span>
						<a
							href="#"
							className="transition-colors hover:text-white"
						>
							{t.terms}
						</a>
					</div>
				</div>

				<div className="w-full translate-y-6 overflow-hidden md:translate-y-10">
					<div className="footer-marquee">
						<div className="flex w-max items-center gap-[10vw] pr-[10vw]">
							<h1 className="font-display pointer-events-none bg-linear-to-b from-gray-500 via-gray-700 to-gray-950 bg-clip-text text-[20vw] leading-[0.75] tracking-normal text-transparent select-none whitespace-nowrap">
								EATORY
							</h1>
							<h1 className="font-display pointer-events-none bg-linear-to-b from-gray-500 via-gray-700 to-gray-950 bg-clip-text text-[20vw] leading-[0.75] tracking-normal text-transparent select-none whitespace-nowrap">
								EATORY
							</h1>
						</div>
					</div>
				</div>
			</footer>
		</>
	);
}
