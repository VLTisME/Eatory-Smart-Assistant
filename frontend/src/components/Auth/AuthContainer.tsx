import { useState, useEffect } from "react";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import ImageSlider from "./ImageSlider";

const images = ["/bg.jpg", "/bg2.webp", "/bg3.jpg"];

export default function AuthContainer() {
  const [isRegister, setIsRegister] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[75%] h-[550px] rounded-xl overflow-hidden flex shadow-2xl">

      {/*  Background slider */}
      <ImageSlider images={images} current={current} />

      {/*  Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/*  Nội dung */}
      <div className="relative z-20 flex w-full">
        <LeftPanel />
        <RightPanel isRegister={isRegister} setIsRegister={setIsRegister} />
      </div>
    </div>
  );
}