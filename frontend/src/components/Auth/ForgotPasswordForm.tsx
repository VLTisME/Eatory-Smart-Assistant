import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { RiMailLine, RiArrowLeftLine } from "react-icons/ri";

interface ForgotPasswordFormProps {
	onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
	onBackToLogin,
}: ForgotPasswordFormProps) {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			console.log("[ForgotPassword] Sending reset email to:", email);
			await sendPasswordResetEmail(auth, email, {
				url: `${window.location.origin}/AuthPage?mode=signin`,
				handleCodeInApp: false,
			});
			console.log("[ForgotPassword] sendPasswordResetEmail succeeded!");
			setSuccess(true);
		} catch (err: unknown) {
			console.error("[ForgotPassword] Error:", err);
			if (err instanceof Error) {
				// Map Firebase error codes to user-friendly messages
				const msg = err.message;
				if (msg.includes("user-not-found")) {
					setError("No account found with this email address.");
				} else if (msg.includes("invalid-email")) {
					setError("Please enter a valid email address.");
				} else if (msg.includes("too-many-requests")) {
					setError("Too many attempts. Please try again later.");
				} else {
					setError("Failed to send reset email. Please try again.");
				}
			} else {
				setError("An unexpected error occurred.");
			}
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="flex flex-col items-center gap-5 text-center">
				{/* Success icon */}
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
					<svg
						className="h-8 w-8 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="2.5"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
						/>
					</svg>
				</div>

				<div>
					<h3 className="mb-1 text-xl font-bold text-gray-900">
						Check your email
					</h3>
					<p className="text-sm leading-relaxed text-gray-500">
						We've sent a password reset link to{" "}
						<span className="font-semibold text-gray-700">
							{email}
						</span>
						. Please check your inbox and follow the instructions.
					</p>
				</div>

				<div className="w-full space-y-3">
					<button
						type="button"
						onClick={() => {
							setSuccess(false);
							setEmail("");
						}}
						className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
					>
						Send to a different email
					</button>

					<button
						type="button"
						onClick={onBackToLogin}
						className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl"
					>
						Back to Sign In
					</button>
				</div>

				<p className="text-xs text-gray-400">
					Didn't receive the email? Check your spam folder or try
					again.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			<div>
				<button
					type="button"
					onClick={onBackToLogin}
					className="mb-3 inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
				>
					<RiArrowLeftLine className="text-base" />
					Back to login
				</button>
				<h3 className="mb-1 text-2xl font-bold text-gray-900">
					Forgot password?
				</h3>
				<p className="text-sm text-gray-400">
					Enter your email and we'll send you a link to reset your
					password.
				</p>
			</div>

			{error && (
				<div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
					{error}
				</div>
			)}

			{/* Email */}
			<div className="group relative">
				<RiMailLine className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
				<input
					type="email"
					placeholder="Email address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pr-4 pl-11 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				className="cursor-pointer rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? "Sending..." : "Send Reset Link"}
			</button>
		</form>
	);
}
