import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Aperture, Timer, Gauge, Ruler, MapPin } from 'lucide-react';

export interface ImageMetadata {
  fileInfo?: {
    fileName?: string;
    fileSize?: string;
    dimensions?: { width: number; height: number };
  };
  cameraInfo?: {
    make?: string;
    model?: string;
    software?: string;
  };
  lensInfo?: {
    lensModel?: string;
    lensMake?: string;
    focalLength?: string;
    focalLengthIn35mm?: string;
    maxApertureValue?: string;
  };
  captureDetails?: {
    dateTaken?: string;
    exposure?: string;
    aperture?: string;
    iso?: string | number;
    focalLength?: string;
  };
  gpsInfo?: {
    latitude?: string | number;
    longitude?: string | number;
    altitude?: string | number;
  };
  error?: string;
}

interface ImageInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title?: string;
}

export const ImageInfoDialog = ({ open, onOpenChange, imageUrl, title }: ImageInfoDialogProps) => {
  const [meta, setMeta] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper: format exposure like 1/200s
  const formatExposure = (value: any) => {
    if (!value) return undefined;
    try {
      if (typeof value === 'number') {
        if (value >= 1) return `${value.toFixed(1)} s`;
        return `1/${Math.round(1 / value)} s`;
      }
      return String(value);
    } catch {
      return String(value);
    }
  };

  // Try to parse EXIF via exifr if available
  const loadExif = async (): Promise<ImageMetadata> => {
    const data: ImageMetadata = {};

    // Basic info from URL
    try {
      const url = new URL(imageUrl, window.location.href);
      const parts = url.pathname.split('/');
      const fileName = decodeURIComponent(parts.pop() || '');
      data.fileInfo = { fileName };
    } catch {
      data.fileInfo = { fileName: imageUrl.split('/').pop() };
    }

    // Get intrinsic dimensions via Image element
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          data.fileInfo = {
            ...(data.fileInfo || {}),
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
          };
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imageUrl;
      });
    } catch {}

    // Dynamically import exifr to avoid SSR/build issues if absent
    try {
      // Dynamically import exifr at runtime; it may export a function (default) or an object with .parse
      const mod: any = await import('exifr');
      const exifrMod: any = mod?.default ?? mod;
      const exif: any = typeof exifrMod === 'function'
        ? await exifrMod(imageUrl).catch(() => null)
        : await exifrMod.parse(imageUrl).catch(() => null);
      if (exif) {
        data.cameraInfo = {
          make: exif.Make,
          model: exif.Model,
          software: exif.Software,
        };
        const fnumber = exif.FNumber || exif.fNumber;
        const exposure = exif.ExposureTime || exif.exposureTime;
        const iso = exif.ISO || exif.iso || exif.ISOSpeedRatings;
        const fl = exif.FocalLength || exif.focalLength;
        data.captureDetails = {
          dateTaken: exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate,
          aperture: fnumber ? `f/${Number(fnumber).toFixed(1)}` : undefined,
          exposure: formatExposure(exposure),
          iso,
          focalLength: fl ? `${Math.round(Number(fl))} mm` : undefined,
        };
        data.lensInfo = {
          lensModel: exif.LensModel,
          lensMake: exif.LensMake,
          focalLength: data.captureDetails?.focalLength,
          focalLengthIn35mm: exif.FocalLengthIn35mmFormat ? `${exif.FocalLengthIn35mmFormat} mm` : undefined,
          maxApertureValue: exif.MaxApertureValue ? `f/${Number(exif.MaxApertureValue).toFixed(1)}` : undefined,
        };
        if (exif.GPSLatitude || exif.GPSLongitude) {
          data.gpsInfo = {
            latitude: exif.GPSLatitude,
            longitude: exif.GPSLongitude,
            altitude: exif.GPSAltitude,
          };
        }
      }
    } catch (e: any) {
      data.error = 'EXIF nicht verfügbar (CORS oder entfernt)';
    }

    return data;
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadExif()
      .then(setMeta)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl]);

  const chips = useMemo(() => {
    const items: string[] = [];
    if (meta?.captureDetails?.aperture) items.push(meta.captureDetails.aperture);
    if (meta?.captureDetails?.exposure) items.push(String(meta.captureDetails.exposure));
    if (meta?.captureDetails?.iso) items.push(`ISO ${meta.captureDetails.iso}`);
    if (meta?.captureDetails?.focalLength) items.push(meta.captureDetails.focalLength);
    return items;
  }, [meta]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> Bild-Informationen
          </DialogTitle>
        </DialogHeader>

        {/* Summary chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {chips.map((c, i) => (
              <Badge key={i} variant="secondary">{c}</Badge>
            ))}
          </div>
        )}

        {/* Loading / Error */}
        {loading ? (
          <div className="text-muted-foreground text-sm">Metadaten werden geladen…</div>
        ) : meta?.error && !meta?.fileInfo?.dimensions ? (
          <Alert variant="destructive"><AlertDescription>{meta.error}</AlertDescription></Alert>
        ) : (
          <div className="space-y-4 pr-1 overflow-y-auto max-h-[60vh]">
            {/* Datei-Info */}
            <section>
              <h3 className="text-sm font-semibold mb-2">Datei-Info</h3>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <div className="text-muted-foreground">Dateiname</div>
                <div className="truncate">{meta?.fileInfo?.fileName || 'Unbekannt'}</div>
                {meta?.fileInfo?.fileSize && (
                  <><div className="text-muted-foreground">Dateigröße</div><div>{meta.fileInfo.fileSize}</div></>
                )}
                {meta?.fileInfo?.dimensions && (
                  <>
                    <div className="text-muted-foreground">Abmessungen</div>
                    <div>{meta.fileInfo.dimensions.width} × {meta.fileInfo.dimensions.height} px</div>
                  </>
                )}
              </div>
            </section>
            <Separator />

            {/* Kamera-Info */}
            {(meta?.cameraInfo && Object.values(meta.cameraInfo).some(Boolean)) && (
              <section>
                <h3 className="text-sm font-semibold mb-2">Kamera-Info</h3>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {meta.cameraInfo?.make && (<><div className="text-muted-foreground">Hersteller</div><div>{meta.cameraInfo.make}</div></>)}
                  {meta.cameraInfo?.model && (<><div className="text-muted-foreground">Modell</div><div>{meta.cameraInfo.model}</div></>)}
                  {meta.cameraInfo?.software && (<><div className="text-muted-foreground">Software</div><div>{meta.cameraInfo.software}</div></>)}
                </div>
              </section>
            )}

            {/* Objektiv */}
            {(meta?.lensInfo && Object.values(meta.lensInfo).some(Boolean)) && (
              <section>
                <h3 className="text-sm font-semibold mb-2">Objektiv</h3>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {meta.lensInfo?.lensModel && (<><div className="text-muted-foreground">Objektiv</div><div>{meta.lensInfo.lensModel}</div></>)}
                  {meta.lensInfo?.lensMake && (<><div className="text-muted-foreground">Hersteller</div><div>{meta.lensInfo.lensMake}</div></>)}
                  {meta.lensInfo?.focalLength && (<><div className="text-muted-foreground">Brennweite</div><div>{meta.lensInfo.focalLength}</div></>)}
                  {meta.lensInfo?.focalLengthIn35mm && (<><div className="text-muted-foreground">KB-Brennweite</div><div>{meta.lensInfo.focalLengthIn35mm}</div></>)}
                  {meta.lensInfo?.maxApertureValue && (<><div className="text-muted-foreground">Max. Blende</div><div>{meta.lensInfo.maxApertureValue}</div></>)}
                </div>
              </section>
            )}

            {/* Aufnahme */}
            {(meta?.captureDetails && Object.values(meta.captureDetails).some(Boolean)) && (
              <section>
                <h3 className="text-sm font-semibold mb-2">Aufnahmedetails</h3>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {meta.captureDetails?.dateTaken && (<><div className="text-muted-foreground">Datum</div><div>{meta.captureDetails.dateTaken}</div></>)}
                  {meta.captureDetails?.exposure && (<><div className="text-muted-foreground">Belichtungszeit</div><div>{meta.captureDetails.exposure}</div></>)}
                  {meta.captureDetails?.aperture && (<><div className="text-muted-foreground">Blende</div><div>{meta.captureDetails.aperture}</div></>)}
                  {meta.captureDetails?.iso && (<><div className="text-muted-foreground">ISO</div><div>{meta.captureDetails.iso}</div></>)}
                  {meta.captureDetails?.focalLength && (<><div className="text-muted-foreground">Brennweite</div><div>{meta.captureDetails.focalLength}</div></>)}
                </div>
              </section>
            )}

            {/* GPS */}
            {(meta?.gpsInfo && Object.values(meta.gpsInfo).some(Boolean)) && (
              <section>
                <h3 className="text-sm font-semibold mb-2">GPS</h3>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  {meta.gpsInfo?.latitude && (<><div className="text-muted-foreground">Breite</div><div>{meta.gpsInfo.latitude}</div></>)}
                  {meta.gpsInfo?.longitude && (<><div className="text-muted-foreground">Länge</div><div>{meta.gpsInfo.longitude}</div></>)}
                  {meta.gpsInfo?.altitude && (<><div className="text-muted-foreground">Höhe</div><div>{meta.gpsInfo.altitude}</div></>)}
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
