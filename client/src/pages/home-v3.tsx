import { useState, useEffect } from "react";
import { NubbleReaderV3 } from "@/components/NubbleReaderV3";
import { sampleDocument } from "@/lib/sample-content";

export default function HomeV3() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return <NubbleReaderV3 document={sampleDocument} />;
}
