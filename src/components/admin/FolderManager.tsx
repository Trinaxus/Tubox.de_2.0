import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Folder, File, Upload, Plus, ArrowLeft, RefreshCw, Download, Pencil, Trash2 } from 'lucide-react';
import { UPLOADS_BASE_URL } from '@/services/api';

type FileItem = {
  name: string;
  type: 'dir' | 'file';
  size: number;
  mtime: number;
  path: string; // relative under uploads
  url?: string | null;
};

const FILE_API_BASE = (import.meta as any).env?.VITE_FILE_API_BASE_URL || 'https://tubox.de/TUBOX/server/api/file-api';
const API_TOKEN = (import.meta as any).env?.VITE_API_TOKEN || '';

export const FolderManager = () => {
  const { toast } = useToast();
  const [path, setPath] = useState<string>(''); // relative to uploads
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mkOpen, setMkOpen] = useState(false);
  const [mkName, setMkName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const breadcrumb = useMemo(() => {
    const segs = path ? path.split('/') : [];
    const list = [{ name: 'uploads', rel: '' }];
    let acc = '';
    for (const s of segs) {
      acc = acc ? `${acc}/${s}` : s;
      list.push({ name: s, rel: acc });
    }
    return list;
  }, [path]);

  const list = async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${FILE_API_BASE}/list.php?path=${encodeURIComponent(p)}&_=${Date.now()}`;
      const resp = await fetch(url, { headers: { Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '' }, cache: 'no-store', mode: 'cors' });
      const j = await resp.json();
      if (!resp.ok || !j.success) throw new Error(j.message || `HTTP ${resp.status}`);
      setItems(j.data.items);
      setPath(j.data.path || '');
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { list(path); /* initial */ }, []);

  const onEnterDir = (dir: FileItem) => {
    if (dir.type !== 'dir') return;
    list(dir.path);
  };

  const onUp = () => {
    if (!path) return;
    const parent = path.split('/').slice(0, -1).join('/');
    list(parent);
  };

  const createFolder = async () => {
    if (!mkName.trim()) return;
    try {
      const resp = await fetch(`${FILE_API_BASE}/mkdir.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '' },
        body: JSON.stringify({ path, name: mkName.trim(), token: API_TOKEN })
      });
      const j = await resp.json();
      if (!resp.ok || !j.success) throw new Error(j.message || `HTTP ${resp.status}`);
      toast({ title: 'Ordner erstellt', description: j.data.created });
      setMkName(''); setMkOpen(false);
      list(path);
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || 'Ordner konnte nicht erstellt werden' });
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();
  const onFilesSelected = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files;
    if (!files || files.length === 0) return;
    try {
      const fd = new FormData();
      fd.append('path', path);
      fd.append('token', API_TOKEN);
      Array.from(files).forEach(f => fd.append('files[]', f, f.name));
      const resp = await fetch(`${FILE_API_BASE}/upload.php`, { method: 'POST', body: fd, mode: 'cors' });
      const j = await resp.json();
      if (!resp.ok || !j.success) throw new Error(j.message || `HTTP ${resp.status}`);
      const okCount = (j.data.uploaded || []).filter((x: any) => x.ok).length;
      toast({ title: 'Upload', description: `${okCount} Datei(en) hochgeladen` });
      list(path);
    } catch (e: any) {
      toast({ title: 'Upload fehlgeschlagen', description: e?.message || 'Bitte später erneut versuchen' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fmtSize = (n: number) => {
    if (!n) return '-';
    const units = ['B','KB','MB','GB'];
    let i=0, v=n;
    while (v>=1024 && i<units.length-1) { v/=1024; i++; }
    return `${v.toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-background to-muted/40">
        <CardHeader>
          <CardTitle className="text-2xl">Ordnerverwaltung</CardTitle>
          <CardDescription>Durchsuchter Pfad: <code>uploads{path ? '/' + path : ''}</code></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onUp} disabled={!path || loading}><ArrowLeft className="h-4 w-4 mr-2"/>Ebene hoch</Button>
            <Button variant="outline" onClick={()=>list(path)} disabled={loading}><RefreshCw className="h-4 w-4 mr-2"/>Aktualisieren</Button>
            <Button variant="outline" onClick={()=>setMkOpen(true)}><Plus className="h-4 w-4 mr-2"/>Neuer Ordner</Button>
            <Button variant="outline" onClick={onUploadClick}><Upload className="h-4 w-4 mr-2"/>Datei hochladen</Button>
            <input ref={fileInputRef} onChange={onFilesSelected} type="file" multiple className="hidden" />
          </div>

          {/* Breadcrumb */}
          <div className="text-sm flex flex-wrap items-center gap-2">
            {breadcrumb.map((bc, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {idx>0 && <span className="opacity-50">/</span>}
                <button className="underline-offset-2 hover:underline" onClick={()=>list(bc.rel)}>{bc.name}</button>
              </span>
            ))}
          </div>

          {/* Error */}
          {error && <div className="text-destructive text-sm">{error}</div>}

          {/* Listing */}
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Typ</th>
                  <th className="text-left px-3 py-2">Größe</th>
                  <th className="text-left px-3 py-2">Geändert</th>
                  <th className="text-right px-3 py-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.path} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2">
                      {it.type==='dir' ? (
                        <button className="flex items-center gap-2 hover:underline" onClick={()=>onEnterDir(it)}>
                          <Folder className="h-4 w-4 text-primary"/> {it.name}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2"><File className="h-4 w-4"/> {it.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{it.type==='dir' ? 'Ordner' : 'Datei'}</td>
                    <td className="px-3 py-2">{it.type==='dir' ? '-' : fmtSize(it.size)}</td>
                    <td className="px-3 py-2">{new Date(it.mtime*1000).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        {it.type==='file' && (
                          <a className="inline-flex items-center gap-1 underline-offset-2 hover:underline" href={it.url || `${UPLOADS_BASE_URL}/${encodeURI(it.path)}`} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4"/> Download
                          </a>
                        )}
                        {/* Platzhalter für Rename/Move/Delete – folgt nach Backend */}
                        <Button variant="ghost" size="icon" disabled><Pencil className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length===0 && (
                  <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>Keine Einträge</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Unterordner unten (nur Dirs im aktuellen Pfad) */}
          <div className="mt-4">
            <div className="text-xs text-muted-foreground mb-2">Unterordner</div>
            <div className="flex flex-wrap gap-2">
              {items.filter(i=>i.type==='dir').map(d=> (
                <button key={d.path} onClick={()=>onEnterDir(d)} className="px-3 py-1 rounded-full border hover:bg-muted/50 text-sm flex items-center gap-2">
                  <Folder className="h-4 w-4 text-primary"/> {d.name}
                </button>
              ))}
              {items.filter(i=>i.type==='dir').length===0 && <div className="text-sm text-muted-foreground">Keine Unterordner</div>}
            </div>
          </div>

          {/* Neuer Ordner Dialog (einfach gehalten) */}
          {mkOpen && (
            <div className="border rounded-lg p-3 bg-background">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Neuer Ordnername</Label>
                  <Input value={mkName} onChange={e=>setMkName(e.target.value)} placeholder="z.B. 2025 / Neue Galerie" />
                </div>
                <Button onClick={createFolder} disabled={!mkName.trim()}>Anlegen</Button>
                <Button variant="outline" onClick={()=>{setMkOpen(false); setMkName('');}}>Abbrechen</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};