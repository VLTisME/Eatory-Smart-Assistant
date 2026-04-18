//foodData.ts

export const DATABASE: Record<string, FoodType[]> = {
  "Hà Nội": [
    {
      title: "Phở Hà Nội",
      location: "TP. Hà Nội",
      rating: 4.8,
      image: "https://picsum.photos/seed/pho/600/400",
    },
    {
      title: "Bún Chả",
      location: "TP. Hà Nội",
      rating: 4.7,
      image: "https://picsum.photos/seed/buncha/600/400",
    },
    {
      title: "Bún Thang",
      location: "TP. Hà Nội",
      rating: 4.6,
      image: "https://picsum.photos/seed/bunthang/600/400",
    },
    {
      title: "Cốm Vòng",
      location: "TP. Hà Nội",
      rating: 4.5,
      image: "https://picsum.photos/seed/com/600/400",
    },
  ],

  "Đà Nẵng": [
    {
      title: "Mì Quảng",
      location: "Đà Nẵng",
      rating: 4.7,
      image: "https://picsum.photos/seed/miquang/600/400",
    },
    {
      title: "Bánh Tráng Cuốn Thịt Heo",
      location: "Đà Nẵng",
      rating: 4.6,
      image: "https://picsum.photos/seed/banhtrang/600/400",
    },
  ],

  "TP Hồ Chí Minh": [
    {
      title: "Cơm Tấm",
      location: "TP. Hồ Chí Minh",
      rating: 4.8,
      image: "https://picsum.photos/seed/comtam/600/400",
    },
    {
      title: "Hủ Tiếu Nam Vang",
      location: "TP. Hồ Chí Minh",
      rating: 4.7,
      image: "https://picsum.photos/seed/hutieu/600/400",
    },
  ],
};
export interface FoodType {
  title: string;
  location: string;
  rating: number;
  image: string;
}
