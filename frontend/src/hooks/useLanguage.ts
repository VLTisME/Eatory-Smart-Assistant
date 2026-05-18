import { useState, useEffect, useCallback } from "react";

export function useLanguage() {
	const [lang, setLangState] = useState<"vi" | "en">(() => {
		return (localStorage.getItem("homepage_lang") as "vi" | "en") || "vi";
	});

	useEffect(() => {
		const handleLangChange = (e: Event) => {
			const customEvent = e as CustomEvent<"vi" | "en">;
			setLangState(customEvent.detail);
		};

		window.addEventListener("langChange", handleLangChange);
		return () => {
			window.removeEventListener("langChange", handleLangChange);
		};
	}, []);

	const setLang = useCallback((newLang: "vi" | "en") => {
		localStorage.setItem("homepage_lang", newLang);
		setLangState(newLang);
		window.dispatchEvent(new CustomEvent("langChange", { detail: newLang }));
	}, []);

	return { lang, setLang };
}
