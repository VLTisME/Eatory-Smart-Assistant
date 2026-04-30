import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/HomepageUI/Navbar/Navbar";
import Home from "./pages/Home";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";
export default function App() {
  const location = useLocation();

  return (
    <>
      <Navbar currentPath={location.pathname} /> 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/MainPage" element={<MainPage />} />
        <Route path="/AuthPage" element={<AuthPage />} />
      </Routes>
    </>
  );
}