import { RiStarFill } from "react-icons/ri";
import type { FoodType } from "../../../data/foodData";
import { useNavigate } from "react-router-dom";
import { UBND_COORDS } from "../../../data/ubndCoords";

interface Props {
  items: FoodType[];
}

export default function FoodGrid({ items }: Props) {
  const navigate = useNavigate();

  const handleNavigate = (item: FoodType) => {
    const coords = item.city ? UBND_COORDS[item.city] : null;
    if (item.isMock && coords) {
      navigate(
        `/MainPage?lat=${coords.lat}&lng=${coords.lng}&province=${encodeURIComponent(item.city || "")}`
      );
    } else {
      navigate(
        `/MainPage?lat=${item.lat}&lng=${item.lng}&province=${encodeURIComponent(item.city || "")}`
      );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
      {items.map((item) => (
        <div
          key={item.place_id}
          className="relative h-80 rounded-[32px] overflow-hidden group cursor-pointer"
          onClick={() => handleNavigate(item)}
        >
          {/* Full image background */}
          <img
            src={item.image}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content overlay — bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-2">
            {/* Rating pill badge — glassmorphism */}
            <div className="self-start inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium">
              <RiStarFill className="text-amber-400 text-xs" />
              <span>{item.avg_rating}</span>
            </div>

            {/* Food name */}
            <h4 className="text-white text-xl font-bold leading-tight line-clamp-1">
              {item.name}
            </h4>

            {/* Address */}
            <p className="text-white/70 text-sm line-clamp-1">
              {item.address}
            </p>

            {/* Total reviews */}
            <p className="text-white/60 text-xs">
              {item.total_reviews ?? 0} reviews
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}