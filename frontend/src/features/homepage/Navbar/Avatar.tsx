///src/components/HomepageUI/Navbar/Avatar.tsx
interface Props {
  src: string;
  onClick: () => void;
}

export default function Avatar({ src, onClick }: Props) {
  return (
    <img
      src={src}
      onClick={onClick}
      className="w-7 h-7 rounded-full cursor-pointer hover:scale-105 transition"
    />
  );
}