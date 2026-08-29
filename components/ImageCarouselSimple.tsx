"use client";

import { useEffect, useState } from "react";

export function ImageCarouselSimple({
  imagenes,
  aspectClass = "aspect-[4/5]",
  className = "",
}: {
  imagenes: { url: string; alt: string | null }[];
  aspectClass?: string;
  className?: string;
}) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (imagenes.length <= 1) return;
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, 5000);
    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  return (
    <div className={`relative overflow-hidden rounded-[28px] ${aspectClass} ${className}`}>
      {imagenes.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.url}
          src={img.url}
          alt={img.alt ?? ""}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === indice ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {imagenes.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {imagenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndice(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === indice ? "w-5 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
