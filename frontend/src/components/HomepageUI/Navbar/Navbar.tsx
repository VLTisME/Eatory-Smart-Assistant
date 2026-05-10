import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RiMenuLine, RiCloseLine } from "react-icons/ri";
import { UBND_COORDS } from "../../../data/ubndCoords";
import UserMenu from "./UserMenu";
import { useGeolocation } from "../../../hooks/useGeolocation";

interface User {
  name: string;
  avatar: string;
}
interface NavbarProps {
  currentProvince?: string;
  currentPath?: string;
}

export default function Navbar({ currentProvince, currentPath }: NavbarProps) {
  
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { lat: gpsLat, lng: gpsLng, province: detectedProvince } = useGeolocation();
  const isMapPage = currentPath === "/MainPage";
const provinceToShare = currentProvince || detectedProvince;

const coords = provinceToShare
  ? UBND_COORDS[provinceToShare]
  : null;

const finalLat = coords?.lat || gpsLat;
const finalLng = coords?.lng || gpsLng;
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };

    window.addEventListener("storage", checkUser);
    window.addEventListener("userChange", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("userChange", checkUser);
    };
  }, []);

  return (
    <>
      {/* Vùng cảm biến: Kích hoạt khi di chuột lên sát mép trên cùng */}
      {isMapPage && (
        <div
          className="fixed top-0 left-0 w-full h-4 z-60"
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      <nav
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white/90 backdrop-blur-md shadow-md py-2.5
          ${isMapPage 
            ? (isHovered || open ? "translate-y-0" : "-translate-y-full") 
            : "translate-y-0"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            onClick={() => {
              localStorage.removeItem("province");
              setOpen(false);
            }}
            className="text-2xl font-bold transition-colors text-[#43268c]"
          >
            WebTravel
          </a>

          {/* Mobile button */}
          <button
            // Thêm 'pr-6' (padding-right) để đẩy biểu tượng sang trái
            className="md:hidden text-xl text-black pr-10 z-10" // Thêm z-10 để đảm bảo nó nằm trên bản đồ
            onClick={() => setOpen(!open)}
          >
            {open ? <RiCloseLine /> : <RiMenuLine />}
          </button>

          {/* Menu */}
          <div
            className={`absolute md:static top-full left-0 w-full md:w-auto transition-all duration-300 ${
              open ? "block bg-white shadow-lg" : "hidden md:block"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 font-medium p-4 md:p-0 text-gray-700">
              <Link
                to="/"
                className="hover:text-[#b59afa]"
                onClick={() => setOpen(false)}
              >
                Home
              </Link>

              <Link
                to={
                  finalLat && finalLng
                    ? `/MainPage?lat=${finalLat}&lng=${finalLng}&province=${encodeURIComponent(provinceToShare!)}`
                    : "/MainPage"
                }
                className="hover:text-[#b59afa]"
                onClick={() => setOpen(false)}
              >
                Map
              </Link>

              {user ? (
                <UserMenu user={user} onLogout={() => setUser(null)} />
              ) : (
                <Link
                  to="/AuthPage"
                  className="hover:text-[#b59afa]"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}