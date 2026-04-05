import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Đổi trạng thái khi cuộn xuống 40px
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white shadow-md py-2" 
          : "bg-transparent py-4"     
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link 
          to="/" 
          className={`text-2xl font-bold transition-colors ${isScrolled ? "text-[#43268c]" : "text-white"}`}
        >  Web Travel
        </Link>

        {/* Menu Items */}
        <div className={`flex items-center gap-8 font-medium transition-colors ${isScrolled ? "text-gray-700" : "text-white"}`}>
          <Link to="/" className="hover:text-[#b59afa]">Home</Link>
          <Link to="/MainPage" className="hover:text-[#b59afa]">Map</Link>
        </div>
      </div>
    </nav>
  );
}