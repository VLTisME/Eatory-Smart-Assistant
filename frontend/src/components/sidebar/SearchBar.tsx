import { Search } from "lucide-react";

function SearchBar() {
	return (
		<div
			className="flex m-4 items-center gap-1.5 bg-gray-200/90 hover:bg-white/90 backdrop-blur-sm w-100 h-13 border-2 
        border-gray-200/60 rounded-3xl p-3.5 focus-within:border-blue-400 
        focus-within:bg-white focus-within:shadow-sm transition-all duration-300 pointer-events-auto"
		>
			<Search size={20} />
			<textarea
				rows={1}
				placeholder="Tìm kiếm vị trí của bạn"
				className="grow resize-none bg-transparent outline-none
							text-gray-800 text-sm leading-relaxed
							py-2.5 px-1 max-h-18 overflow-y-auto
							placeholder:text-gray-400
							disabled:opacity-50 disabled:cursor-not-allowed"
			/>
		</div>
	);
}

export default SearchBar;
