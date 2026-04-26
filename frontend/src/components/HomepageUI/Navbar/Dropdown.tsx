///src/components/HomepageUI/Navbar/Dropdown.tsx
import{RiLogoutBoxLine} from "react-icons/ri";
interface Props {
  name: string;
  onLogout: () => void;
}

export default function Dropdown({ name, onLogout }: Props) {
  return (
    <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-xl p-3 z-50">
      <p className="font-bold mb-2">{name}</p>

      <div className="border-t pt-2">
<button
  onClick={onLogout}
  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg text-red-500"
>
  <RiLogoutBoxLine className="text-xl" />
  Sign out
</button>
      </div>
    </div>
  );
}