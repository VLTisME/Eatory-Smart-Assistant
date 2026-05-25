import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionEventLike = Event & {
	results: Array<Array<{ transcript: string }>>;
};

type BrowserSpeechRecognition = {
	continuous: boolean;
	lang: string;
	interimResults: boolean;
	onresult: ((event: SpeechRecognitionEventLike) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
};

export const useVoiceRecognition = () => {
	const [text, setText] = useState<string>("");
	const [isListening, setIsListening] = useState<boolean>(false);
	const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const onResultRef = useRef<((transcript: string) => void) | null>(null);

	useEffect(() => {
		const SpeechRecognition = (window.SpeechRecognition ||
			window.webkitSpeechRecognition) as
			| (new () => BrowserSpeechRecognition)
			| undefined;
		if (!SpeechRecognition) return;

		const recognition = new SpeechRecognition();
		recognition.continuous = false;
		recognition.lang = "vi-VN";
		recognition.interimResults = false;

		recognition.onresult = (event: SpeechRecognitionEventLike) => {
			const transcript = event.results[0][0].transcript;
			setText(transcript);
			onResultRef.current?.(transcript);
		};
		recognition.onend = () => setIsListening(false);
		recognitionRef.current = recognition;

		return () => {
			recognition.stop();
			recognitionRef.current = null;
		};
	}, []);

	const startListening = useCallback(
		(onResult?: (transcript: string) => void) => {
			const recognition = recognitionRef.current;
			onResultRef.current = onResult ?? null;
			if (recognition) {
				recognition.start();
				setIsListening(true);
			}
		},
		[],
	);
	const stopListening = useCallback(() => {
		const recognition = recognitionRef.current;
		if (recognition) {
			recognition.stop();
			setIsListening(false);
		}
	}, []);

	return { text, isListening, startListening, stopListening };
};
