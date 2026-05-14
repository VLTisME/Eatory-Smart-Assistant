

interface Props {
	value?: string;
	open: boolean;
	onToggle: () => void;
	isLoading?: boolean;
}

export default function SelectButton({
	value,
	open,
	onToggle,
	isLoading,
}: Props) {
	return (
		<button
			onClick={onToggle}
			className="flex w-full cursor-pointer items-center gap-2 rounded-full py-1.5 pr-2 pl-1 text-left transition-colors"
		>
			<span
				className={`truncate text-sm ${
					value
						? "font-semibold text-white"
						: "font-medium text-white/60"
				}`}
			>
				{value ||
					(isLoading
						? "Detecting location..."
						: "Select province...")}
			</span>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				className={`h-3.5 w-3.5 shrink-0 text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
			>
				<path
					fillRule="evenodd"
					d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
					clipRule="evenodd"
				/>
			</svg>
		</button>
	);
}