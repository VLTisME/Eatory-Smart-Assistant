interface Props {
  value?: string;
  open: boolean;
  onToggle: () => void;
}

export default function SelectButton({ value, open, onToggle }: Props) {
  return (
    <button onClick={onToggle} className="w-full p-4  bg-white rounded-2xl flex justify-between">
      <span className={value ? "text-black" : "text-gray-400"}>
        {value || "Chọn tỉnh/thành phố"}
      </span>
      <span className={open ? "rotate-180" : ""}>▼</span>
    </button>
  );
}