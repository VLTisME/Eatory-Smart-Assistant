import { RiStarFill } from "react-icons/ri";
import type { FoodType } from "../../../data/foodData";
import { useNavigate } from "react-router-dom";
import { UBND_COORDS } from "../../../data/ubndCoords";
interface Props {
  items: FoodType[];
}

export default function FoodGrid({ items }: Props) {
 const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
      {items.map((item) => (
        <div
          key={item.place_id}
          className="flex flex-col bg-white rounded-[32px] overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
          {/* Ảnh */}
          <div className="h-48 w-full overflow-hidden rounded-[24px] cursor-pointer"
            onClick={() => {
  const coords = item.city
    ? UBND_COORDS[item.city]
    : null;

  if (item.isMock && coords) {
    navigate(
      `/MainPage?lat=${coords.lat}&lng=${coords.lng}&province=${encodeURIComponent(
        item.city || ""
      )}`
    );
  } else {
    navigate(
      `/MainPage?lat=${item.lat}&lng=${item.lng}&province=${encodeURIComponent(
        item.city || ""
      )}`
    );
  }
}}
>
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Nội dung */}
          <div className="p-8 pb-10 flex justify-between items-start gap-4">
            
            {/* Text */}
            <div className="flex-grow">
              <h4 className="text-lg font-semibold text-gray-900 ">
                {item.name}
              </h4>

              <p className="text-gray-600">
                {item.address}
              </p>
            </div>

            {/* Rating */}
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
              <RiStarFill className="text-sm" />
              <span>{item.avg_rating}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}