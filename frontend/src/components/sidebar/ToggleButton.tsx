import { BotMessageSquare } from "lucide-react";

interface ToggleButtonProps {
	handleClick: () => void;
}

function ToggleButton({ handleClick }: ToggleButtonProps) {
	return (
		<button
			onClick={handleClick}
			className="group relative flex items-center h-12 bg-[#facc15] hover:bg-yellow-400 transition-[width,background-color] duration-500 ease-in-out rounded-full overflow-hidden w-12 hover:w-36.25 cursor-pointer"
			style={
				{
					WebkitMaskImage: `radial-gradient(circle 8px at calc(100% - 3rem) 0, transparent 8px, black 8.5px), radial-gradient(circle 8px at calc(100% - 3rem) 100%, transparent 8px, black 8.5px)`,
					WebkitMaskSize: "100% 51%",
					WebkitMaskRepeat: "no-repeat",
					WebkitMaskPosition: "top, bottom",
					maskImage: `radial-gradient(circle 8px at calc(100% - 3rem) 0, transparent 8px, black 8.5px), radial-gradient(circle 8px at calc(100% - 3rem) 100%, transparent 8px, black 8.5px)`,
					maskSize: "100% 51%",
					maskRepeat: "no-repeat",
					maskPosition: "top, bottom",
				} as React.CSSProperties
			}
		>
			<div className="absolute left-0 pl-5 whitespace-nowrap text-sm font-bold text-gray-900 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:duration-500 group-hover:delay-150">
				Chat Now
			</div>

			<div className="absolute right-0 flex items-center justify-center w-12 h-full shrink-0">
				<BotMessageSquare size={25} strokeWidth={2} />
			</div>
		</button>
	);
}

export default ToggleButton;
