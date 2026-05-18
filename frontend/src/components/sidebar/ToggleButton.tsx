import { MessageCircle, House } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ToggleButtonProps {
	handleClick: () => void;
}

function ToggleButton({ handleClick }: ToggleButtonProps) {
	const navigate = useNavigate();
	const handleHomeClick = () => {
		navigate("/");
	};
	return (
		<div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-full z-50 transition-all duration-300">
			<button
				onClick={handleHomeClick}
				className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-500 ease-in-out hover:w-32 overflow-hidden cursor-pointer"
			>
				<div className="absolute left-0 flex w-10 h-full items-center justify-center shrink-0">
					<House
						size={24}
						className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
					/>
				</div>
				<span className="absolute left-10 whitespace-nowrap text-sm font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
					Home
				</span>
			</button>

			<button
				onClick={handleClick}
				className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-500 ease-in-out hover:w-32 overflow-hidden cursor-pointer"
			>
				<div className="absolute left-0 flex w-10 h-full items-center justify-center shrink-0">
					<MessageCircle
						size={24}
						className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
					/>
				</div>
				<span className="absolute left-10 whitespace-nowrap text-sm font-semibold text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
					Chat Now
				</span>
			</button>
		</div>
	);
}

export default ToggleButton;
