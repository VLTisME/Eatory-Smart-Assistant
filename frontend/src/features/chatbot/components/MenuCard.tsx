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
} from "../../../types/menuTranslation";

function formatVND(value: number | null | undefined): string {
	if (value == null) return "—";
	return value.toLocaleString("vi-VN") + "₫";
}

function PriceTag({ item }: { item: MenuItem }) {
	if (item.priceType === "market_price") {
		return (
			<span className="text-[10px] font-semibold text-emerald-600 italic">
				Giá thị trường
			</span>
		);
	}
	if (item.priceType === "variable" && item.priceOptions?.length) {
		type PriceOption = NonNullable<MenuItem["priceOptions"]>[number];
		return (
			<div className="flex flex-wrap gap-1">
				{item.priceOptions.map((opt: PriceOption) => (
					<span
						key={opt.label}
						className="text-[10px] font-semibold text-orange-600 bg-orange-50 py-px px-1.5 rounded-md border border-orange-400/12"
					>
						{opt.label}: {formatVND(opt.price)}
					</span>
				))}
			</div>
		);
	}
	return (
		<span className="text-[12px] font-bold text-orange-600 whitespace-nowrap bg-[linear-gradient(135deg,#fff7ed,#fff1e6)] py-0.5 px-2 rounded-lg border border-orange-400/15">
			{formatVND(item.basePrice)}
		</span>
	);
}

function MenuItemRow({ item, index }: { item: MenuItem; index: number }) {
	const hasTranslation = Boolean(item.translation?.trim());
	const primaryName = hasTranslation ? item.translation! : item.name;
	const secondaryName =
		hasTranslation && item.translation !== item.name ? item.name : null;

	return (
		<div
			className="flex items-start justify-between py-2 px-2.5 rounded-[0.625rem] transition-colors duration-200 hover:bg-orange-500/4 animate-[menu-item-enter_0.3s_ease-out_both] group"
			style={{ animationDelay: `${index * 50}ms` }}
		>
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
				{item.tags.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-1">
						{item.tags.map((tag: string) => (
							<span
								key={tag}
								className="text-[9px] font-semibold text-indigo-500 bg-indigo-50 py-px px-1.5 rounded-md uppercase tracking-[0.02em]"
							>
								{tag}
							</span>
						))}
					</div>
				)}
			</div>
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
		<div className="rounded-xl overflow-hidden">
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
			{isOpen && (
				<div className="mt-1 space-y-0.5 px-1">
					{category.items.map((item: MenuItem, i: number) => (
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
		<div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(249,250,251,0.9)_100%)] border border-gray-200/60 rounded-[1.25rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm max-w-full w-full animate-fade-in-up">
			{/* ── Header ── */}
			<div className="px-3.5 pt-3 pb-2.5 bg-[linear-gradient(135deg,rgba(255,237,213,0.3)_0%,rgba(254,205,211,0.2)_100%)]">
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
							<span className="inline-flex items-center gap-0.75 text-[10px] text-gray-400 leading-none">
								<Phone size={10} /> {restaurantInfo.phoneNumber}
							</span>
						)}
						{restaurantInfo.address && (
							<span className="inline-flex items-center gap-0.75 text-[10px] text-gray-400 leading-none">
								<MapPin size={10} /> {restaurantInfo.address}
							</span>
						)}
					</div>
				)}
			</div>
			<div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent mx-2" />

			{/* ── Categories ── */}
			<div className="p-2 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 space-y-2">
				{categories.map((cat: MenuCategory, i: number) => (
					<CategorySection
						key={cat.id}
						category={cat}
						defaultOpen={i === 0}
					/>
				))}
			</div>
			<div className="px-3 pb-2 pt-1">
				<p className="text-[9px] text-gray-300 text-center select-none">
					Được dịch tự động bởi AI · Giá có thể thay đổi
				</p>
			</div>
		</div>
	);
}
