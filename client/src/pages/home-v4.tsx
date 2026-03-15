import { useState, useEffect } from "react";
import { NubbleReaderV4 } from "@/components/NubbleReaderV4";
import { sampleDocument } from "@/lib/sample-content";

export default function HomeV4() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return <NubbleReaderV4 document={sampleDocument} />;
}
