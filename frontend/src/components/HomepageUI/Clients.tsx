import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { RiStarFill } from "react-icons/ri";
import { clients } from '../../data/travelData';

export default function Clients() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center text-gray-900">
        Loved By Travelers
      </h2>

  <Swiper
  spaceBetween={20}
  breakpoints={{
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  }}
  className="mt-12"
>
{clients.map((c, i) => (
  <SwiperSlide key={i}>
    <div className="group bg-gray-100 rounded-2xl p-1 transition duration-300 hover:bg-[#2887ff]">
      
      {/* 1. User info - Đưa lên đầu */}
      <div className="flex items-center gap-4 p-4">
        <img
          src={c.image}
          alt={c.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white"
        />
        <div>
          <h4 className="font-semibold text-gray-900 transition duration-300 group-hover:text-white">
            {c.name}
          </h4>
          <p className="text-sm text-gray-500 transition duration-300 group-hover:text-gray-100">
            {c.role}
          </p>
        </div>
      </div>

      {/* 2. Khối trắng bên dưới chứa Rating và Nội dung */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        
        {/* Rating */}
        <div className="flex gap-1 text-[#2887ff] mb-4">
          <RiStarFill />
          <RiStarFill />
          <RiStarFill />
          <RiStarFill />
          <RiStarFill />
        </div>

        {/* Nội dung đánh giá */}
        <p className="text-gray-700 leading-7 min-h-[120px]">
          "{c.text}"
        </p>
      </div>
    </div>
  </SwiperSlide>
))}
      </Swiper>
    </section>
  );
}