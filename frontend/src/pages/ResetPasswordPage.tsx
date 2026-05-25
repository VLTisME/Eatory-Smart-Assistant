import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Logo from "../assets/logo.svg";
import {
	RiLockPasswordLine,
	RiEyeLine,
	RiEyeOffLine,
	RiCheckLine,
	RiCloseLine,
} from "react-icons/ri";

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const oobCode = searchParams.get("oobCode") || "";
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPwd, setConfirmPwd] = useState("");
	const [showPwd, setShowPwd] = useState(false);
	const [showConfirmPwd, setShowConfirmPwd] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [verifying, setVerifying] = useState(true);
	const [invalidCode, setInvalidCode] = useState(false);
	const [success, setSuccess] = useState(false);

	// Verify the reset code on mount
	useEffect(() => {
		if (!oobCode) {
			setInvalidCode(true);
			setVerifying(false);
			return;
		}

		verifyPasswordResetCode(auth, oobCode)
			.then((userEmail) => {
				setEmail(userEmail);
				setVerifying(false);
			})
			.catch((err) => {
				console.error("Invalid or expired reset code:", err);
				setInvalidCode(true);
				setVerifying(false);
			});
	}, [oobCode]);

	// Password validation rules
	const rules = [
		{ label: "At least 8 characters", valid: newPassword.length >= 8 },
		{ label: "Contains a number", valid: /\d/.test(newPassword) },
		{ label: "Passwords match", valid: newPassword === confirmPwd && confirmPwd.length > 0 },
	];

	const allValid = rules.every((r) => r.valid);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!allValid) return;

		setError("");
		setLoading(true);

		try {
			await confirmPasswordReset(auth, oobCode, newPassword);
			setSuccess(true);
		} catch (err: unknown) {
			console.error("Reset error:", err);
			if (err instanceof Error) {
				const msg = err.message;
				if (msg.includes("expired-action-code")) {
					setError(
						"This reset link has expired. Please request a new one."
					);
				} else if (msg.includes("invalid-action-code")) {
					setError(
						"This reset link is invalid or has already been used."
					);
				} else if (msg.includes("weak-password")) {
					setError(
						"Password is too weak. Please use a stronger password."
					);
				} else {
					setError("Failed to reset password. Please try again.");
				}
			} else {
				setError("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
	};

	// Loading state while verifying
	if (verifying) {
		return (
			<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-sky-50" />
				<div className="relative z-10 flex flex-col items-center gap-4">
					<div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
					<p className="text-sm text-gray-500">
						Verifying reset link...
					</p>
				</div>
			</div>
		);
	}

	// Invalid/expired code
	if (invalidCode) {
		return (
			<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-sky-50" />
				<div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-100/30 blur-3xl" />

				<div className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-10 text-center shadow-2xl">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
						<RiCloseLine className="text-3xl text-red-600" />
					</div>
					<h2 className="text-xl font-bold text-gray-900">
						Link expired or invalid
					</h2>
					<p className="text-sm leading-relaxed text-gray-500">
						This password reset link is no longer valid. It may have
						expired or already been used.
					</p>
					<button
						onClick={() => navigate("/AuthPage?mode=signin")}
						className="w-full cursor-pointer rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl"
					>
						Back to Sign In
					</button>
				</div>
			</div>
		);
	}

	// Success state
	if (success) {
		return (
			<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-sky-50" />
				<div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
				<div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-100/30 blur-3xl" />

				<div className="relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-10 text-center shadow-2xl">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<RiCheckLine className="text-3xl text-green-600" />
					</div>
					<h2 className="text-xl font-bold text-gray-900">
						Password updated!
					</h2>
					<p className="text-sm leading-relaxed text-gray-500">
						Your password has been successfully reset. You can now
						sign in with your new password.
					</p>
					<button
						onClick={() => navigate("/AuthPage?mode=signin")}
						className="w-full cursor-pointer rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl"
					>
						Go to Sign In
					</button>
				</div>
			</div>
		);
	}

	// Main reset form
	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-sky-50" />
			<div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-100/30 blur-3xl" />

			<div className="relative z-10 mx-4 w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
				{/* Logo */}
				<div className="mb-6 flex items-center justify-center gap-2">
					<img src={Logo} alt="Eatory logo" className="h-10 w-auto" />
					<span className="text-2xl font-bold tracking-wide text-gray-900">
						EATORY
					</span>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-5"
				>
					<div>
						<h3 className="mb-1 text-2xl font-bold text-gray-900">
							Set new password
						</h3>
						<p className="text-sm text-gray-400">
							Enter a new password for{" "}
							<span className="font-medium text-gray-600">
								{email}
							</span>
						</p>
					</div>

					{error && (
						<div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
							{error}
						</div>
					)}

					{/* New Password */}
					<div className="group relative">
						<RiLockPasswordLine className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
						<input
							type={showPwd ? "text" : "password"}
							placeholder="New password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							minLength={8}
							className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pr-11 pl-11 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
						/>
						<button
							type="button"
							onClick={() => setShowPwd(!showPwd)}
							className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
						>
							{showPwd ? <RiEyeOffLine /> : <RiEyeLine />}
						</button>
					</div>

					{/* Confirm Password */}
					<div className="group relative">
						<RiLockPasswordLine className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
						<input
							type={showConfirmPwd ? "text" : "password"}
							placeholder="Confirm new password"
							value={confirmPwd}
							onChange={(e) => setConfirmPwd(e.target.value)}
							required
							minLength={8}
							className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pr-11 pl-11 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPwd(!showConfirmPwd)}
							className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
						>
							{showConfirmPwd ? (
								<RiEyeOffLine />
							) : (
								<RiEyeLine />
							)}
						</button>
					</div>

					{/* Password strength rules */}
					{newPassword.length > 0 && (
						<div className="space-y-1.5 rounded-xl bg-gray-50 p-3">
							{rules.map((rule) => (
								<div
									key={rule.label}
									className="flex items-center gap-2 text-xs"
								>
									{rule.valid ? (
										<RiCheckLine className="text-green-500" />
									) : (
										<RiCloseLine className="text-gray-300" />
									)}
									<span
										className={
											rule.valid
												? "text-green-600"
												: "text-gray-400"
										}
									>
										{rule.label}
									</span>
								</div>
							))}
						</div>
					)}

					<button
						type="submit"
						disabled={loading || !allValid}
						className="cursor-pointer rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
					>
						{loading ? "Resetting..." : "Reset Password"}
					</button>

					<button
						type="button"
						onClick={() => navigate("/AuthPage?mode=signin")}
						className="cursor-pointer rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
					>
						Back to Sign In
					</button>
				</form>
			</div>
		</div>
	);
}
