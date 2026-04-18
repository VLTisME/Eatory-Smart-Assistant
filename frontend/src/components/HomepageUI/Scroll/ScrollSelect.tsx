import { useState, useRef, useEffect } from "react";
import SelectButton from "./SelectButton";
import SelectDropdown from "./SelectDropdown";
import { VietNam_Provinces } from "../../../data/travelData";

interface ScrollSelectProps {
  value: string;
  onSelect: (val: string) => void;
}

export default function ScrollSelect({ value, onSelect }: ScrollSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <SelectButton value={value} open={open} onToggle={() => setOpen(!open)} />

      {open && (
        <SelectDropdown
          options={VietNam_Provinces}
          value={value}
          onSelect={(val) => {
            onSelect(val);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}