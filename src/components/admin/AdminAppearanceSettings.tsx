import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { OrbSettings } from '@/components/OrbBackground';

const STORAGE_KEY = 'orb_settings';

const read = (): OrbSettings | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const write = (settings: OrbSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('settings:orb-updated'));
};

export const AdminAppearanceSettings = () => {
  const [settings, setSettings] = useState<OrbSettings>(() => ({
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
  }));

  useEffect(() => {
    const s = read();
    if (s) setSettings((prev) => ({ ...prev, ...s, enableOn: { ...prev.enableOn, ...(s.enableOn || {}) } }));
  }, []);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const SERVER_BASE_URL = (import.meta as any).env?.VITE_SERVER_BASE_URL || 'https://tubox.de/TUBOX/server/api/gallery-api';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const API_TOKEN = (import.meta as any).env?.VITE_API_TOKEN || '';
      const resp = await fetch(`${SERVER_BASE_URL}/update-orb-settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ settings, token: API_TOKEN })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || data.success === false) {
        throw new Error(data.message || `Serverfehler (${resp.status})`);
      }
      // keep local fallback in sync and live-update
      write(settings);
      setMessage('Gespeichert (Server)');
    } catch (err: any) {
      setMessage(`Fehler beim Speichern: ${err?.message || 'Unbekannt'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label className="text-sm">Aktiviert</Label>
        <div className="flex items-center gap-3">
          <Switch checked={settings.enabled} onCheckedChange={(v) => setSettings({ ...settings, enabled: v })} />
          <span className="text-sm text-muted-foreground">Globale Orb anzeigen</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Bild-URL</Label>
        <Input value={settings.url} onChange={(e) => setSettings({ ...settings, url: e.target.value })} placeholder="https://.../image.png" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Größe (px)</Label>
          <Input type="number" value={settings.sizePx} onChange={(e) => setSettings({ ...settings, sizePx: parseInt(e.target.value || '0', 10) })} min={200} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Geschwindigkeit (Sekunden pro Umdrehung)</Label>
          <Input type="number" value={settings.speedSec} onChange={(e) => setSettings({ ...settings, speedSec: parseInt(e.target.value || '0', 10) })} min={5} max={1000} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Transparenz (0-1)</Label>
          <Input type="number" step="0.05" value={settings.opacity} onChange={(e) => setSettings({ ...settings, opacity: Math.max(0, Math.min(1, parseFloat(e.target.value || '0'))) })} min={0} max={1} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Blend-Modus</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={settings.blend}
            onChange={(e) => setSettings({ ...settings, blend: e.target.value as OrbSettings['blend'] })}
          >
            <option value="normal">normal</option>
            <option value="screen">screen</option>
            <option value="overlay">overlay</option>
            <option value="lighten">lighten</option>
            <option value="soft-light">soft-light</option>
          </select>
        </div>
      </div>

      {/* Filter */}
      <div className="space-y-3">
        <Label className="text-sm">Filter</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Blur (px)</Label>
            <Input type="number" value={settings.blurPx} onChange={(e) => setSettings({ ...settings, blurPx: Math.max(0, parseInt(e.target.value || '0', 10)) })} min={0} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Hue (°)</Label>
            <Input type="number" value={settings.hueDeg} onChange={(e) => setSettings({ ...settings, hueDeg: parseInt(e.target.value || '0', 10) })} min={-180} max={180} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sättigung (%)</Label>
            <Input type="number" value={settings.saturatePct} onChange={(e) => setSettings({ ...settings, saturatePct: parseInt(e.target.value || '0', 10) })} min={0} max={300} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Kontrast (%)</Label>
            <Input type="number" value={settings.contrastPct} onChange={(e) => setSettings({ ...settings, contrastPct: parseInt(e.target.value || '0', 10) })} min={0} max={300} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Helligkeit (%)</Label>
            <Input type="number" value={settings.brightnessPct} onChange={(e) => setSettings({ ...settings, brightnessPct: parseInt(e.target.value || '0', 10) })} min={0} max={300} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={settings.grayscale} onChange={(e) => setSettings({ ...settings, grayscale: e.target.checked })} />
            <span className="text-sm">Graustufen</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={settings.sepia} onChange={(e) => setSettings({ ...settings, sepia: e.target.checked })} />
            <span className="text-sm">Sepia</span>
          </div>
        </div>
      </div>

      {/* Farb-Tönung */}
      <div className="space-y-3">
        <Label className="text-sm">Farb-Tönung</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Farbe</Label>
            <Input type="color" value={settings.tintColor} onChange={(e) => setSettings({ ...settings, tintColor: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Deckkraft (0-1)</Label>
            <Input type="number" step="0.05" value={settings.tintOpacity} onChange={(e) => setSettings({ ...settings, tintOpacity: Math.max(0, Math.min(1, parseFloat(e.target.value || '0'))) })} min={0} max={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Blend</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2"
              value={settings.tintBlend}
              onChange={(e) => setSettings({ ...settings, tintBlend: e.target.value as any })}
            >
              <option value="normal">normal</option>
              <option value="screen">screen</option>
              <option value="overlay">overlay</option>
              <option value="soft-light">soft-light</option>
              <option value="multiply">multiply</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Sichtbarkeit pro Bereich</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {([
            ['Index', 'index'],
            ['Gallery', 'gallery'],
            ['Blog', 'blog'],
            ['Blog-Artikel', 'blogPost'],
            ['Admin', 'admin'],
          ] as const).map(([label, key]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.enableOn as any)[key]}
                onChange={(e) => setSettings({ ...settings, enableOn: { ...settings.enableOn, [key]: e.target.checked } })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? 'Speichern…' : 'Speichern (Server)'}</Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
};
