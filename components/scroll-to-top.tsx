"use client";

import {useEffect, useState} from "react";
import {ArrowUp} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, {passive: true});
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{opacity: 0, y: 16, scale: 0.9}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 8, scale: 0.9}}
          transition={{duration: 0.2}}
          className="fixed right-4 bottom-24 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--rp-border)] bg-[var(--rp-card)] text-[var(--rp-ink)] shadow-lg hover:bg-[var(--rp-surface)]"
          onClick={() => window.scrollTo({top: 0, behavior: "smooth"})}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
