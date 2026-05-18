import { useSearchParams } from "react-router-dom";
import AuthContainer from "../components/Auth/AuthContainer";

export default function AuthPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const mode = searchParams.get("mode"); // "signup" or null

	const handleModeChange = (newMode: "signin" | "signup") => {
		setSearchParams({ mode: newMode }, { replace: true });
	};

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
			{/* Background gradient */}
			<div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-sky-50" />
			<div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-100/30 blur-3xl" />

			<div className="relative z-10">
				<AuthContainer
					defaultRegister={mode === "signup"}
					onModeChange={handleModeChange}
				/>
			</div>
		</div>
	);
}
