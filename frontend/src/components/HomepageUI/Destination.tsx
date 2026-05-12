import { useEffect } from "react";
import { RiStarFill } from "react-icons/ri";
import { useFoodSearch } from "../../hooks/useFoodSearch"; 
import { useNavigate } from "react-router-dom";
import { UBND_COORDS } from "../../data/ubndCoords";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Destination() {
  const { results, search, loading } = useFoodSearch();
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  useEffect(() => {
    search("Hồ Chí Minh"); // Hoặc tỉnh thành bạn muốn làm tiêu biểu
  }, []);

  const top3Items = results.slice(0, 3);

  const handleNavigate = (item: typeof top3Items[0]) => {
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
    <section id="about" className="max-w-7xl mx-auto px-6 lg:px-8 py-10" ref={sectionRef}>
      {/* Centered title + subtitle — appears first */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Top Foods
        </motion.h2>
        <motion.p
          className="text-gray-500 mt-4 text-lg font-light leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Discover the most beloved and highest-rated dishes across the nation,
          handpicked by locals and travelers alike
        </motion.p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 bg-gray-100 animate-pulse rounded-[32px]"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {top3Items.map((item, i) => (
            <motion.div
              key={item.place_id}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
              transition={{
                duration: 0.6,
                delay: 0.35 + i * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div
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
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}