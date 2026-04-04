import { BotMessageSquare } from "lucide-react";

interface ToggleButtonProps {
	handleClick: () => void;
}

function ToggleButton({ handleClick }: ToggleButtonProps) {
	return (
		<button
			onClick={handleClick}
			className="flex items-center justify-center w-12 h-12 border rounded-full bg-gray-300 hover:bg-amber-500 hover:text-white hover:scale-3d transition-all duration-300 cursor-pointer"
		>
			<BotMessageSquare size={22} strokeWidth={2} />
		</button>
	);
}

export default ToggleButton;
