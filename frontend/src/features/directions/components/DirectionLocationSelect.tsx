import { MapPin, Navigation2 } from "lucide-react";

interface DirectionLocationSelectProps {
	originLabel: string;
	destinationLabel: string;
	originLoading?: boolean;
}

export default function DirectionLocationSelect({
	originLabel,
	destinationLabel,
	originLoading = false,
}: DirectionLocationSelectProps) {
	return (
		<div className="relative flex flex-col gap-3">
			<div className="absolute left-4.75 top-7 w-0.5 h-[calc(100%-48px)] bg-linear-to-b from-blue-400 to-red-400 rounded-full" />
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm">
					<Navigation2 size={18} className="text-blue-600" />
				</div>
				<div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
					<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
						Vị trí của bạn
					</span>
					{originLoading ? (
						<span className="text-slate-400 animate-pulse text-[13px]">
							Đang xác định vị trí...
						</span>
					) : (
						<span className="text-slate-700 font-medium text-[13px] line-clamp-1">
							{originLabel || "Chưa xác định"}
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-sm">
					<MapPin size={18} className="text-red-500" />
				</div>
				<div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
					<span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
						Chọn điểm đến
					</span>
					<span className="text-slate-700 font-medium text-[13px] line-clamp-1">
						{destinationLabel || "Chưa chọn điểm đến"}
					</span>
				</div>
			</div>
		</div>
	);
}
