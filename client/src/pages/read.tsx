import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { NubbleReader } from "@/components/NubbleReader";
import type { ContentDocument } from "@/lib/sample-content";
import { Loader2 } from "lucide-react";

export default function ReadPage() {
  const [, params] = useRoute("/read/:id");
  const [, setLocation] = useLocation();
  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;

    fetch(`/api/documents/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Document not found");
        return res.json();
      })
      .then((data: ContentDocument) => {
        setDocument(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
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
