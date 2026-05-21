import { Car, Bike, CarTaxiFront } from "lucide-react";
import type { TransportMode } from "../services/directionsAPI";
import { useLanguage } from "../../../hooks/useLanguage";

interface DirectionTransportModesProps {
	selected: TransportMode;
	onChange: (mode: TransportMode) => void;
	disabled?: boolean;
}

const MODES: {
	id: TransportMode;
	label: { vi: string; en: string };
	icon: typeof Car;
}[] = [
	{ id: "car", label: { vi: "Ô tô", en: "Car" }, icon: Car },
	{ id: "motorcycle", label: { vi: "Xe máy", en: "Motorbike" }, icon: Bike },
	{ id: "taxi", label: { vi: "Taxi", en: "Taxi" }, icon: CarTaxiFront },
];

export default function DirectionTransportModes({
	selected,
	onChange,
	disabled = false,
}: DirectionTransportModesProps) {
	const { lang } = useLanguage();
	return (
		<div className="flex gap-2">
			{MODES.map(({ id, label, icon: Icon }) => {
				const isActive = selected === id;
				return (
					<button
						key={id}
						type="button"
						disabled={disabled}
						onClick={() => onChange(id)}
						className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 border ${
							isActive
								? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
								: "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
						} ${disabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
					>
						<Icon size={18} />
						<span className="hidden sm:inline">{label[lang]}</span>
					</button>
				);
			})}
		</div>
	);
}
