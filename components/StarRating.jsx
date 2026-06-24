"use client";
import { useState } from "react";
import Icon from "./Icon";

export default function StarRating({ value = 0, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`cursor-pointer ${n <= active ? "text-gold-500" : "text-ink-200"}`}
        >
          <Icon name="star" size={20} fill={n <= active ? "currentColor" : "none"} strokeWidth={n <= active ? 0 : 2} />
        </span>
      ))}
    </div>
  );
}
