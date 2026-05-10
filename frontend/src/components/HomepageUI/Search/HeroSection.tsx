import ScrollSelect from "../Scroll/ScrollSelect";
import SlideIn from "../Animation/SlideIn";
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
    <div
      className="h-[85vh] bg-cover bg-center relative flex items-center"
      style={{
        backgroundImage:
          "url('https://images.baodantoc.vn/uploads/2023/Th%C3%A1ng%202/Ng%C3%A0y_13/Nga/007-rs-8636.jpg')",
      }}
    >
      {/* Lớp phủ mờ cho background chính */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Container Grid chia làm 2 cột trên màn hình MD trở lên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* CỘT BÊN TRÁI: TEXT & SEARCH */}
          <div className="flex flex-col items-start gap-6">
            <SlideIn delay={0.2}>
              <h1 className="text-white text-4xl md:text-4xl font-bold text-left leading-tight">
                Du ngoạn khắp nơi, <br />
                <span className="text-[#b59afa]">ẩm thực tuyệt vời</span>
              </h1>
            </SlideIn>

            <SlideIn delay={0.4}>
              <p className="text-gray-200 text-lg text-left">
                Khám phá những địa điểm du lịch hấp dẫn và thưởng thức đặc sản
                địa phương.
              </p>
            </SlideIn>

            <SlideIn delay={0.6} className="w-full">
              <div className="flex w-full max-w-xl gap-2">
                <ScrollSelect value={province} onSelect={setProvince} isLoading={isLoading} />
                <button
                  onClick={onSearch}
                  className={`px-8 py-3 rounded-xl text-white font-bold transition active:scale-95 whitespace-nowrap ${
                    isLoading
                      ? "bg-gray-400"
                      : "bg-[#6453df] hover:bg-[#3836bc]"
                  }`}
                >
                  Search
                </button>
              </div>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  );
}
