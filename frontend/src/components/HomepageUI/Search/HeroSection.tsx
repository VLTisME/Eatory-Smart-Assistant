import ScrollSelect from "../Scroll/ScrollSelect";

interface HeroSectionProps {
  province: string;
  setProvince: (val: string) => void;
  onSearch: () => void;     
   hasError: boolean;  
   isLoading?: boolean        
}

export default function HeroSection({ province, setProvince, onSearch,isLoading }: HeroSectionProps) {
  return (
    <div
      className="h-[85vh] bg-cover bg-center relative flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://images.baodantoc.vn/uploads/2023/Th%C3%A1ng%202/Ng%C3%A0y_13/Nga/007-rs-8636.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md px-4">
        <h1 className="text-white text-3xl font-bold text-center">
          Du ngoạn khắp nơi, ẩm thực tuyệt vời
        </h1>

        <div className="flex w-full gap-2">
          <ScrollSelect value={province} onSelect={setProvince} />

          <button
            onClick={onSearch}
            disabled={isLoading}
           className={`px-6 py-3 rounded-xl text-white font-bold transition active:scale-95 ${
              isLoading 
                ? "bg-gray-400" 
                : "bg-[#6453df] hover:bg-[#3836bc]"
            }`}
          >
          Search
          </button>
        </div>
      </div>
    </div>
  );
}