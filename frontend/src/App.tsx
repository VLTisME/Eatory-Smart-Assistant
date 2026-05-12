import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/HomepageUI/Navbar/Navbar";
import Home from "./pages/Home";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";

export default function App() {
  const location = useLocation();
  const isMapPage = location.pathname === "/MainPage";
  return (
    <>
      {!isMapPage && <Navbar currentPath={location.pathname} 
          currentProvince={new URLSearchParams(location.search).get("province") || ""} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/MainPage" element={<MainPage key={location.search}/>} />
        <Route path="/AuthPage" element={<AuthPage />} />
      </Routes>
    </>
  );
}