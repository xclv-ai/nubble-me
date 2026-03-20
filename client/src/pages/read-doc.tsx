import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function ReadDocPage() {
  const [, params] = useRoute("/read-doc/:id");
  const [, setLocation] = useLocation();
  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;

    const fetchDoc = async () => {
      const { data, error: dlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(`${params.id}.json`);

      if (dlError || !data) {
        setError("Document not found");
        setLoading(false);
        return;
      }

      try {
        const text = await data.text();
        const doc: ContentDocument = JSON.parse(text);
        setDocument(doc);
      } catch {
        setError("Failed to parse document");
      }
      setLoading(false);
    };

    fetchDoc();
  }, [params?.id]);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document && window.document.documentElement.classList.toggle("dark", isDark);
  }, [document]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">{error || "Document not found"}</p>
          <button
            onClick={() => setLocation("/import")}
            className="text-sm text-primary hover:underline"
          >
            Import a document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <NubbleReader document={document} />
    </div>
  );
}
