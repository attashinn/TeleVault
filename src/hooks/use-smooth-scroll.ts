import { useEffect } from "react";
import { animate } from "framer-motion";

/**
 * Intercepts wheel and touch events and replaces native scrolling with a
 * framer-motion spring animation — giving the page a smooth, inertia-based feel.
 *
 * Drop-in: just call this hook once at the root level. No wrapper element needed.
 */
export function useSmoothScroll() {
  useEffect(() => {
    let current = window.scrollY;
    let target = window.scrollY;
    let rafId: number | undefined;
    let controls: ReturnType<typeof animate> | null = null;

    const clamp = (v: number) =>
      Math.max(0, Math.min(v, document.body.scrollHeight - window.innerHeight));

    const scrollTo = (next: number) => {
      target = clamp(next);
      controls?.stop();
      controls = animate(current, target, {
        type: "spring",
        stiffness: 80,
        damping: 20,
        mass: 0.8,
        restDelta: 0.5,
        onUpdate: (v) => {
          current = v;
          window.scrollTo(0, v);
        },
      });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollTo(target + e.deltaY);
    };

    // Touch support
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      scrollTo(target + delta * 2);
    };

    // Keep internal state in sync with programmatic scrolls (router, anchors)
    const onScroll = () => {
      current = window.scrollY;
      target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      controls?.stop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
}
