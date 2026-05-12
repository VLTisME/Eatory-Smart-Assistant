import { useState, useEffect } from "react";

import Header from "../components/HomepageUI/Header";
import Destination from "../components/HomepageUI/Destination";
import Journey from "../components/HomepageUI/Journey";
import Discover from "../components/HomepageUI/Discover";
import Clients from "../components/HomepageUI/Clients";
import MapPreview from "../components/HomepageUI/MapPreview";
import Footer from "../components/HomepageUI/Footer";
import ScrollReveal from "../components/HomepageUI/Animation/ScrollReveal";

/**
 * Arch-shaped transition: a SVG "dome" that overlaps the previous section,
 * using the NEXT section's background color as the fill.
 * The dome sits at the bottom of the PREVIOUS section, creating the
 * visual effect of the next section's layer curving up and over.
 */
function SectionWithArch({
  children,
  bgColor,
  bgClass,
  zIndex,
  archOverlap = 80,
}: {
  children: React.ReactNode;
  bgColor: string;
  bgClass: string;
  zIndex: number;
  /** How many px the arch dome overlaps the previous section (default 80) */
  archOverlap?: number;
}) {
  return (
    <div className={`relative ${bgClass}`} style={{ zIndex }}>
      {/* Arch dome at top — overlaps previous section */}
      <div
        className="w-full overflow-hidden"
        style={{ marginTop: `-${archOverlap}px`, position: "relative", zIndex: zIndex + 1 }}
      >
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: "100px" }}
        >
          <path
            d="M0,100 L0,100 Q720,0 1440,100 L1440,100 Z"
            fill={bgColor}
          />
        </svg>
      </div>
      {/* Content */}
      <div className="pt-4 pb-20">{children}</div>
    </div>
  );
}

export default function Home() {
  const [province, setProvince] = useState(() => {
    return localStorage.getItem("province") || "";
  });
  useEffect(() => {
    if (province) {
      localStorage.setItem("province", province);
    }
  }, [province]);

  return (
    <div className="overflow-x-hidden bg-white font-sans">
      {/* Header — no animation */}
      <Header selectedProvince={province} setSelectedProvince={setProvince} />

      {/* Destination — has its own internal scroll animation */}
      <SectionWithArch bgColor="#ffffff" bgClass="bg-white" zIndex={10} archOverlap={40}>
        <Destination />
      </SectionWithArch>

      {/* Journey — has its own internal scroll animation */}
      <SectionWithArch bgColor="#dbeafe" bgClass="bg-blue-100" zIndex={20}>
        <Journey />
      </SectionWithArch>

      {/* Discover — has its own internal scroll animation */}
      <SectionWithArch bgColor="#ffffff" bgClass="bg-white" zIndex={30}>
        <Discover />
      </SectionWithArch>
       {/* MapPreview — deeper pastel purple */}
      <SectionWithArch bgColor="#f3e8ff" bgClass="bg-purple-100" zIndex={50}>
        <ScrollReveal delay={0.1}>
          <MapPreview selectedProvince={province} />
        </ScrollReveal>
      </SectionWithArch>

      <SectionWithArch bgColor="#ffffff" bgClass="bg-white" zIndex={40}>
        <ScrollReveal delay={0.1}>
          <Clients />
        </ScrollReveal>
      </SectionWithArch>
      
      {/* Footer — no scroll animation */}
      <div className="relative" style={{ zIndex: 60 }}>
        <Footer />
      </div>
    </div>
  );
}
