import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const data = [
  {
    title: "Foodie Hotspots",
    desc: "Tìm kiếm những quán ăn ẩn mình hay các nhà hàng nổi tiếng nhất được đề xuất dựa trên sở thích cá nhân.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Authentic Delicacies",
    desc: "Khám phá những món ăn đặc sản tinh túy, mang đậm linh hồn và câu chuyện của từng vùng đất bạn đặt chân đến.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Cultural Stories",
    desc: "Tìm hiểu về lịch sử và cách chế biến đằng sau mỗi món ăn thông qua những trải nghiệm cùng người bản xứ.",
    image: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=800&auto=format&fit=crop",
  },
];

export default function Discover() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20" ref={sectionRef}>
      {/* Centered text header — appears first */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Savor The Nation's Best Flavors
        </motion.h2>
        <motion.p
          className="text-gray-500 mt-4 text-lg font-light leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Explore authentic local tastes with our intelligent culinary guide
        </motion.p>
      </div>

      {/* Asymmetric card layout — images appear one by one left to right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {data.map((d, idx) => {
          const isCenter = idx === 1;
          const heightClass = isCenter ? "h-[480px]" : "h-[380px]";
          const marginClass = idx === 0 ? "md:mb-12" : idx === 2 ? "md:mt-12" : "";

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.35 + idx * 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`relative ${heightClass} ${marginClass} rounded-[32px] overflow-hidden group transition-all duration-500`}
            >
              {/* Background image */}
              <img
                src={d.image}
                alt={d.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h4 className="text-white text-xl font-bold mb-2">{d.title}</h4>
                <p className="text-white/70 text-sm font-light leading-relaxed">{d.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
