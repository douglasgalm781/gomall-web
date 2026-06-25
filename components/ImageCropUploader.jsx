"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export function Cropper({ file, aspect, maxWidth, onCropped, onCancel }) {
  const imgRef  = useRef(null);
  const dragRef = useRef(null);

  const [url,    setUrl]    = useState(null);
  const [nat,    setNat]    = useState(null);
  const [frame,  setFrame]  = useState({ fw: 320, fh: 400 });
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy,   setBusy]   = useState(false);
  // "cover" = fill frame & crop edges · "contain" = show the whole image (letterboxed)
  const [mode,   setMode]   = useState("cover");

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setNat(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (typeof window !== "undefined") {
      const avW = Math.min(window.innerWidth - 80, 420);
      const avH = Math.max(200, window.innerHeight - 300);
      let fw = avW;
      let fh = Math.round(fw / aspect);
      if (fh > avH) { fh = avH; fw = Math.round(fh * aspect); }
      fw = Math.max(fw, 80);
      fh = Math.round(fw / aspect);
      setFrame({ fw, fh });
    }
    return () => URL.revokeObjectURL(u);
  }, [file, aspect]);

  const { fw, fh } = frame;

  // Base scale: cover fills the frame (crops edges); contain fits the whole image.
  const bs = nat
    ? (mode === "contain" ? Math.min(fw / nat.w, fh / nat.h) : Math.max(fw / nat.w, fh / nat.h))
    : 1;
  const ds = bs * zoom;

  // Keep image covering the crop frame at all times
  function clamp(x, y, scale) {
    if (!nat) return { x, y };
    const iW = nat.w * scale;
    const iH = nat.h * scale;
    return {
      x: iW <= fw ? (fw - iW) / 2 : Math.min(0, Math.max(fw - iW, x)),
      y: iH <= fh ? (fh - iH) / 2 : Math.min(0, Math.max(fh - iH, y)),
    };
  }

  function onImgLoad(e) {
    const nw = e.currentTarget.naturalWidth;
    const nh = e.currentTarget.naturalHeight;
    setNat({ w: nw, h: nh });
    const bsInit = mode === "contain" ? Math.min(fw / nw, fh / nh) : Math.max(fw / nw, fh / nh);
    setZoom(1);
    setOffset({ x: (fw - nw * bsInit) / 2, y: (fh - nh * bsInit) / 2 });
  }

  // Toggle crop/fit, re-centering the image at the new base scale.
  function switchMode(m) {
    if (m === mode) return;
    setMode(m);
    if (!nat) return;
    const base = m === "contain" ? Math.min(fw / nat.w, fh / nat.h) : Math.max(fw / nat.w, fh / nat.h);
    setZoom(1);
    setOffset({ x: (fw - nat.w * base) / 2, y: (fh - nat.h * base) / 2 });
  }

  function onPointerDown(e) {
    if (!nat) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    setOffset(clamp(
      dragRef.current.ox + e.clientX - dragRef.current.x,
      dragRef.current.oy + e.clientY - dragRef.current.y,
      ds,
    ));
  }
  function onPointerUp() { dragRef.current = null; }

  function onZoom(z) {
    if (!nat) return;
    const oldDs = bs * zoom;
    const newDs = bs * z;
    const cx = fw / 2;
    const cy = fh / 2;
    setOffset(clamp(
      cx - ((cx - offset.x) / oldDs) * newDs,
      cy - ((cy - offset.y) / oldDs) * newDs,
      newDs,
    ));
    setZoom(z);
  }

  async function apply() {
    if (!nat || busy) return;
    setBusy(true);
    try {
      // Render the frame exactly as shown: output matches the crop frame's
      // aspect, the image is drawn at its on-screen position/scale, and any
      // area not covered (fit mode letterbox) is filled white.
      const outW = maxWidth;
      const outH = Math.round(outW / aspect);
      const s = outW / fw; // frame px → output px

      const canvas = document.createElement("canvas");
      canvas.width  = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        imgRef.current,
        0, 0, nat.w, nat.h,
        offset.x * s, offset.y * s, nat.w * ds * s, nat.h * ds * s,
      );

      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
      if (!blob) throw new Error("crop failed");
      onCropped(blob, URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(12,10,7,0.92)", backdropFilter: "blur(8px)" }}>
      <div className="bg-[#1c1610] rounded-2xl border border-gold-400/15 shadow-2xl w-full max-w-md flex flex-col max-h-[95vh]">

        <div className="px-5 pt-4 pb-3 border-b border-gold-400/10 flex items-center justify-between shrink-0">
          <h3 className="serif text-[16px] font-bold text-ivory">Crop Image</h3>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ivory/40 hover:text-ivory hover:bg-white/8 transition">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-center">
            {/* Container IS the crop frame — overflow:hidden clips the rest */}
            <div
              className="relative overflow-hidden rounded-xl touch-none select-none cursor-grab active:cursor-grabbing"
              style={{ width: fw, height: fh, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.5)" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRef}
                  src={url}
                  alt=""
                  onLoad={onImgLoad}
                  draggable={false}
                  className="absolute max-w-none pointer-events-none"
                  style={{
                    width:  nat ? nat.w * ds : "auto",
                    height: nat ? nat.h * ds : "auto",
                    left: offset.x,
                    top:  offset.y,
                  }}
                />
              )}

              {/* Rule-of-thirds guide lines */}
              {nat && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
                </div>
              )}

              {!nat && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Crop / Fit toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex bg-white/5 rounded-lg p-1 gap-1">
              <button type="button" onClick={() => switchMode("cover")}
                className={`px-3 h-8 rounded-md text-[12px] font-semibold transition ${mode === "cover" ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900" : "text-ivory/55 hover:text-ivory"}`}>
                Crop to fill
              </button>
              <button type="button" onClick={() => switchMode("contain")}
                className={`px-3 h-8 rounded-md text-[12px] font-semibold transition ${mode === "contain" ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900" : "text-ivory/55 hover:text-ivory"}`}>
                Fit whole image
              </button>
            </div>
          </div>

          <p className="text-[11px] text-ivory/40 text-center">
            {mode === "contain"
              ? "The full image is shown on a white background · zoom / drag to adjust"
              : "Drag to reposition · zoom slider to resize"}
          </p>

          <div className="flex items-center gap-3">
            <Icon name="search" size={14} className="text-ivory/30 shrink-0" />
            <input
              type="range" min="1" max="4" step="0.01"
              value={zoom}
              disabled={!nat}
              onChange={(e) => onZoom(Number(e.target.value))}
              className="flex-1 accent-gold-500"
            />
            <span className="text-[11px] text-ivory/30 w-8 text-right">{zoom.toFixed(1)}×</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onCancel}
              className="flex-1 h-11 rounded-xl border border-gold-400/20 text-ivory/60 text-[13px] hover:text-ivory hover:border-gold-400/40 transition">
              Cancel
            </button>
            <button onClick={apply} disabled={busy || !nat}
              className="flex-1 h-11 rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 font-semibold text-[13px] disabled:opacity-50">
              {busy ? "Cropping…" : "Crop & Use"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageCropUploader({
  value,
  label    = "Upload Image",
  aspect   = 4 / 5,
  maxWidth = 1000,
  onCrop,
}) {
  const fileRef  = useRef(null);
  const [cropFile, setCropFile] = useState(null);

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = "";
    setCropFile(f);
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative rounded-2xl border-2 border-dashed border-gold-400/30 hover:border-gold-400/60 bg-white/3 flex flex-col items-center justify-center overflow-hidden transition group w-full"
        style={{ aspectRatio: aspect }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ivory/30 group-hover:text-ivory/60 transition pointer-events-none">
            <Icon name="upload" size={24} />
            <span className="text-[11px] font-medium">{label}</span>
          </div>
        )}
        {value && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <Icon name="edit" size={20} className="text-white" />
          </div>
        )}
      </button>

      {cropFile && (
        <Cropper
          file={cropFile}
          aspect={aspect}
          maxWidth={maxWidth}
          onCropped={(blob, preview) => { setCropFile(null); onCrop(blob, preview); }}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}
