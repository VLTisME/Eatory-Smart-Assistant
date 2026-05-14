import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { UBND_COORDS } from "../../../data/ubndCoords";
import UserMenu from "./UserMenu";
import { useGeolocation } from "../../../hooks/useGeolocation";
import Logo from "../../../assets/logo.svg";
import { motion } from "framer-motion";

interface User {
	name: string;
	avatar: string;
}
interface NavbarProps {
	currentProvince?: string;
	currentPath?: string;
}

/* ─── Section definitions for scroll-spy ─── */
const SECTIONS = [
	{ id: "hero", label: "Home" },
	{ id: "featured", label: "Featured" },
	{ id: "why-us", label: "About" },
	{ id: "benefits", label: "Benefits" },
	{ id: "popular", label: "Menu" },
	{ id: "promo", label: "Explore" },
];

export default function Navbar({ currentProvince, currentPath }: NavbarProps) {
	const location = useLocation();
	const [open, setOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const { location: geoLoc, province: detectedProvince } = useGeolocation();

	const gpsLat = geoLoc?.lat;
	const gpsLng = geoLoc?.lng;
	const isMapPage = currentPath === "/MainPage";
	const isHomePage = location.pathname === "/";
	const provinceToShare = currentProvince || detectedProvince;
	const coords = provinceToShare ? UBND_COORDS[provinceToShare] : null;
	const finalLat = coords?.lat || gpsLat;
	const finalLng = coords?.lng || gpsLng;

	const [user, setUser] = useState<User | null>(() => {
		const stored = localStorage.getItem("user");
		return stored ? JSON.parse(stored) : null;
	});

	/* ─── Scroll-spy: track active section ─── */
	const [activeSection, setActiveSection] = useState("hero");
	const [scrolled, setScrolled] = useState(false);

	const handleScroll = useCallback(() => {
		setScrolled(window.scrollY > 60);

		if (!isHomePage) return;

		const scrollY = window.scrollY + window.innerHeight / 3;
		let current = "hero";

		for (const section of SECTIONS) {
			const el = document.getElementById(section.id);
			if (el && el.offsetTop <= scrollY) {
				current = section.id;
			}
		}
		setActiveSection(current);
	}, [isHomePage]);

	useEffect(() => {
		// schedule initial call to avoid synchronous setState during render
		const raf = requestAnimationFrame(handleScroll);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [handleScroll]);

	useEffect(() => {
		const checkUser = () => {
			const stored = localStorage.getItem("user");
			setUser(stored ? JSON.parse(stored) : null);
		};
		window.addEventListener("storage", checkUser);
		window.addEventListener("userChange", checkUser);
		return () => {
			window.removeEventListener("storage", checkUser);
			window.removeEventListener("userChange", checkUser);
		};
	}, []);

	/* ─── Smooth scroll to section ─── */
	const scrollToSection = (id: string) => {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<>
			{/* Hover sensor for map page */}
			{isMapPage && (
				<div
					className="fixed top-0 left-0 z-60 h-4 w-full"
					onMouseEnter={() => setIsHovered(true)}
				/>
			)}

			<nav
				onMouseLeave={() => setIsHovered(false)}
				className={`${
					isMapPage
						? `fixed top-0 left-0 z-50 w-full transition-transform duration-300 ${
								isHovered || open
									? "translate-y-0"
									: "-translate-y-full"
							}`
						: scrolled
							? "fixed top-0 left-0 z-50 w-full"
							: "relative z-50 w-full"
				} flex items-center justify-between px-6 py-4 transition-all duration-300 md:px-12 ${
					scrolled && !isMapPage
						? "border-b border-white/10 bg-gray-950/70 shadow-lg shadow-black/10 backdrop-blur-xl"
						: ""
				}`}
			>
				{/* Logo */}
				<div className="items-center gap-2 text-white">
					<Link
						to="/"
						onClick={() => {
							localStorage.removeItem("province");
							setOpen(false);
						}}
						className="flex items-center gap-2 text-xl font-bold tracking-tight"
						aria-label="Go to homepage"
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
				</div>

				{/* Center — Section nav pills (only on homepage) */}
				{isHomePage && (
					<div className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1 shadow-sm backdrop-blur-md lg:flex">
						{SECTIONS.map((section) => (
							<button
								key={section.id}
								onClick={() => scrollToSection(section.id)}
								className={`relative cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
									activeSection === section.id
										? "text-gray-900"
										: "text-white/70 hover:text-white"
								}`}
							>
								{/* Active pill background */}
								{activeSection === section.id && (
									<motion.div
										layoutId="activeNavPill"
										className="absolute inset-0 rounded-full bg-white shadow-sm"
										transition={{
											type: "spring",
											stiffness: 380,
											damping: 30,
										}}
									/>
								)}
								<span className="relative z-10">
									{section.label}
								</span>
							</button>
						))}

						{/* Auth links */}
						{user ? (
							<UserMenu
								user={user}
								onLogout={() => setUser(null)}
							/>
						) : (
							<>
								<Link
									to="/AuthPage?mode=signin"
									className="rounded-full px-4 py-1.5 text-sm font-medium text-white/70 transition hover:text-white"
									onClick={() => setOpen(false)}
								>
									Sign In
								</Link>
								<Link
									to="/AuthPage?mode=signup"
									className="rounded-full px-4 py-1.5 text-sm font-medium text-white/70 transition hover:text-white"
									onClick={() => setOpen(false)}
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				)}

				{/* Non-homepage center nav (map page etc.) */}
				{!isHomePage && (
					<div className="hidden items-center gap-3 rounded-full border border-white/20 bg-white/20 p-1.5 shadow-sm backdrop-blur-md lg:flex">
						<Link
							to="/"
							className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900"
							onClick={() => setOpen(false)}
						>
							Home
						</Link>
						{user ? (
							<UserMenu
								user={user}
								onLogout={() => setUser(null)}
							/>
						) : (
							<>
								<Link
									to="/AuthPage?mode=signin"
									className="rounded-full px-6 py-2 text-sm font-medium text-white transition hover:bg-white/10"
									onClick={() => setOpen(false)}
								>
									Sign In
								</Link>
								<Link
									to="/AuthPage?mode=signup"
									className="rounded-full px-6 py-2 text-sm font-medium text-white transition hover:bg-white/10"
									onClick={() => setOpen(false)}
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				)}

				{/* Right — Plan Your Trip */}
				<Link
					to={
						finalLat && finalLng
							? `/MainPage?lat=${finalLat}&lng=${finalLng}&province=${encodeURIComponent(provinceToShare!)}`
							: "/MainPage"
					}
					className="transition-colors duration-300 ease-in-out"
					onClick={() => setOpen(false)}
				>
					<button className="flex cursor-pointer items-center gap-3 rounded-full bg-white p-1.5 pr-2 pl-5 shadow-lg transition-all duration-500 hover:-translate-y-0.5 hover:bg-blue-50">
						<span className="text-sm font-semibold text-gray-900">
							Plan Your Trip
						</span>
						<div className="rounded-full bg-blue-500 p-2 text-white">
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
									d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
								/>
							</svg>
						</div>
					</button>
				</Link>
			</nav>
		</>
	);
}
