"use client";
import { useState } from "react";
import { BACKGROUND_IMAGE } from "@/lib/data";

// Full-screen ambient luxury background: a faint warm marble photo washed with
// cream so the light theme stays bright and content stays readable. Sits behind
// all content (z-0); falls back to the cream gradient if the image fails.
export default function BackgroundImage() {
  const [ok, setOk] = useState(true);
  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full lg:max-w-app z-0 pointer-events-none overflow-hidden">
      {ok && (
        <img
          src={BACKGROUND_IMAGE}
          alt=""
          aria-hidden="true"
          onError={() => setOk(false)}
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-[2px] opacity-[0.16] mix-blend-multiply"
        />
      )}
      {/* cream wash for brightness + legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream/70 via-cream/55 to-cream/85" />
      {/* warm gold glow from the top + soft light vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 36% at 50% -6%, rgba(176,132,44,0.12), transparent 70%), radial-gradient(120% 80% at 50% 44%, transparent 52%, rgba(120,96,40,0.10) 100%)",
        }}
      />
    </div>
  );
}
