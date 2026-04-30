import Input from "./input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebase";
import { FirebaseError } from "firebase/app";

type Props = {
  isRegister: boolean;
  setIsRegister: (value: boolean) => void;
};

export default function RegisterForm({ isRegister, setIsRegister }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // 🔥 thêm
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth!,
        email,
        password
      );

      const user = userCredential.user;

      const token = await user.getIdToken();
      localStorage.setItem("token", token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          name: name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c63ff&color=fff`,
        })
      );

      window.dispatchEvent(new Event("userChange"));
      navigate("/");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/email-already-in-use":
            setErrorMsg("Email này đã được sử dụng");
            break;
          case "auth/weak-password":
            setErrorMsg("Mật khẩu phải tối thiểu 6 ký tự");
            break;
          case "auth/invalid-email":
            setErrorMsg("Email không hợp lệ");
            break;
          default:
            setErrorMsg("Lỗi đăng ký: " + err.code);
        }
      } else {
        setErrorMsg("Đã xảy ra lỗi không xác định");
      }
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg("");

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);

      const user = result.user;

      const token = await user.getIdToken();
      localStorage.setItem("token", token);

      localStorage.setItem(
        "user",
        JSON.stringify({
          name: user.displayName || "User",
          avatar: user.photoURL || "https://i.pravatar.cc/40",
        })
      );

      window.dispatchEvent(new Event("userChange"));
      navigate("/");
    } catch (err) {
      const error = err as FirebaseError;

      if (error.code === "auth/popup-closed-by-user") {
        setErrorMsg("Bạn đã đóng cửa sổ đăng ký Google");
      } else {
        setErrorMsg("Google đăng ký thất bại");
      }
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 w-full h-full backdrop-blur-xl flex items-center justify-center text-white transition-transform duration-500 ${
        isRegister ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <form className="w-85" onSubmit={handleRegister}>
        <h2 className="text-3xl text-center mb-6">Sign Up</h2>

        <Input
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMsg && (
          <div className="text-red-400 text-sm mb-3 text-center">
            {errorMsg}
          </div>
        )}

        <button className="cursor-pointer w-full h-11 bg-red-600 rounded-md mt-2 flex items-center justify-center gap-2 hover:bg-[#9b1212] transition">
          Sign Up
        </button>

        {/* divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-400/40"></div>
          <span className="px-3 text-sm text-gray-300">OR</span>
          <div className="flex-1 h-px bg-gray-400/40"></div>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          className="cursor-pointer w-full h-11 border border-white/30 rounded-md flex items-center justify-center gap-2 hover:bg-white/10 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="text-center mt-5 text-sm">
          Already have an account?{" "}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsRegister(false);
            }}
            className="cursor-pointer underline"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}