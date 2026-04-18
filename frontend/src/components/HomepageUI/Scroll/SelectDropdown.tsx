interface Props {
  options: string[];
  value?: string;
  onSelect: (val: string) => void;
}

export default function SelectDropdown({ options, value, onSelect }: Props) {
  return (
    <div className="absolute w-full bg-white shadow rounded-xl max-h-60 overflow-y-auto">
      {options.map((item) => (
        <div
          key={item}
          onClick={() => onSelect(item)}
          className={`p-3 cursor-pointer ${
            value === item ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}