import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";

export default function App() {
	const location = useLocation();
	return (
		<>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route
					path="/MainPage"
					element={<MainPage key={location.search} />}
				/>
				<Route path="/AuthPage" element={<AuthPage />} />
			</Routes>
		</>
	);
}
