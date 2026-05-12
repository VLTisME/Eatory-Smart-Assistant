interface Props {
  value?: string;
  open: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export default function SelectButton({ value, open, onToggle, isLoading }: Props) {
  return (
    <button onClick={onToggle} className="w-full px-5 py-3.5 bg-transparent rounded-xl flex justify-between items-center text-left transition-colors hover:bg-gray-50">
      <span className={`text-base ${value ? "text-gray-900 font-semibold" : "text-gray-400 font-medium"}`}>
        {value ||
          (isLoading
            ? "Đang xác định vị trí..."
            : "Chọn tỉnh/thành phố")}
      </span>
      <span className={`text-xs text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
    </button>
  );
}