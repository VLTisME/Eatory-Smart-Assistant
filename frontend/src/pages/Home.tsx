import Navbar from "../components/HomepageUI/Navbar";
import Header from "../components/HomepageUI/Header";
import Destination from "../components/HomepageUI/Destination";
import Journey from "../components/HomepageUI/Journey";
import Discover from "../components/HomepageUI/Discover";
import Clients from "../components/HomepageUI/Clients";
import Footer from "../components/HomepageUI/Footer";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Header />
      <Destination />
      <Journey />
      <Discover />
      <Clients />
      <Footer />
    </div>
  );
}
