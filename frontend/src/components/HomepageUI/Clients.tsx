import { useState } from "react";
import { clients } from "../../data/travelData";
import { RiArrowLeftLine, RiArrowRightLine, RiDoubleQuotesL } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const CARD_COLORS = [
  { bg: "bg-purple-50", border: "border-purple-200", accent: "text-purple-200", ring: "ring-purple-200" },
  { bg: "bg-sky-50", border: "border-sky-200", accent: "text-sky-200", ring: "ring-sky-200" },
  { bg: "bg-orange-50", border: "border-orange-200", accent: "text-orange-200", ring: "ring-orange-200" },
  { bg: "bg-emerald-50", border: "border-emerald-200", accent: "text-emerald-200", ring: "ring-emerald-200" },
];

export default function Clients() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + clients.length) % clients.length);
  };
  const next = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % clients.length);
  };

  const getIndex = (offset: number) => (current + offset + clients.length) % clients.length;

  const prevIdx = getIndex(-1);
  const nextIdx = getIndex(1);

  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Title area */}
      <div className="flex flex-col items-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center">
          What our guests say
        </h2>
      </div>

      {/* Slider area — 3 column layout */}
      <div className="relative max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 md:gap-8 items-center" style={{ minHeight: "400px" }}>
          
          {/* LEFT column: arrow + prev avatar */}
          <div className="hidden md:flex flex-col items-center justify-center gap-6">
            {/* Left arrow */}
            <button
              onClick={prev}
              className="w-11 h-11 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all hover:scale-110 shadow-lg"
            >
              <RiArrowLeftLine className="text-base" />
            </button>

            {/* Previous avatar only */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`prev-${prevIdx}`}
                initial={{ opacity: 0, scale: 0.8, x: direction >= 0 ? -30 : 30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: direction >= 0 ? 30 : -30 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <AvatarBubble index={prevIdx} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER column: main card */}
          <div className="relative z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={`main-${current}`}
                initial={{ opacity: 0, x: direction >= 0 ? 80 : -80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction >= 0 ? -80 : 80, scale: 0.95 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <MainCard index={current} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT column: next avatar + arrow */}
          <div className="hidden md:flex flex-col items-center justify-center gap-6">
            {/* Next avatar only */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`next-${nextIdx}`}
                initial={{ opacity: 0, scale: 0.8, x: direction >= 0 ? 30 : -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: direction >= 0 ? -30 : 30 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <AvatarBubble index={nextIdx} />
              </motion.div>
            </AnimatePresence>

            {/* Right arrow */}
            <button
              onClick={next}
              className="w-11 h-11 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all hover:scale-110 shadow-lg"
            >
              <RiArrowRightLine className="text-base" />
            </button>
          </div>
        </div>

        {/* Mobile nav buttons */}
        <div className="flex md:hidden justify-center gap-4 mt-6">
          <button
            onClick={prev}
            className="w-11 h-11 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all shadow-lg"
          >
            <RiArrowLeftLine className="text-base" />
          </button>
          <button
            onClick={next}
            className="w-11 h-11 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all shadow-lg"
          >
            <RiArrowRightLine className="text-base" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Card ──────────────────────────────────────────── */
function MainCard({ index }: { index: number }) {
  const c = clients[index];
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className={`${color.bg} ${color.border} border-2 rounded-3xl overflow-hidden flex flex-col md:flex-row transition-all duration-500`}
    >
      {/* Avatar — left 1/3 with rounded corners and spacing */}
      <div className="md:w-1/3 w-full p-3">
        <div className="h-48 md:h-full rounded-2xl overflow-hidden">
          <img
            src={c.image}
            alt={c.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content — right 2/3 */}
      <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between relative">
        {/* Quote icon */}
        <RiDoubleQuotesL className={`text-6xl ${color.accent} mb-2 opacity-60`} />

        {/* Review text */}
        <p className="text-gray-700 text-sm md:text-base leading-relaxed font-light">
          {c.text}
        </p>

        {/* User info — bottom right */}
        <div className="mt-6 self-end text-right">
          <h4 className="font-semibold text-gray-900 text-base">{c.name}</h4>
          <p className="text-gray-500 text-sm font-light">{c.role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Avatar Bubble (side card — avatar only) ──────────────────────────────── */
function AvatarBubble({ index }: { index: number }) {
  const c = clients[index];
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-20 h-20 rounded-full overflow-hidden ring-3 ${color.ring} shadow-lg`}>
        <img
          src={c.image}
          alt={c.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center">
        <h4 className="font-medium text-gray-900 text-xs">{c.name}</h4>
        <p className="text-gray-500 text-[10px]">{c.role}</p>
      </div>
    </div>
  );
}