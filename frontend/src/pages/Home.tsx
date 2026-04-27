import { useState, useEffect } from "react";

import Navbar from "../components/HomepageUI/Navbar/Navbar";
import Header from "../components/HomepageUI/Header";
import Destination from "../components/HomepageUI/Destination";
import Journey from "../components/HomepageUI/Journey";
import Discover from "../components/HomepageUI/Discover";
import Clients from "../components/HomepageUI/Clients";
import Footer from "../components/HomepageUI/Footer";

export default function Home() {
  const [province, setProvince] = useState(() => {
    return localStorage.getItem("province") || "";
  });
  useEffect(() => {
  if (province) {
    localStorage.setItem("province", province);
  }
}, [province]);

  return (
    <div className="overflow-x-hidden">
      <Navbar currentProvince={province} />
      <Header selectedProvince={province} setSelectedProvince={setProvince} />
      <Destination />
      <Journey />
      <Discover />
      <Clients />
      <Footer />
    </div>
  );
}
