import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  const url =
    "https://suggestqueries.google.com/complete/search" +
    `?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  const text = await res.text();

  // Strip JSONP wrapper safely
  const json = JSON.parse(
    text.replace(/^window\.google\.ac\.h\(/, "").replace(/\)$/, "")
  );

  const suggestions = json[1];

  if (!Array.isArray(suggestions)) return [];

  return suggestions
    .map((item: any) => item?.[0])
    .filter((s: any): s is string => typeof s === "string")
    .slice(0, 6);
}
