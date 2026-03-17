import { useState, useCallback, useRef, useEffect, forwardRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Sun, Moon, Minus, Plus, Upload, Newspaper } from "lucide-react";
import { useLocation } from "wouter";
import type { ContentDocument, ContentSection } from "@/lib/sample-content";

type DepthLevel = 0 | 1 | 2 | 3;
const DEPTH_LABELS = ["Summary", "Condensed", "Standard", "Expanded"] as const;
const DEPTH_KEYS: (keyof ContentSection)[] = ["summary", "condensed", "standard", "expanded"];

/* ─── Easing constants ─── */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;
const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 };
const SPRING_GENTLE = { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 };
const SPRING_REVEAL = { type: "spring" as const, stiffness: 80, damping: 20, mass: 1.2 };

/* ─── Helpers ─── */

/** Average reading speed: ~230 words/minute */
function estimateReadingTime(doc: ContentDocument, depthKey: keyof ContentSection): number {
  const totalWords = doc.sections.reduce((sum, s) => {
    const text = s[depthKey] as string;
    return sum + text.split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.round(totalWords / 230));
}

interface NubbleReaderProps {
  document: ContentDocument;
}

export function NubbleReader({ document: doc }: NubbleReaderProps) {
  const [, setLocation] = useLocation();
  const [globalDepth, setGlobalDepth] = useState<DepthLevel>(2);
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, DepthLevel>>({});
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [activeSectionId, setActiveSectionId] = useState<string>(doc.sections[0]?.id ?? "");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const [boundaryFlash, setBoundaryFlash] = useState<"min" | "max" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ─── [4] Reading time ─── */
  const readingTime = useMemo(() => {
    return estimateReadingTime(doc, DEPTH_KEYS[globalDepth] as keyof ContentSection);
  }, [doc, globalDepth]);

  // Theme toggle with smooth color transition
  const toggleTheme = useCallback(() => {
    document.body.classList.add("theme-transitioning");
    setIsDark(prev => !prev);
    setTimeout(() => {
      document.body.classList.remove("theme-transitioning");
    }, 550);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Track which section is most visible + [3] scroll progress
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const containerRect = el.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.35;
      let closest = doc.sections[0]?.id ?? "";
      let closestDist = Infinity;

      for (const section of doc.sections) {
        const ref = sectionRefs.current[section.id];
        if (!ref) continue;
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const dist = Math.abs(sectionCenter - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = section.id;
        }
      }
      setActiveSectionId(closest);

      // [3] Progress
      const scrollable = el.scrollHeight - el.clientHeight;
      setScrollProgress(scrollable > 0 ? el.scrollTop / scrollable : 0);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [doc.sections]);

  const getDepth = useCallback((sectionId: string): DepthLevel => {
    return sectionOverrides[sectionId] ?? globalDepth;
  }, [globalDepth, sectionOverrides]);

  /* ─── [2] Boundary feedback ─── */
  const flashBoundary = useCallback((type: "min" | "max") => {
    setBoundaryFlash(type);
    setTimeout(() => setBoundaryFlash(null), 400);
  }, []);

  const changeSectionDepth = useCallback((sectionId: string, delta: number) => {
    const current = sectionOverrides[sectionId] ?? globalDepth;
    const next = Math.max(0, Math.min(3, current + delta)) as DepthLevel;
    if (next !== current) {
      setSectionOverrides(prev => ({ ...prev, [sectionId]: next }));
    } else {
      // [2] Hit boundary
      flashBoundary(delta < 0 ? "min" : "max");
    }
  }, [globalDepth, sectionOverrides, flashBoundary]);

  const changeGlobalDepth = useCallback((delta: number) => {
    setGlobalDepth(prev => {
      const next = Math.max(0, Math.min(3, prev + delta)) as DepthLevel;
      if (next !== prev) {
        setSectionOverrides({});
        return next;
      }
      // [2] Hit boundary
      flashBoundary(delta < 0 ? "min" : "max");
      return prev;
    });
  }, [flashBoundary]);

  // Keyboard: left/right = active section depth, shift+left/right = global
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        if (e.key === "ArrowLeft") { e.preventDefault(); changeGlobalDepth(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); changeGlobalDepth(1); }
      } else {
        if (e.key === "ArrowLeft") { e.preventDefault(); changeSectionDepth(activeSectionId, -1); }
        if (e.key === "ArrowRight") { e.preventDefault(); changeSectionDepth(activeSectionId, 1); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeSectionId, changeSectionDepth, changeGlobalDepth]);

  /* ─── [10] Pinch-to-zoom gesture ─── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let initialDistance = 0;
    let pinchActive = false;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchActive = true;
        initialDistance = getDistance(e.touches);
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (pinchActive && e.changedTouches.length > 0) {
        const finalDistance = getDistance(e.touches.length >= 2 ? e.touches : e.changedTouches);
        const delta = finalDistance - initialDistance;
        if (Math.abs(delta) > 40) {
          changeGlobalDepth(delta > 0 ? 1 : -1);
        }
        pinchActive = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pinchActive && e.touches.length === 2) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [changeGlobalDepth]);

  const scrollToSection = useCallback((sectionId: string) => {
    const ref = sectionRefs.current[sectionId];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /* ─── [1] Mark first swipe done ─── */
  const handleFirstSwipe = useCallback(() => {
    if (!hasSwipedOnce) setHasSwipedOnce(true);
  }, [hasSwipedOnce]);

  /* ─── [5] Active section title for sticky label ─── */
  const activeSection = useMemo(() =>
    doc.sections.find(s => s.id === activeSectionId),
  [doc.sections, activeSectionId]);
  const activeSectionIndex = useMemo(() =>
    doc.sections.findIndex(s => s.id === activeSectionId),
  [doc.sections, activeSectionId]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* [2] Boundary flash overlay */}
      <AnimatePresence>
        {boundaryFlash && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className={`absolute inset-0 ${
              boundaryFlash === "max"
                ? "bg-gradient-to-l from-primary/8 to-transparent"
                : "bg-gradient-to-r from-primary/8 to-transparent"
            }`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex-shrink-0 h-12 px-5 flex items-center justify-between border-b border-border/40 relative" data-testid="header">
        {/* [3] Reading progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/25"
          style={{ originX: 0 }}
          animate={{ scaleX: scrollProgress }}
          transition={{ duration: 0.1, ease: "linear" }}
          data-testid="progress-bar"
        />

        <div className="flex items-center gap-2.5">
          <NubbleLogo />
          <span className="text-[11px] text-muted-foreground tracking-[0.15em] uppercase font-medium">nubble</span>
        </div>

        {/* Global depth control */}
        <div className="flex items-center gap-1.5" data-testid="global-depth-control">
          <button
            onClick={() => changeGlobalDepth(-1)}
            disabled={globalDepth === 0}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors duration-200 disabled:opacity-20"
            data-testid="global-depth-minus"
          >
            <Minus size={14} />
          </button>

          <DepthZoomIndicator
            depth={globalDepth}
            size="md"
            testIdPrefix="global"
          />

          <button
            onClick={() => changeGlobalDepth(1)}
            disabled={globalDepth === 3}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors duration-200 disabled:opacity-20"
            data-testid="global-depth-plus"
          >
            <Plus size={14} />
          </button>

          {/* Depth label + [4] reading time */}
          <div className="relative ml-0.5 hidden sm:flex items-center gap-2 h-4 overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={globalDepth}
                initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="text-[10px] text-muted-foreground/50 font-medium tracking-[0.15em] uppercase whitespace-nowrap"
              >
                {DEPTH_LABELS[globalDepth]}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={readingTime}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                className="text-[10px] text-muted-foreground/30 font-medium whitespace-nowrap"
              >
                {readingTime} min
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* [5] Sticky section label */}
          <AnimatePresence mode="popLayout">
            <motion.span
              key={activeSectionId}
              initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="text-[10px] text-muted-foreground/40 hidden md:inline font-medium tracking-wide whitespace-nowrap"
            >
              <span className="text-primary/50 font-semibold mr-1">{String(activeSectionIndex + 1).padStart(2, "0")}</span>
              {activeSection?.title}
            </motion.span>
          </AnimatePresence>
          <button
            onClick={() => setLocation("/digest")}
            className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors duration-200"
            title="AI News Feed"
            data-testid="feed-button"
          >
            <Newspaper size={15} />
          </button>
          <button
            onClick={() => setLocation("/import")}
            className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors duration-200"
            title="Import document"
            data-testid="import-button"
          >
            <Upload size={15} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors duration-200"
            data-testid="theme-toggle"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? "sun" : "moon"}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* [9] Section nav rail with tooltips */}
        <div className="flex-shrink-0 w-8 sm:w-10 flex flex-col items-center justify-center gap-1.5 py-4" data-testid="section-nav">
          {doc.sections.map((section, i) => (
            <div key={section.id} className="relative group/nav">
              <motion.button
                onClick={() => scrollToSection(section.id)}
                className="rounded-full bg-primary"
                animate={{
                  width: 6,
                  height: section.id === activeSectionId ? 20 : 6,
                  opacity: section.id === activeSectionId ? 1 : 0.15,
                }}
                whileHover={{ opacity: section.id === activeSectionId ? 1 : 0.4 }}
                transition={SPRING_SNAPPY}
                aria-label={`Jump to: ${section.title}`}
                data-testid={`section-dot-${i}`}
              />
              {/* [9] Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 z-30">
                <div className="bg-foreground/90 text-background text-[9px] font-medium px-2 py-1 rounded whitespace-nowrap shadow-lg">
                  {section.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable content — smooth scroll */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="max-w-[660px] mx-auto px-4 sm:px-6 pt-8 pb-24">
            {/* Document title */}
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            >
              <h1
                className="text-xl font-medium text-foreground mb-1 leading-snug"
                style={{ fontFamily: "var(--font-serif)" }}
                data-testid="doc-title"
              >
                {doc.title}
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground/50 font-medium">{doc.author}</p>
                {/* [4] Mobile reading time */}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={readingTime}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="sm:hidden text-xs text-muted-foreground/30 font-medium"
                  >
                    {readingTime} min read
                  </motion.span>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Sections — all visible, scrollable */}
            {doc.sections.map((section, i) => (
              <SectionBlock
                key={section.id}
                section={section}
                index={i}
                total={doc.sections.length}
                depth={getDepth(section.id)}
                globalDepth={globalDepth}
                isOverridden={section.id in sectionOverrides}
                isActive={section.id === activeSectionId}
                isFirst={i === 0}
                hasSwipedOnce={hasSwipedOnce}
                scrollRoot={scrollRef}
                onChangeDepth={(delta) => changeSectionDepth(section.id, delta)}
                onResetToGlobal={() => setSectionOverrides(prev => {
                  const next = { ...prev };
                  delete next[section.id];
                  return next;
                })}
                onFirstSwipe={handleFirstSwipe}
                ref={(el: HTMLDivElement | null) => { sectionRefs.current[section.id] = el; }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 h-9 px-3 sm:px-5 flex items-center justify-between border-t border-border/40" data-testid="footer">
        {/* Mobile hints */}
        <div className="flex sm:hidden items-center gap-2 text-[9px] text-muted-foreground/40 tracking-wide overflow-hidden">
          <span className="whitespace-nowrap">scroll to read</span>
          <span className="w-px h-2.5 bg-border/30 flex-shrink-0" />
          <span className="whitespace-nowrap">swipe for depth</span>
          <span className="w-px h-2.5 bg-border/30 flex-shrink-0" />
          <span className="whitespace-nowrap">pinch to zoom</span>
        </div>
        {/* Desktop hints */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground/40 tracking-wide">
          <span>scroll to read</span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1.5 h-4 rounded bg-muted/50 text-muted-foreground/60 text-[9px] font-mono leading-none">
              &#8592;&#8594;
            </kbd>
            section depth
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center justify-center px-1 h-4 rounded bg-muted/50 text-muted-foreground/60 text-[9px] font-mono leading-none">
              &#8679;
            </kbd>
            <kbd className="inline-flex items-center justify-center px-1.5 h-4 rounded bg-muted/50 text-muted-foreground/60 text-[9px] font-mono leading-none">
              &#8592;&#8594;
            </kbd>
            global
          </span>
          <span className="hidden md:inline">or swipe</span>
        </div>
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors duration-200 flex-shrink-0 ml-2"
        >
          <span className="hidden sm:inline">Created with Perplexity Computer</span>
          <span className="sm:hidden">Perplexity</span>
        </a>
      </footer>
    </div>
  );
}

/* ─── Depth Zoom Indicator ─── */

interface DepthZoomIndicatorProps {
  depth: DepthLevel;
  size: "sm" | "md";
  testIdPrefix: string;
}

function DepthZoomIndicator({ depth, size, testIdPrefix }: DepthZoomIndicatorProps) {
  const unit = size === "md" ? 8 : 5;
  const borderRadius = size === "md" ? 2.5 : 1.5;
  const maxWidth = unit * 5;
  const widths = [unit, unit * 2.2, unit * 3.5, maxWidth];
  const activeWidth = widths[depth];

  return (
    <div
      className="relative pointer-events-none select-none flex items-center justify-center"
      style={{ width: maxWidth, height: unit }}
      data-testid={`${testIdPrefix}-depth-zoom`}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius,
          backgroundColor: "hsl(var(--primary) / 0.12)",
        }}
      />
      <motion.div
        className="relative"
        style={{ borderRadius }}
        animate={{
          width: activeWidth,
          height: unit,
          backgroundColor: "hsl(var(--primary) / 0.85)",
        }}
        transition={SPRING_SNAPPY}
        data-testid={`${testIdPrefix}-depth-bar`}
      />
    </div>
  );
}

/* ─── [1] Swipe Onboarding Overlay ─── */

function SwipeOnboarding() {
  return (
    <motion.div
      className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex items-center gap-2 bg-foreground/80 text-background px-4 py-2.5 rounded-full shadow-xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ delay: 0.8, ...SPRING_GENTLE }}
      >
        {/* Animated hand swipe */}
        <motion.span
          className="text-lg"
          animate={{ x: [0, 14, 0, -14, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        >
          👆
        </motion.span>
        <span className="text-[11px] font-medium tracking-wide">swipe to change depth</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Section Block ─── */

interface SectionBlockProps {
  section: ContentSection;
  index: number;
  total: number;
  depth: DepthLevel;
  globalDepth: DepthLevel;
  isOverridden: boolean;
  isActive: boolean;
  isFirst: boolean;
  hasSwipedOnce: boolean;
  scrollRoot: React.RefObject<HTMLDivElement | null>;
  onChangeDepth: (delta: number) => void;
  onResetToGlobal: () => void;
  onFirstSwipe: () => void;
}

const SectionBlock = forwardRef<HTMLDivElement, SectionBlockProps>(
  ({ section, index, total, depth, globalDepth, isOverridden, isActive, isFirst, hasSwipedOnce, scrollRoot, onChangeDepth, onResetToGlobal, onFirstSwipe }, ref) => {
    const rawX = useMotionValue(0);
    const x = useSpring(rawX, { stiffness: 300, damping: 28, mass: 0.6 });
    const rotate = useTransform(rawX, [-200, 0, 200], [-1.5, 0, 1.5]);
    const scale = useTransform(rawX, [-200, 0, 200], [0.985, 1, 0.985]);

    const handleDragEnd = useCallback((_: any, info: PanInfo) => {
      const threshold = 50;
      const vThreshold = 180;
      if (info.offset.x > threshold || info.velocity.x > vThreshold) {
        onChangeDepth(1);
        onFirstSwipe();
      } else if (info.offset.x < -threshold || info.velocity.x < -vThreshold) {
        onChangeDepth(-1);
        onFirstSwipe();
      }
      rawX.set(0);
    }, [onChangeDepth, onFirstSwipe, rawX]);

    const contentText = section[DEPTH_KEYS[depth] as keyof ContentSection] as string;
    const paragraphs = contentText.split("\n\n");

    /* ─── [8] Visual density per depth ─── */
    const textStyle = useMemo(() => {
      switch (depth) {
        case 0: return "text-[15.5px] text-foreground font-medium leading-[1.8]";
        case 1: return "text-[14.5px] text-foreground/85 leading-[1.75]";
        case 2: return "text-[14px] text-foreground/80 leading-[1.7]";
        case 3: return "text-[13.5px] text-foreground/75 leading-[1.65]";
      }
    }, [depth]);

    return (
      <motion.div
        ref={ref}
        className="relative mb-1 scroll-mt-6 group"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ root: scrollRoot, once: true, amount: 0.15 }}
        transition={SPRING_REVEAL}
        data-testid={`section-block-${index}`}
      >
        {/* [1] Onboarding overlay — only on first section, before first swipe */}
        <AnimatePresence>
          {isFirst && !hasSwipedOnce && isActive && (
            <SwipeOnboarding />
          )}
        </AnimatePresence>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x, rotate, scale }}
          className="cursor-grab active:cursor-grabbing touch-pan-y origin-center"
          data-testid={`swipeable-${index}`}
        >
          <motion.div
            className="relative rounded-lg px-4 sm:px-5 py-4"
            animate={{
              backgroundColor: isActive ? "hsl(var(--card) / 0.6)" : "hsl(var(--card) / 0)",
            }}
            transition={{ duration: 0.4, ease: EASE_IN_OUT }}
          >
            {/* Section meta row */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary/70 font-semibold tracking-[0.2em] uppercase">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <AnimatePresence>
                  {isOverridden && (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                    >
                      <span className="w-px h-2.5 bg-border/60" />
                      <span className="text-[9px] text-primary/50 tracking-wider uppercase font-medium">
                        {DEPTH_LABELS[depth]}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Per-section depth indicator */}
              <motion.div
                className="flex items-center gap-1.5"
                animate={{
                  opacity: isOverridden || isActive ? 1 : 0,
                }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <AnimatePresence>
                  {isOverridden && (
                    <motion.button
                      onClick={(e) => { e.stopPropagation(); onResetToGlobal(); }}
                      className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground mr-1 tracking-wider uppercase"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      data-testid={`reset-depth-${index}`}
                    >
                      reset
                    </motion.button>
                  )}
                </AnimatePresence>
                <DepthZoomIndicator
                  depth={depth}
                  size="sm"
                  testIdPrefix={`section-${index}`}
                />
              </motion.div>
            </div>

            {/* Title */}
            <h2
              className="font-serif text-lg font-medium mb-3 text-foreground leading-snug"
              style={{ fontFamily: "var(--font-serif)" }}
              data-testid={`section-title-${index}`}
            >
              {section.title}
            </h2>

            {/* [6] Content body — smoother height + staggered cascade */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${section.id}-${depth}`}
                initial={{ opacity: 0, filter: "blur(6px)", height: 0 }}
                animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)", height: 0 }}
                transition={{
                  opacity: { duration: 0.35, ease: EASE_OUT_EXPO },
                  height: { duration: 0.5, ease: EASE_OUT_EXPO },
                  filter: { duration: 0.3, ease: EASE_OUT_EXPO },
                }}
                className="overflow-hidden"
                data-testid={`content-body-${index}`}
              >
                {paragraphs.map((p, pi) => (
                  <motion.p
                    key={pi}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: pi * 0.08,
                      ease: EASE_OUT_EXPO,
                    }}
                    className={`mb-3 last:mb-0 ${textStyle}`}
                  >
                    {p}
                  </motion.p>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Swipe hint — fade in/out */}
            <AnimatePresence>
              {isActive && hasSwipedOnce && (
                <motion.div
                  className="flex items-center justify-between mt-3 select-none pointer-events-none"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.2, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                >
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground tracking-wider uppercase">
                    <ChevronsLeft size={10} />
                    <span>less</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground tracking-wider uppercase">
                    <span>more</span>
                    <ChevronsRight size={10} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Divider */}
        {index < total - 1 && (
          <div className="mx-5 my-1 border-t border-border/25" />
        )}
      </motion.div>
    );
  }
);

SectionBlock.displayName = "SectionBlock";

/* ─── Logo ─── */

function NubbleLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="nubble logo"
    >
      <rect x="3" y="5" width="12" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
      <rect x="9" y="5" width="12" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
