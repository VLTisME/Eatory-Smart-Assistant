/**
 * usePlaceSearch — custom hook encapsulating debounce, abort-controller,
 * client-side caching, and keyboard navigation for place autocomplete.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
    searchPlaces,
    type AutocompleteResponse,
    type PlacePrediction,
} from "../services/placeSearchAPI";

// ── Client-side result cache (persists across re-renders / re-mounts) ───────
const resultCache = new Map<string, PlacePrediction[]>();

interface UsePlaceSearchOptions {
    debounceMs?: number;
    limit?: number;
    location?: string;
}

export function usePlaceSearch(opts: UsePlaceSearchOptions = {}) {
    const { debounceMs = 400, limit = 10, location } = opts;

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Fetch logic ──────────────────────────────────────────────────────────
    const fetchResults = useCallback(
        async (text: string) => {
            // Abort previous in-flight request
            abortRef.current?.abort();

            if (!text.trim()) {
                setResults([]);
                setIsOpen(false);
                setIsLoading(false);
                return;
            }

            // Client-side cache hit?
            const cacheKey = `${text.trim().toLowerCase()}|${limit}|${location ?? ""}`;
            const cached = resultCache.get(cacheKey);
            if (cached) {
                setResults(cached);
                setIsOpen(cached.length > 0);
                setActiveIndex(-1);
                setIsLoading(false);
                setError(null);
                return;
            }

            const controller = new AbortController();
            abortRef.current = controller;
            setIsLoading(true);
            setError(null);

            try {
                const data: AutocompleteResponse = await searchPlaces(text, {
                    limit,
                    location,
                    signal: controller.signal,
                });

                // Only apply if this controller is still the active one
                if (!controller.signal.aborted) {
                    const preds = data.predictions ?? [];
                    resultCache.set(cacheKey, preds);
                    setResults(preds);
                    setIsOpen(true);
                    setActiveIndex(-1);
                }
            } catch (err: unknown) {
                if ((err as Error)?.name === "AbortError") return; // expected — ignore
                console.error("Place search error:", err);
                setError("Lỗi tìm kiếm. Vui lòng thử lại.");
                setResults([]);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [limit, location],
    );

    // ── Debounced query watcher ──────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        // Show loading immediately so UX feels responsive
        setIsLoading(true);

        debounceRef.current = setTimeout(() => {
            fetchResults(query);
        }, debounceMs);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, debounceMs, fetchResults]);

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // ── Public helpers ───────────────────────────────────────────────────────
    const clear = useCallback(() => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        setActiveIndex(-1);
        setError(null);
        setIsLoading(false);
        abortRef.current?.abort();
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setActiveIndex(-1);
    }, []);

    return {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        activeIndex,
        setActiveIndex,
        error,
        clear,
        close,
    };
}
