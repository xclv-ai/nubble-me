import { useState, useEffect } from "react";
import { NubbleReader } from "@/components/NubbleReader";
import { sampleDocument } from "@/lib/sample-content";

export default function Home() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return <NubbleReader document={sampleDocument} />;
}
