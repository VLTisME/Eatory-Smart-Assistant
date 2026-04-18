import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/HomepageUI/Navbar";
import Home from "./pages/Home";
import MainPage from "./pages/MainPage";

export default function App() {
  const location = useLocation();
  const hideNavbarPaths = ["/MainPage"];
  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/MainPage" element={<MainPage />} />
      </Routes>
    </>
  );
}
