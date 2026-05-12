import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-gray-950 mt-16 px-6 md:px-12 pt-16 pb-10"
      style={{ borderRadius: "48px 48px 0 0" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-gray-800">
          {/* Logo & Slogan */}
          <div className="md:col-span-5">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Food Tourism
            </h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-sm font-light">
              Exploring the nation's culinary landscape has never been easier.
              Let our AI Assistant design your perfect food journey in seconds.
            </p>
          </div>

          {/* Links columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/MainPage" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    Map
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
                Support
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 text-sm font-light hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
                Contact
              </h4>
              <ul className="space-y-3">
                <li className="text-gray-400 text-sm font-light">
                  +84 9876543210
                </li>
                <li className="text-gray-400 text-sm font-light">
                  info@foodtourism.vn
                </li>
                <li className="text-gray-400 text-sm font-light">
                  HCM City, Vietnam
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}