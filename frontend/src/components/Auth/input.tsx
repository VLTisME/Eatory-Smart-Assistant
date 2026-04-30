import { useState } from "react";

type Props = {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({ label, type, value, onChange }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full h-12 border-b border-gray-300 my-6">
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full h-full bg-transparent outline-none text-white"
      />

      <label
        className={`
          absolute left-0 text-gray-300 transition-all duration-200
          ${
            value || isFocused
              ? "-top-2 text-sm"
              : "top-1/2 -translate-y-1/2"
          }
        `}
      >
        {label}
      </label>
    </div>
  );
}