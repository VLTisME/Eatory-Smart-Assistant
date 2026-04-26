//src/components/Auth/RightPanel.tsx
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type Props = {
  isRegister: boolean;
  setIsRegister: (value: boolean) => void;
};

export default function RightPanel({ isRegister, setIsRegister }: Props) {
  return (
    <div className="w-[42%] relative overflow-hidden backdrop-blur-[30px] bg-white/10 border-l border-white/20">
      <LoginForm isRegister={isRegister} setIsRegister={setIsRegister} />
      <RegisterForm isRegister={isRegister} setIsRegister={setIsRegister} />
    </div>
  );
}