"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ImagePlus, 
  FilePlus, 
  // FileDown, 
  X, 
  Eye,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface ProjectImage {
  src: string;
  caption: string;
  width: number;
  height: number;
}

interface ProjectPdf {
  src: string;
  name: string;
}

interface DocumentsTabProps {
  images: ProjectImage[];
  pdfs: ProjectPdf[];
  onImagesChange: (images: ProjectImage[]) => void;
  onPdfsChange: (pdfs: ProjectPdf[]) => void;
}

export function DocumentsTab({
  images,
  pdfs,
  onImagesChange,
  onPdfsChange,
}: DocumentsTabProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const newImage: ProjectImage = {
              src: event.target?.result as string,
              caption: file.name,
              width: img.width,
              height: img.height,
            };
            onImagesChange([...images, newImage]);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newPdf: ProjectPdf = {
            src: event.target?.result as string,
            name: file.name,
          };
          onPdfsChange([...pdfs, newPdf]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const removePdf = (index: number) => {
    onPdfsChange(pdfs.filter((_, i) => i !== index));
  };

  const downloadImage = (image: ProjectImage, index: number) => {
    const link = document.createElement("a");
    link.href = image.src;
    link.download = `bild_${index + 1}.jpg`;
    link.click();
  };

  const downloadPdf = (pdf: ProjectPdf) => {
    const link = document.createElement("a");
    link.href = pdf.src;
    link.download = pdf.name;
    link.click();
  };

  const downloadAllImages = async () => {
    if (images.length === 0) return;
    const zip = new JSZip();
    images.forEach((img, idx) => {
      const base64 = img.src.split(",")[1];
      const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
      zip.file(`bild_${idx + 1}.${ext}`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "bilder.zip");
  };

  const downloadAllPdfs = async () => {
    if (pdfs.length === 0) return;
    const zip = new JSZip();
    pdfs.forEach((pdf, idx) => {
      const base64 = pdf.src.split(",")[1];
      zip.file(pdf.name || `dokument_${idx + 1}.pdf`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "dokumente.zip");
  };

  const downloadAllZip = async () => {
    if (images.length === 0 && pdfs.length === 0) return;
    const zip = new JSZip();
    
    if (images.length > 0) {
      const imagesFolder = zip.folder("bilder");
      images.forEach((img, idx) => {
        const base64 = img.src.split(",")[1];
        const ext = img.src.substring("data:image/".length, img.src.indexOf(";"));
        imagesFolder?.file(`bild_${idx + 1}.${ext}`, base64, { base64: true });
      });
    }
    
    if (pdfs.length > 0) {
      const pdfsFolder = zip.folder("dokumente");
      pdfs.forEach((pdf, idx) => {
        const base64 = pdf.src.split(",")[1];
        pdfsFolder?.file(pdf.name || `dokument_${idx + 1}.pdf`, base64, { base64: true });
      });
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "projekt_dokumente.zip");
  };

  return (
    <div className="pt-20 pb-6">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Dokumente & Fotos
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Verwalte alle Dokumente und Fotos deines Immobilienprojekts. 
            Lade Dateien hoch, organisiere sie und exportiere sie als ZIP-Archiv.
          </p>
        </div>

        {/* Upload Buttons */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => imageInputRef.current?.click()}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ImagePlus className="w-4 h-4" />
            Fotos hochladen
          </Button>
          <Button
            onClick={() => pdfInputRef.current?.click()}
            variant="outline"
            className="gap-2"
          >
            <FilePlus className="w-4 h-4" />
            PDFs hochladen
          </Button>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handlePdfUpload}
          className="hidden"
        />

        {/* Download All Buttons */}
        {(images.length > 0 || pdfs.length > 0) && (
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            {images.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadAllImages} className="gap-2">
                <Download className="w-4 h-4" />
                Alle Fotos (ZIP)
              </Button>
            )}
            {pdfs.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadAllPdfs} className="gap-2">
                <Download className="w-4 h-4" />
                Alle PDFs (ZIP)
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={downloadAllZip} className="gap-2">
              <Download className="w-4 h-4" />
              Alles (ZIP)
            </Button>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fotos Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                Fotos ({images.length})
              </h2>
              {images.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {images.length} Dateien
                </Badge>
              )}
            </div>

            {images.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-gray-300 dark:border-gray-600">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Noch keine Fotos hochgeladen
                </p>
                <Button
                  onClick={() => imageInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <ImagePlus className="w-4 h-4" />
                  Fotos hinzufügen
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="relative">
                      <Image
                        src={image.src}
                        alt={image.caption}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 w-8 h-8 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm mb-2 truncate">
                        {image.caption}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {image.width} × {image.height}px
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadImage(image, index)}
                          className="flex-1 gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(image.src, '_blank')}
                          className="flex-1 gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ansehen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* PDFs Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-red-600" />
                PDFs ({pdfs.length})
              </h2>
              {pdfs.length > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {pdfs.length} Dateien
                </Badge>
              )}
            </div>

            {pdfs.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 border-gray-300 dark:border-gray-600">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Noch keine PDFs hochgeladen
                </p>
                <Button
                  onClick={() => pdfInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <FilePlus className="w-4 h-4" />
                  PDFs hinzufügen
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {pdfs.map((pdf, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-sm truncate">
                            {pdf.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            PDF-Dokument
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPdf(pdf)}
                          className="gap-1"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(pdf.src, '_blank')}
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePdf(index)}
                          className="gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
