"use client";
import { useState } from "react";

// Renders a CDN photo over a jewel gradient. If the image fails to load,
// the gradient + optional label remain — so the UI never shows a broken image.
export default function LuxImage({ src, alt = "", className = "", rounded = "", label }) {
  const [ok, setOk] = useState(true);
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-gold-100 via-cream to-ink-100 ${rounded} ${className}`}
    >
      {src && ok && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setOk(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {(!src || !ok) && label && (
        <div className="absolute inset-0 flex items-center justify-center serif text-gold-600/70 text-sm tracking-widest">
          {label}
        </div>
      )}
    </div>
  );
}
