import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const items = [
  {
    title: "Smart AI Chatbot",
    desc: "Hỏi đáp và tìm kiếm quán ăn yêu thích ngay lập tức thông qua trợ lý ảo hỗ trợ 24/7.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Personalized Itinerary",
    desc: "Tự động tạo lộ trình khám phá các món ngon theo đúng khẩu vị và thời gian của bạn.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "Real-time Reviews",
    desc: "Cập nhật những nhận xét và phân tích cảm xúc mới nhất về chất lượng món ăn tại điểm đến.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop",
  },
];

export default function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section id="tour" className="max-w-7xl mx-auto px-6 lg:px-8 py-20" ref={sectionRef}>
      {/* Centered text header — appears first */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Smart Dining Made Simple!
        </motion.h2>
        <motion.p
          className="text-gray-500 mt-4 text-lg font-light leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Effortless Food Planning for Your Next Adventure with AI Technology
        </motion.p>
      </div>

      {/* Asymmetric card layout — images appear one by one left to right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {items.map((item, idx) => {
          // Left and right cards are shorter, middle card is tallest
          const isCenter = idx === 1;
          const heightClass = isCenter ? "h-[480px]" : "h-[380px]";
          const marginClass = idx === 0 ? "md:mt-12" : idx === 2 ? "md:mb-12" : "";

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.35 + idx * 0.15,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`relative ${heightClass} ${marginClass} rounded-[32px] overflow-hidden group transition-all duration-500`}
            >
              {/* Background image */}
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h4 className="text-white text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-white/70 text-sm font-light leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
