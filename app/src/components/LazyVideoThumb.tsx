import { useEffect, useRef, useState } from "react";

// Miniatura de video que solo empieza a cargar cuando entra al viewport.
// Con 378 clips en el catálogo, cargarlos todos de una sería pesado incluso
// siendo cada uno chico; esto hace que solo bajen los que San realmente ve.
export function LazyVideoThumb({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="catalog-thumb">
      {visible ? (
        <video
          src={`${import.meta.env.BASE_URL}${src}`}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          aria-label={alt}
        />
      ) : (
        <div className="catalog-thumb__placeholder" />
      )}
    </div>
  );
}
