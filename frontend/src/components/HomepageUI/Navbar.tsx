import { useState } from "react";
import { Link } from "react-router-dom";
import { RiMenuLine, RiCloseLine } from "react-icons/ri";

interface NavbarProps {
  currentProvince?: string;
}

export default function Navbar({ currentProvince }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const provinceToShare = currentProvince || "Hà Nội";

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white shadow-md py-2`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold transition-colors text-[#43268c]"
        >
          WebTravel
        </Link>

        {/* Mobile button */}
        <button
          className="md:hidden text-xl text-black"
          onClick={() => setOpen(!open)}
        >
          {open ? <RiCloseLine /> : <RiMenuLine />}
        </button>

        {/* Menu */}
        <div
          className={`absolute md:static top-full left-0 w-full md:w-auto transition-all duration-300 ${
            open ? "block" : "hidden md:block"
          }`}
        >
          <div
            className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 font-medium p-4 md:p-0 bg-white text-gray-700`}
          >
            <Link
              to="/"
              className="hover:text-[#b59afa]"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>

            <Link
              to={`/MainPage?province=${encodeURIComponent(provinceToShare)}`}
              className="hover:text-[#b59afa]"
              onClick={() => setOpen(false)}
            >
              Map
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
