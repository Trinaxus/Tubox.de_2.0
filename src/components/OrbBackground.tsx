import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export type OrbSettings = {
  enabled: boolean;
  url: string;
  sizePx: number; // base size in px
  speedSec: number; // rotation speed
  opacity: number; // 0 - 1
  blend: 'normal' | 'screen' | 'overlay' | 'lighten' | 'soft-light';
  // CSS filter controls
  blurPx: number; // 0..200
  hueDeg: number; // -180..180
  saturatePct: number; // 0..300
  contrastPct: number; // 0..300
  brightnessPct: number; // 0..300
  grayscale: boolean;
  sepia: boolean;
  // Optional tint overlay
  tintColor: string; // #RRGGBB
  tintOpacity: number; // 0..1
  tintBlend: 'normal' | 'screen' | 'overlay' | 'soft-light' | 'multiply';
  enableOn: {
    index: boolean;
    gallery: boolean;
    blog: boolean;
    blogPost: boolean;
    admin: boolean;
  };
};

const DEFAULTS: OrbSettings = {
  enabled: true,
  url: 'https://tubox.de/TUBOX/server/uploads/2000/TOOLS/twisted-fold-v5_1024x1024-1-1.png?v=2025-09-15%2021%3A24%3A51',
  sizePx: 1600,
  speedSec: 200,
  opacity: 0.35,
  blend: 'screen',
  blurPx: 0,
  hueDeg: 0,
  saturatePct: 100,
  contrastPct: 100,
  brightnessPct: 100,
  grayscale: false,
  sepia: false,
  tintColor: '#ff3b30',
  tintOpacity: 0,
  tintBlend: 'soft-light',
  enableOn: { index: true, gallery: true, blog: true, blogPost: true, admin: true },
};

const STORAGE_KEY = 'orb_settings';

function readSettings(): OrbSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, enableOn: { ...DEFAULTS.enableOn, ...(parsed.enableOn || {}) } } as OrbSettings;
  } catch {
    return DEFAULTS;
  }
}

export const OrbBackground = () => {
  const location = useLocation();
  const [settings, setSettings] = useState<OrbSettings>(() => readSettings());
  const SERVER_BASE_URL = (import.meta as any).env?.VITE_SERVER_BASE_URL || 'https://tubox.de/TUBOX/server/api/gallery-api';

  useEffect(() => {
    // Load from server first, fallback to localStorage
    const load = async () => {
      try {
        const resp = await fetch(`${SERVER_BASE_URL}/get-orb-settings.php?_=${Date.now()}`, { cache: 'no-store', mode: 'cors' });
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.success && json.data) {
            setSettings((prev) => ({ ...prev, ...json.data, enableOn: { ...prev.enableOn, ...(json.data.enableOn || {}) } }));
            return;
          }
        }
      } catch {}
      // fallback to local
      setSettings(readSettings());
    };
    load();

    const onUpdate = () => setSettings(readSettings());
    window.addEventListener('settings:orb-updated', onUpdate as any);
    return () => window.removeEventListener('settings:orb-updated', onUpdate as any);
  }, []);

  const enabledForRoute = useMemo(() => {
    const p = location.pathname;
    if (!settings.enabled) return false;
    if (p === '/') return settings.enableOn.index;
    if (p.startsWith('/gallery/')) return settings.enableOn.gallery;
    if (p === '/blog') return settings.enableOn.blog;
    if (p.startsWith('/blog/')) return settings.enableOn.blogPost;
    if (p.startsWith('/admin')) return settings.enableOn.admin;
    return true;
  }, [location.pathname, settings]);

  if (!enabledForRoute) return null;

  const style: React.CSSProperties = {
    opacity: settings.opacity,
    mixBlendMode: settings.blend as any,
    width: `${settings.sizePx}px`,
    height: `${settings.sizePx}px`,
    filter: `blur(${Math.max(0, settings.blurPx)}px) hue-rotate(${settings.hueDeg}deg) saturate(${settings.saturatePct}%) contrast(${settings.contrastPct}%) brightness(${settings.brightnessPct}%) ${settings.grayscale ? 'grayscale(100%)' : ''} ${settings.sepia ? 'sepia(100%)' : ''}`.trim(),
  };

  return (
    <div className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
      <style>{`
        @keyframes orb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <img
        src={settings.url}
        alt="Background"
        style={{
          ...style,
          animation: `orb-spin ${Math.max(10, settings.speedSec)}s linear infinite`,
          // Override Tailwind base img { max-width:100%; height:auto }
          maxWidth: 'none',
          maxHeight: 'none',
        }}
        className={`aspect-square rounded-full object-contain origin-center`}
      />
      {settings.tintOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: settings.tintColor,
            opacity: settings.tintOpacity,
            mixBlendMode: settings.tintBlend as any,
          }}
        />
      )}
    </div>
  );
};
