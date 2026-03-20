import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, Send, CheckCircle2 } from "lucide-react";

export default function ImportPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("nubble.me beta access request");
    const body = encodeURIComponent(`${message}\n\n— ${email}`);
    window.open(`mailto:ceo@xclv.com?subject=${subject}&body=${body}`, "_self");
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Import Document
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a PDF, ePub, or text file to create a multi-depth reading experience
          </p>
        </div>

        {/* Disabled upload area */}
        <div className="border-2 border-dashed rounded-xl p-10 text-center opacity-30 cursor-not-allowed select-none">
          <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">
            File upload
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, ePub, TXT — coming soon
          </p>
        </div>

        {/* Beta notice */}
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-center">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            This feature is burning API tokens.
          </p>
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            Available for beta testers now.
          </p>
        </div>

        {/* Contact form */}
        <div className="mt-8">
          <h2 className="text-base font-medium text-foreground text-center mb-4">
            Drop me a line
          </h2>

          {sent ? (
            <div className="border rounded-xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p className="text-sm font-medium text-foreground">Thanks! I'll get back to you.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                required
                placeholder="What are you working on? Why do you want beta access?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Request
              </button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to feed
          </button>
        </div>
      </div>
    </div>
  );
}
