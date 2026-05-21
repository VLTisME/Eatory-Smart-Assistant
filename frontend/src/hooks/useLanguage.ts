import { useState, useEffect, useCallback } from "react";

export type AppLanguage = "vi" | "en";

export const APP_LANGUAGE_STORAGE_KEY = "homepage_lang";

export function normalizeLanguage(value: unknown): AppLanguage {
	return value === "en" ? "en" : "vi";
}

export function getOppositeLanguage(lang: AppLanguage): AppLanguage {
	return lang === "vi" ? "en" : "vi";
}

export function useLanguage() {
	const [lang, setLangState] = useState<AppLanguage>(() => {
		return normalizeLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY));
	});

	useEffect(() => {
		const handleLangChange = (e: Event) => {
			const customEvent = e as CustomEvent<AppLanguage>;
			setLangState(normalizeLanguage(customEvent.detail));
		};

		window.addEventListener("langChange", handleLangChange);
		return () => {
			window.removeEventListener("langChange", handleLangChange);
		};
	}, []);

	const setLang = useCallback((newLang: AppLanguage) => {
		const normalizedLang = normalizeLanguage(newLang);
		localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalizedLang);
		setLangState(normalizedLang);
		window.dispatchEvent(
			new CustomEvent("langChange", { detail: normalizedLang }),
		);
	}, []);

	return { lang, setLang };
}
