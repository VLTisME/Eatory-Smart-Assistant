import { useNavigate } from "react-router-dom";
import { RiMapPin2Fill, RiArrowRightLine } from "react-icons/ri";
import SlideIn from "./Animation/SlideIn";
import { UBND_COORDS } from "../../data/ubndCoords";
import { useGeolocation } from "../../hooks/useGeolocation";

interface MapPreviewProps {
  /** Province selected via the HeroSection search bar (from Home state) */
  selectedProvince?: string;
}

export default function MapPreview({ selectedProvince }: MapPreviewProps) {
  const navigate = useNavigate();
  const { province: detectedProvince, location } = useGeolocation();

  // Use the province the user picked in the navbar/hero, fall back to GPS-detected
  const province = selectedProvince || detectedProvince;

  const coords = province ? UBND_COORDS[province] : null;
  const lat = coords?.lat || location?.lat;
  const lng = coords?.lng || location?.lng;

  const buildMapUrl = () => {
    if (lat && lng && province) {
      return `/MainPage?lat=${lat}&lng=${lng}&province=${encodeURIComponent(province)}`;
    }
    if (lat && lng) {
      return `/MainPage?lat=${lat}&lng=${lng}`;
    }
    return "/MainPage";
  };

  const handleGoToMap = () => {
    navigate(buildMapUrl());
  };

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* ─── Left Column: Text Content ─── */}
        <div className="flex flex-col gap-6">
          <SlideIn delay={0.25} direction="left">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Explore Culinary
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Destinations
              </span>
            </h2>
          </SlideIn>

          <SlideIn delay={0.35} direction="left">
            <p className="text-gray-500 text-base md:text-lg font-light leading-relaxed max-w-md">
              Discover the best restaurants, street food stalls, and hidden culinary gems
              near you on our interactive map. Let AI guide you to your next unforgettable meal.
            </p>
          </SlideIn>

          <SlideIn delay={0.45} direction="left">
            <button
              onClick={handleGoToMap}
              className="group mt-2 inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-sm
                         hover:bg-gray-800 transition-all duration-300 active:scale-95 shadow-xl shadow-gray-900/20 w-fit"
            >
              Go to Map now!
              <RiArrowRightLine className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </SlideIn>
        </div>

        {/* ─── Right Column: Map Image Frame ─── */}
        <SlideIn delay={0.2} direction="right">
          <div
            className="rounded-3xl overflow-hidden border-8 shadow-2xl shadow-gray-200/60"
            style={{ borderColor: "#F1F5F9" }}
          >
            <div className="relative group cursor-pointer" onClick={handleGoToMap}>
              <img
                src="/map-preview.png"
                alt="Eatory Map Preview – Explore food locations"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
                  <span className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <RiMapPin2Fill className="text-orange-500" />
                    Open Map
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
}
