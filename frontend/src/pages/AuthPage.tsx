import { useState, useEffect } from "react";
import AuthContainer from "../components/Auth/AuthContainer";

const images = ["/bg.jpg", "/bg2.webp", "/bg3.jpg"];

export default function AuthPage() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* Background đồng bộ */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg scale-110 transition-all duration-1000"
        style={{ backgroundImage: `url(${images[current]})` }}
      />

      <AuthContainer />
    </div>
  );
}