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
      className="w-10 h-10 rounded-full cursor-pointer hover:scale-105 transition"
    />
  );
}