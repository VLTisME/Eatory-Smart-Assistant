import React from "react";
import { Languages, Image, Mic } from "lucide-react";
import { getOppositeLanguage, useLanguage } from "../../../hooks/useLanguage";

// ─── Mô tả một tính năng trong Bento Grid ────────────────────────────────────
interface BentoFeature {
	id: string;
	icon: React.ComponentType<{
		size?: number;
		strokeWidth?: number;
		className?: string;
	}>;
	label: string;
	displayLabel: { vi: string; en: string };
	description: { vi: string; en: string };
	color: string;
	hoverBg: string;
	activeBg?: string;
}

const features: BentoFeature[] = [
	{
		id: "Translate Menu",
		icon: Languages,
		label: "Translate Menu",
		displayLabel: { vi: "Dịch menu", en: "Translate Menu" },
		description: {
			vi: "Dịch menu sang tiếng Anh",
			en: "Translate menus into Vietnamese",
		},
		color: "text-sky-500",
		hoverBg: "group-hover:bg-sky-50",
	},
	{
		id: "Search Image",
		icon: Image,
		label: "Search Image",
		displayLabel: { vi: "Tìm bằng ảnh", en: "Search Image" },
		description: {
			vi: "Tìm quán ăn qua hình ảnh",
			en: "Find places from an image",
		},
		color: "text-amber-500",
		hoverBg: "group-hover:bg-amber-50",
	},
	{
		id: "Voice Assistant",
		icon: Mic,
		label: "Voice Assistant",
		displayLabel: { vi: "Trợ lý giọng nói", en: "Voice Assistant" },
		description: {
			vi: "Trợ lý giọng nói thông minh",
			en: "Smart voice assistant",
		},
		color: "text-rose-500",
		hoverBg: "group-hover:bg-rose-50",
		activeBg: "bg-rose-50",
	},
];

interface BentoFeaturesProps {
	onFeatureClick?: (label: string) => void;
	isListening?: boolean;
}

export default function BentoFeatures({
	onFeatureClick,
	isListening = false,
}: BentoFeaturesProps) {
	const { lang } = useLanguage();
	const menuTargetLabel =
		getOppositeLanguage(lang) === "vi" ? "Vietnamese" : "English";
	const menuDescription =
		lang === "vi"
			? `Dịch menu sang tiếng ${menuTargetLabel === "English" ? "Anh" : "Việt"}`
			: `Translate menus into ${menuTargetLabel}`;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
			{features.map((feature, index) => {
				const isMic = feature.id === "Voice Assistant";
				const isActive = isMic && isListening;

				return (
					<button
						key={feature.label}
						onClick={() => onFeatureClick?.(feature.label)}
						className={`group relative border rounded-2xl p-4
							text-left backdrop-blur-sm cursor-pointer
							hover:-translate-y-1 hover:shadow-lg
							transition-all duration-300 ease-out
							animate-fade-in-up
							${
								isActive
									? "bg-rose-50 border-rose-200 shadow-md shadow-rose-100"
									: "bg-white/60 border-white/40 hover:bg-white/90"
							}`}
						style={{ animationDelay: `${index * 80}ms` }}
					>
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
								bg-white/80 shadow-sm border border-gray-100/60
								transition-all duration-300
								${isActive ? "scale-110 mic-animation" : "group-hover:scale-110"}
								${feature.hoverBg}`}
						>
							<feature.icon
								size={20}
								strokeWidth={1.8}
								className={`${feature.color} transition-colors duration-300`}
							/>
						</div>
						<h3 className="text-sm font-semibold text-gray-800 mb-1">
							{feature.displayLabel[lang]}
						</h3>
						<p className="text-xs text-gray-500 leading-relaxed">
							{isActive
								? lang === "vi"
									? "Đang lắng nghe... Bấm lại để dừng"
									: "Listening... Tap again to stop"
								: feature.id === "Translate Menu"
									? menuDescription
									: feature.description[lang]}
						</p>
						<div
							className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full transition-opacity duration-300
								${isActive ? "opacity-100 bg-rose-400" : "opacity-0 bg-gray-300 group-hover:opacity-100"}`}
						/>
						{isActive && (
							<span className="absolute top-3 right-3 flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
