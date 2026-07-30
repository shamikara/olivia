"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Sections that ease in as they come into view. */
const REVEAL = ".reveal";

/**
 * Drives momentum scrolling with Lenis and reveals sections with GSAP.
 *
 * Both are decorative, so visitors who ask for reduced motion get plain native
 * scrolling and fully visible content instead.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reveals start from JS, never from CSS, so a failed script can't leave the
    // page blank — without GSAP the sections simply render as normal.
    const context = gsap.context(() => {
      if (prefersReducedMotion) return;

      gsap.utils.toArray<HTMLElement>(REVEAL).forEach((element) => {
        gsap.from(element, {
          opacity: 0,
          y: 34,
          duration: 0.9,
          ease: "power2.out",
          // Drop the inline transform afterwards; a lingering one would create a
          // containing block and break any sticky child.
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            once: true,
          },
        });
      });
    });

    if (prefersReducedMotion) {
      ScrollTrigger.refresh();
      return () => context.revert();
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Momentum on a touchscreen fights the platform's own scrolling.
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      context.revert();
    };
  }, [pathname]);

  return null;
}
