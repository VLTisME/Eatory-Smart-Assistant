export interface FoodType {
  place_id: string;
  name?: string;
  address?: string;
  city?: string;
  avg_rating?: number;
  total_reviews?: number;
  image?: string; 

  lat: number;
  lng: number;

  isMock?: boolean;
}