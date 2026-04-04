import { Link } from "react-router-dom";


export default function Navbar() {
  return (
    <header className="fixed top-0 w-full bg-black text-white z-50">
      <div className="flex justify-between items-center px-10 py-4">
        {/* Tên web */}
        <h1 className="text-yellow-500 text-2xl font-bold">Web Travel</h1>

        {/* Menu + Contact */}
        <div className="flex items-center gap-8">
          <nav className="flex items-center gap-6">

            <Link to="/">Home</Link>
            <Link to="/MainPage">Map</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
