import { useState, useEffect } from "react";
import { NubbleReaderV2 } from "@/components/NubbleReaderV2";
import { sampleDocument } from "@/lib/sample-content";

export default function HomeV2() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return <NubbleReaderV2 document={sampleDocument} />;
}
