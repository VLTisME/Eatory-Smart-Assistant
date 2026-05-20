import { motion } from "framer-motion";
import { RiMapPinLine, RiSearchLine } from "react-icons/ri";

interface Props {
	options: string[];
	value?: string;
	search: string;
	onSearchChange: (val: string) => void;
	onSelect: (val: string) => void;
}

export default function SelectDropdown({
	options,
	value,
	search,
	onSearchChange,
	onSelect,
}: Props) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 8, scale: 0.96 }}
			transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
			className="absolute bottom-full left-0 z-50 mb-3 w-72 overflow-hidden rounded-2xl border border-white/20 bg-gray-900/80 shadow-2xl shadow-black/30 backdrop-blur-xl"
		>
			{/* Search input */}
			<div className="border-b border-white/10 px-3 py-2.5">
				<div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
					<RiSearchLine className="shrink-0 text-sm text-white/40" />
					<input
						type="text"
						placeholder="Search province..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
						autoFocus
					/>
				</div>
			</div>

			{/* Options list */}
			<div className="max-h-52 overflow-y-auto py-1">
				{options.length === 0 ? (
					<div className="px-4 py-6 text-center text-sm text-white/40">
						No provinces found
					</div>
				) : (
					options.map((item) => (
						<button
							key={item}
							onClick={() => onSelect(item)}
							className={`group flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left transition-all duration-150 ${
								value === item
									? "bg-blue-500/20 text-blue-300"
									: "text-white/70 hover:bg-white/10 hover:text-white"
							}`}
						>
							<RiMapPinLine
								className={`shrink-0 text-sm transition-all duration-200 ${
									value === item
										? "scale-110 text-blue-400"
										: "text-white/30 group-hover:scale-110 group-hover:text-blue-400"
								}`}
							/>
							<span className="truncate text-sm font-medium">
								{item}
							</span>
							{value === item && (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									className="ml-auto h-4 w-4 shrink-0 text-blue-400"
								>
									<path
										fillRule="evenodd"
										d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</button>
					))
				)}
			</div>
		</motion.div>
	);
}