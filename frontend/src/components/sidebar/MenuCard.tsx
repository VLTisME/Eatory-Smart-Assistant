import { useState } from "react";
import {
	Store,
	Phone,
	MapPin,
	ChevronDown,
	ChevronUp,
	Utensils,
} from "lucide-react";
import type {
	MenuResponse,
	MenuCategory,
	MenuItem,
} from "../../types/menuTranslation";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Format VND price: 20000 → "20.000₫" */
function formatVND(value: number | null | undefined): string {
	if (value == null) return "—";
	return value.toLocaleString("vi-VN") + "₫";
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function PriceTag({ item }: { item: MenuItem }) {
	if (item.priceType === "market_price") {
		return <span className="menu-price-market">Giá thị trường</span>;
	}
	if (item.priceType === "variable" && item.priceOptions?.length) {
		return (
			<div className="flex flex-wrap gap-1">
				{item.priceOptions.map((opt) => (
					<span key={opt.label} className="menu-price-option">
						{opt.label}: {formatVND(opt.price)}
					</span>
				))}
			</div>
		);
	}
	return (
		<span className="menu-price-fixed">{formatVND(item.basePrice)}</span>
	);
}

function MenuItemRow({ item, index }: { item: MenuItem; index: number }) {
	const hasTranslation = Boolean(item.translation?.trim());
	const primaryName = hasTranslation ? item.translation! : item.name;
	const secondaryName =
		hasTranslation && item.translation !== item.name ? item.name : null;

	return (
		<div
			className="menu-item-row group"
			style={{ animationDelay: `${index * 50}ms` }}
		>
			{/* Left — name + translation */}
			<div className="flex-1 min-w-0">
				<p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">
					{primaryName}
				</p>
				{secondaryName && (
					<p className="text-[11px] text-gray-400 mt-0.5 truncate italic">
						{secondaryName}
					</p>
				)}
				{item.description && (
					<p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
						{item.description}
					</p>
				)}
				{/* Tags */}
				{item.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-1">
						{item.tags.map((tag) => (
							<span key={tag} className="menu-tag">
								{tag}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Right — price */}
			<div className="shrink-0 ml-3 text-right">
				<PriceTag item={item} />
			</div>
		</div>
	);
}

function CategorySection({
	category,
	defaultOpen = true,
}: {
	category: MenuCategory;
	defaultOpen?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const hasTranslation = Boolean(category.translation?.trim());
	const primaryTitle = hasTranslation
		? category.translation!
		: category.title;
	const secondaryTitle =
		hasTranslation && category.translation !== category.title
			? category.title
			: null;

	return (
		<div className="menu-category">
			{/* Category header */}
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				className="w-full flex items-center justify-between px-3 py-2
					rounded-xl hover:bg-gray-50/80 transition-colors duration-200 cursor-pointer"
			>
				<div className="flex items-center gap-2 min-w-0">
					<div
						className="w-6 h-6 rounded-lg bg-linear-to-br from-orange-400 to-rose-400
						flex items-center justify-center shrink-0"
					>
						<Utensils
							size={12}
							className="text-white"
							strokeWidth={2.5}
						/>
					</div>
					<div className="text-left min-w-0">
						<h4 className="text-[13px] font-bold text-gray-800 truncate">
							{primaryTitle}
						</h4>
						{secondaryTitle && (
							<p className="text-[10px] text-gray-400 -mt-0.5">
								{secondaryTitle}
							</p>
						)}
					</div>
					<span className="text-[10px] text-gray-300 font-medium ml-1">
						{category.items.length}
					</span>
				</div>
				{isOpen ? (
					<ChevronUp size={14} className="text-gray-400 shrink-0" />
				) : (
					<ChevronDown size={14} className="text-gray-400 shrink-0" />
				)}
			</button>

			{/* Items */}
			{isOpen && (
				<div className="mt-1 space-y-0.5 px-1">
					{category.items.map((item, i) => (
						<MenuItemRow key={item.id} item={item} index={i} />
					))}
				</div>
			)}
		</div>
	);
}

/* ─── Main MenuCard ──────────────────────────────────────────────────────── */

interface MenuCardProps {
	data: MenuResponse;
}

export default function MenuCard({ data }: MenuCardProps) {
	const { restaurantInfo, categories } = data;
	const hasInfo =
		(restaurantInfo.name && restaurantInfo.name !== "Unknown") ||
		restaurantInfo.phoneNumber ||
		restaurantInfo.address;

	return (
		<div className="menu-card w-full animate-fade-in-up">
			{/* ── Header ── */}
			<div className="menu-card-header">
				<div className="flex items-center gap-2 mb-1">
					<div
						className="w-7 h-7 rounded-xl bg-linear-to-br from-orange-400 to-rose-500
						flex items-center justify-center shadow-sm"
					>
						<Store
							size={14}
							className="text-white"
							strokeWidth={2.2}
						/>
					</div>
					<h3 className="text-sm font-bold text-gray-800">
						{restaurantInfo.name !== "Unknown"
							? restaurantInfo.name
							: "Menu đã dịch"}
					</h3>
				</div>

				{hasInfo && (
					<div className="flex flex-wrap gap-x-3 gap-y-0.5 ml-9">
						{restaurantInfo.phoneNumber && (
							<span className="menu-info-chip">
								<Phone size={10} /> {restaurantInfo.phoneNumber}
							</span>
						)}
						{restaurantInfo.address && (
							<span className="menu-info-chip">
								<MapPin size={10} /> {restaurantInfo.address}
							</span>
						)}
					</div>
				)}
			</div>

			{/* ── Divider ── */}
			<div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent mx-2" />

			{/* ── Categories ── */}
			<div className="menu-card-body space-y-2">
				{categories.map((cat, i) => (
					<CategorySection
						key={cat.id}
						category={cat}
						defaultOpen={i === 0}
					/>
				))}
			</div>

			{/* ── Footer ── */}
			<div className="px-3 pb-2 pt-1">
				<p className="text-[9px] text-gray-300 text-center select-none">
					Được dịch tự động bởi AI · Giá có thể thay đổi
				</p>
			</div>
		</div>
	);
}
