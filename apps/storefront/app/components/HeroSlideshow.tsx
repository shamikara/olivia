"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  "/images/olivia-hero.png",
  "/images/bg_champagne_silk_waves.png",
  "/images/bg_luxury_serum_droplets.png",
  "/images/bg_dewy_water_ripple.png",
  "/images/bg_botanical_glow_abstract.png",
  "/images/bg_minimal_glassmorphism_glow.png",
];

const HOLD_MS = 5000;

/**
 * Crossfades the hero backdrop.
 *
 * Slides only get a background-image once they are about to be shown, so the
 * page doesn't pull several megabytes of artwork on first paint. Reduced-motion
 * visitors still get the rotation — only the slow zoom is dropped (see the
 * stylesheet), since a plain fade is not the kind of movement that needs
 * suppressing.
 */
export function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<number[]>([0, 1]);
  const timer = useRef<number | undefined>(undefined);

  const schedule = useCallback(() => {
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, HOLD_MS);
  }, []);

  useEffect(() => {
    schedule();
    return () => window.clearInterval(timer.current);
  }, [schedule]);

  // Keep the next slide warm so a crossfade never reveals a half-loaded image.
  useEffect(() => {
    const next = (index + 1) % SLIDES.length;
    setLoaded((current) => (current.includes(next) ? current : [...current, next]));
  }, [index]);

  const show = (position: number) => {
    setIndex(position);
    setLoaded((current) => (current.includes(position) ? current : [...current, position]));
    schedule(); // restart the dwell so a manual pick isn't cut short
  };

  return (
    <>
      <div className="hero-slides" aria-hidden="true">
        {SLIDES.map((src, position) => (
          <div
            key={src}
            className="hero-slide"
            data-active={position === index}
            style={loaded.includes(position) ? { backgroundImage: `url("${src}")` } : undefined}
          />
        ))}
      </div>

      <div className="hero-dots" role="tablist" aria-label="Hero background">
        {SLIDES.map((src, position) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={position === index}
            aria-label={`Show background ${position + 1} of ${SLIDES.length}`}
            data-active={position === index}
            onClick={() => show(position)}
          />
        ))}
      </div>
    </>
  );
}
