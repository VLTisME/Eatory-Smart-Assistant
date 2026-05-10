interface Props {
  value?: string;
  open: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export default function SelectButton({ value, open, onToggle, isLoading }: Props) {
  return (
    <button onClick={onToggle} className="w-full p-4  bg-white rounded-2xl flex justify-between">
      <span className={value ? "text-black" : "text-gray-400"}>
        {value ||
          (isLoading
            ? "Đang xác định vị trí..."
            : "Chọn tỉnh/thành phố")}
      </span>
      <span className={open ? "rotate-180" : ""}>▼</span>
    </button>
  );
}