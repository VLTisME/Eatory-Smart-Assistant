import { useState, useRef, useEffect } from "react";
import SelectButton from "./SelectButton";
import SelectDropdown from "./SelectDropdown";
import { VietNam_Provinces } from "../../../data/travelData";
import { AnimatePresence } from "framer-motion";

interface ScrollSelectProps {
	value: string;
	isLoading?: boolean;
	onSelect: (val: string) => void;
}

export default function ScrollSelect({
	value,
	onSelect,
	isLoading,
}: ScrollSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handle = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, []);

	const filtered = search
		? VietNam_Provinces.filter((p) =>
				p.toLowerCase().includes(search.toLowerCase()),
			)
		: VietNam_Provinces;

	return (
		<div ref={ref} className="relative w-full">
			<SelectButton
				value={value}
				open={open}
				onToggle={() => {
					setOpen(!open);
					if (open) setSearch("");
				}}
				isLoading={isLoading}
			/>

			<AnimatePresence>
				{open && (
					<SelectDropdown
						options={filtered}
						value={value}
						search={search}
						onSearchChange={setSearch}
						onSelect={(val) => {
							onSelect(val);
							localStorage.removeItem("hasSearched");
							setOpen(false);
							setSearch("");
						}}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}