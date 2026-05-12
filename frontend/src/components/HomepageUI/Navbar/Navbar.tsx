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
  const { location, province: detectedProvince } = useGeolocation();

// Sau đó lấy gpsLat và gpsLng từ object location
  const gpsLat = location?.lat;
  const gpsLng = location?.lng;
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
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 bg-white py-1.5
          ${isMapPage 
            ? (isHovered || open ? "translate-y-0" : "-translate-y-full") 
            : "translate-y-0"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            onClick={() => {
              localStorage.removeItem("province");
              setOpen(false);
            }}
            className="text-xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">Food</span>
            <span className="text-gray-700 ml-1">Tourism</span>
          </a>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-xl text-gray-900 z-10"
            onClick={() => setOpen(!open)}
          >
            {open ? <RiCloseLine /> : <RiMenuLine />}
          </button>

          {/* Desktop & Mobile menu */}
          <div
            className={`absolute md:static top-full left-0 w-full md:w-auto transition-all duration-300 ${
              open ? "block bg-white shadow-lg" : "hidden md:block"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-8 p-6 md:p-0">
              {/* Nav links*/}
              <Link
                to="/"
                className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors duration-300 ease-in-out"
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
                className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors duration-300 ease-in-out"
                onClick={() => setOpen(false)}
              >
                Map
              </Link>

              {user ? (
                <UserMenu user={user} onLogout={() => setUser(null)} />
              ) : (
                <>
                  <Link
                    to="/AuthPage?mode=signin"
                    className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors duration-300 ease-in-out"
                    onClick={() => setOpen(false)}
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/AuthPage?mode=signup"
                    className="bg-gradient-to-r from-orange-400 to-rose-500 text-white text-sm font-medium px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-orange-200 transition-all duration-300"
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}