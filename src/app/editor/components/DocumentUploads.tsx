import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";

export interface ProjectImage {
  src: string;
  caption: string;
  width: number;
  height: number;
}

export interface ProjectPdf {
  src: string;
  name: string;
}

interface Props {
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  showUploads: boolean;
  setShowUploads: (v: boolean) => void;
  downloadImages: () => Promise<void>;
  downloadPdfs: () => Promise<void>;
  downloadAllZip: () => Promise<void>;
}

export function DocumentUploads({
  images,
  pdfs,
  showUploads,
  setShowUploads,
  downloadImages,
  downloadPdfs,
  downloadAllZip,
}: Props) {
  if (images.length === 0 && pdfs.length === 0) return null;
  return (
    <section className="max-w-6xl mx-auto px-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Uploads</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm">anzeigen</span>
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showUploads}
            onChange={(e) => setShowUploads(e.target.checked)}
          />
          <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-indigo-600 relative transition">
            <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-white dark:bg-slate-900 rounded-full transition peer-checked:translate-x-5" />
          </div>
        </label>
      </div>
      {showUploads && (
        <>
          {images.length > 0 && (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <figure key={idx}>
                  <Image
                    src={img.src}
                    alt={img.caption || `Bild ${idx + 1}`}
                    width={img.width}
                    height={img.height}
                    className="rounded-md object-cover w-full h-auto"
                    unoptimized
                  />
                  {img.caption && (
                    <figcaption className="text-sm text-center mt-1 text-slate-600 dark:text-slate-300">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
          {pdfs.length > 0 && (
            <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {pdfs.map((pdf, idx) => (
                <a
                  key={idx}
                  href={pdf.src}
                  download={pdf.name}
                  className="flex items-center justify-between rounded-md border p-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate text-sm">{pdf.name}</span>
                  </div>
                  <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {images.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadImages} className="gap-1">
                <FileDown className="w-4 h-4" /> Bilder
              </Button>
            )}
            {pdfs.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadPdfs} className="gap-1">
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            )}
            {(images.length > 0 || pdfs.length > 0) && (
              <Button variant="outline" size="sm" onClick={downloadAllZip} className="gap-1">
                <FileDown className="w-4 h-4" /> ZIP
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
