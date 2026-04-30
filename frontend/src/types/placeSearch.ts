export interface PlaceSearchItem {
	place_id: string;
	score: number;
	top_image: string;
	name: string;
	address: string;
}

export interface PlaceSearchResponse {
	results: PlaceSearchItem[];
}
