/**
 * TypeScript interfaces khớp với backend schemas.py
 * (MenuResponse / MenuCategory / MenuItem / …)
 */

export interface PriceOption {
	label: string;
	price: number;
}

export interface ModifierOption {
	name: string;
	extraPrice: number;
}

export interface ModifierGroup {
	title: string;
	isRequired: boolean;
	options: ModifierOption[];
}

export type PriceType = "fixed" | "variable" | "market_price";

export interface MenuItem {
	id: string;
	name: string;
	translation: string | null;
	description: string | null;
	priceType: PriceType;
	basePrice: number | null;
	priceText: string | null;
	priceOptions: PriceOption[];
	tags: string[];
	modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
	id: string;
	title: string;
	translation: string | null;
	items: MenuItem[];
}

export interface RestaurantInfo {
	id: string;
	name: string;
	phoneNumber: string | null;
	address: string;
}

export interface MenuResponse {
	restaurantInfo: RestaurantInfo;
	categories: MenuCategory[];
}
