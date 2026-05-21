import { Route, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { RouteInfo, StepInfo } from "../services/directionsAPI";
import { useLanguage } from "../../../hooks/useLanguage";

interface DirectionResultProps {
	route: RouteInfo;
}

export default function DirectionResult({ route }: DirectionResultProps) {
	const [expandedSteps, setExpandedSteps] = useState(false);
	const { lang } = useLanguage();
	const text =
		lang === "vi"
			? {
					distance: "Khoảng cách",
					duration: "Thời gian",
					from: "Từ:",
					to: "Đến:",
					details: (count: number) =>
						`Hướng dẫn chi tiết (${count} bước)`,
				}
			: {
					distance: "Distance",
					duration: "Duration",
					from: "From:",
					to: "To:",
					details: (count: number) =>
						`Detailed directions (${count} steps)`,
				};

	const leg = route.legs[0];
	if (!leg) return null;

	const steps = leg.steps ?? [];

	return (
		<div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
			{/* Summary card */}
			<div className="bg-linear-to-br from-blue-50 to-sky-50 p-4 rounded-2xl border border-blue-100/60 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 flex-1">
						<div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
							<Route size={20} className="text-white" />
						</div>
						<div>
							<p className="text-lg font-extrabold text-slate-900 tracking-tight">
								{leg.distance.text}
							</p>
							<p className="text-xs text-slate-500 font-medium">
								{text.distance}
							</p>
						</div>
					</div>

					<div className="w-px h-10 bg-slate-200" />

					<div className="flex items-center gap-2 flex-1">
						<div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
							<Clock size={20} className="text-white" />
						</div>
						<div>
							<p className="text-lg font-extrabold text-slate-900 tracking-tight">
								{leg.duration.text}
							</p>
							<p className="text-xs text-slate-500 font-medium">
								{text.duration}
							</p>
						</div>
					</div>
				</div>
				{(leg.start_address || leg.end_address) && (
					<div className="mt-3 pt-3 border-t border-blue-100/80 space-y-1.5">
						{leg.start_address && (
							<p className="text-xs text-slate-500 flex items-start gap-1.5">
								<span className="text-blue-500 font-bold shrink-0">
									{text.from}
								</span>
								<span className="line-clamp-1">
									{leg.start_address}
								</span>
							</p>
						)}
						{leg.end_address && (
							<p className="text-xs text-slate-500 flex items-start gap-1.5">
								<span className="text-red-500 font-bold shrink-0">
									{text.to}
								</span>
								<span className="line-clamp-1">
									{leg.end_address}
								</span>
							</p>
						)}
					</div>
				)}
			</div>
			{steps.length > 0 && (
				<div className="bg-white rounded-2xl border border-slate-100/60 shadow-sm overflow-hidden">
					<button
						type="button"
						onClick={() => setExpandedSteps(!expandedSteps)}
						className="cursor-pointer w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
					>
						<span className="flex items-center gap-2">
							<ArrowRight size={16} className="text-blue-500" />
							{text.details(steps.length)}
						</span>
						{expandedSteps ? (
							<ChevronUp size={16} className="text-slate-400" />
						) : (
							<ChevronDown size={16} className="text-slate-400" />
						)}
					</button>
					{expandedSteps && (
						<div className="px-4 pb-4 space-y-2 max-h-60 overflow-y-auto">
							{steps.map((step: StepInfo, idx: number) => (
								<div
									key={idx}
									className="flex gap-3 items-start py-2 border-b border-slate-50 last:border-b-0"
								>
									<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
										<span className="text-[10px] font-bold text-blue-600">
											{idx + 1}
										</span>
									</div>
									<div className="flex-1 min-w-0">
										<p
											className="text-[13px] text-slate-700 leading-relaxed"
											dangerouslySetInnerHTML={{
												__html: step.html_instructions,
											}}
										/>
										<p className="text-[11px] text-slate-400 mt-0.5">
											{step.distance.text} •{" "}
											{step.duration.text}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
