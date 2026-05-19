import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Logo from "../../assets/logo.svg";

interface AuthContainerProps {
	defaultRegister?: boolean;
	onModeChange?: (mode: "signin" | "signup") => void;
	prefillEmail?: string;
}

export default function AuthContainer({
	defaultRegister = false,
	onModeChange,
	prefillEmail = "",
}: AuthContainerProps) {
	const navigate = useNavigate();
	const [isRegister, setIsRegister] = useState(defaultRegister);

	useEffect(() => {
		setIsRegister(defaultRegister);
	}, [defaultRegister]);

	const handleSwitch = (register: boolean) => {
		setIsRegister(register);
		if (onModeChange) {
			onModeChange(register ? "signup" : "signin");
		}
	};

	return (
		<div className="relative flex h-150 w-[90%] max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
			<button
				type="button"
				onClick={() => navigate("/")}
				className="cursor-pointer absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-md transition hover:bg-white"
			>
				<span aria-hidden="true">←</span>
				Quay lại
			</button>
			<div className="relative hidden w-[45%] overflow-hidden lg:block">
				<div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800" />
				<div
					className="pointer-events-none absolute inset-0 opacity-5"
					style={{
						backgroundImage:
							"radial-gradient(circle, white 1px, transparent 1px)",
						backgroundSize: "20px 20px",
					}}
				/>
				<div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />
				<div className="pointer-events-none absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />

				<div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
					<img src={Logo} alt="Eatory logo" className="h-10 w-auto" />
					<span className="text-2xl font-bold tracking-wide">
						EATORY
					</span>
					<p className="text-sm leading-relaxed text-blue-100/80">
						Discover Vietnam's most authentic culinary experiences —
						from hidden street food gems to legendary local
						specialties.
					</p>
				</div>
			</div>
			<div className="flex w-full flex-col justify-center px-8 py-10 lg:w-[55%] lg:px-12">
				<div className="relative mb-8 flex rounded-full bg-blue-50 p-1">
					<div
						className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-blue-600 shadow-md transition-all duration-300 ${
							isRegister ? "left-[calc(50%+2px)]" : "left-1"
						}`}
					/>
					<button
						onClick={() => handleSwitch(false)}
						className={`relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
							!isRegister ? "text-white" : "text-gray-500"
						}`}
					>
						Sign In
					</button>
					<button
						onClick={() => handleSwitch(true)}
						className={`relative z-10 flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
							isRegister ? "text-white" : "text-gray-500"
						}`}
					>
						Sign Up
					</button>
				</div>
				{isRegister ? (
					<RegisterForm
						onSwitchToLogin={() => handleSwitch(false)}
						prefillEmail={prefillEmail}
					/>
				) : (
					<LoginForm onSwitchToRegister={() => handleSwitch(true)} />
				)}
			</div>
		</div>
	);
}
