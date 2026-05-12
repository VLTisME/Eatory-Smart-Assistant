import ScrollSelect from "../Scroll/ScrollSelect";
import SlideIn from "../Animation/SlideIn";
import { RiSearchLine } from "react-icons/ri";

interface HeroSectionProps {
  province: string;
  setProvince: (val: string) => void;
  onSearch: () => void;
  hasError: boolean;
  isLoading?: boolean;
}

export default function HeroSection({
  province,
  setProvince,
  onSearch,
  isLoading,
}: HeroSectionProps) {
  return (
    <section className="w-full bg-white pt-12 pb-4 px-4 md:px-8">
      {/* Hero Card Container */}
      <div
        className="relative w-full max-w-[1400px] mx-auto overflow-hidden"
        style={{ borderRadius: "40px", minHeight: "92vh" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop')",
          }}
        />

        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10" />

        <div className="absolute top-0 left-0 w-full h-[55%] z-10 flex flex-col items-center justify-center text-center px-6 pt-10">
          
          <div className="max-w-2xl mx-auto w-full">
            <SlideIn delay={0.2} direction="up">
              <h1 className="text-white text-xl md:text-5xl font-bold leading-tight tracking-tight">
                Du ngoạn khắp nơi,
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  ẩm thực tuyệt vời
                </span>
              </h1>
            </SlideIn>

            <SlideIn delay={0.4} direction="up">
              <p className="mt-6 text-white/80 text-base md:text-lg font-light leading-relaxed max-w-xl mx-auto">
                Khám phá những địa điểm du lịch hấp dẫn và thưởng thức đặc sản
                địa phương. Để trợ lý AI lên kế hoạch hoàn hảo cho bạn.
              </p>
            </SlideIn>

            {/* Search bar */}
            <SlideIn delay={0.6} direction="up" className="w-full mt-10">
              <div className="flex w-full max-w-xl mx-auto gap-0 bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl shadow-black/20">
                <div className="flex-1">
                  <ScrollSelect value={province} onSelect={setProvince} isLoading={isLoading} />
                </div>
                <button
                  onClick={onSearch}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 whitespace-nowrap ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  <RiSearchLine className="text-lg" />
                  Search
                </button>
              </div>
            </SlideIn>
          </div>

        </div>

      </div>
    </section>
  );
}