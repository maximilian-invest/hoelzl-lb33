"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const { addToast } = useToast();

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    addToast({
      title: "Bild entfernt",
      description: "Das Bild wurde aus dem Projekt entfernt",
      type: "success",
      duration: 2000
    });
  };

  const removePdf = (index: number) => {
    const newPdfs = pdfs.filter((_, i) => i !== index);
    onPdfsChange(newPdfs);
    addToast({
      title: "PDF entfernt",
      description: "Das PDF wurde aus dem Projekt entfernt",
      type: "success",
      duration: 2000
    });
  };

  const updateImageCaption = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Dokumente & Fotos
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Verwalte alle Dokumente und Fotos deines Immobilienprojekts. 
          Upload- und Download-Funktionen sind vorübergehend deaktiviert.
        </p>
      </div>

      {/* Fotos Sektion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Fotos ({images.length})
          </h2>
        </div>

        {images.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Keine Fotos vorhanden</p>
              <p className="text-sm">Upload-Funktionen sind vorübergehend deaktiviert</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <Image
                    src={image.src}
                    alt={image.caption}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500/80 hover:bg-red-600 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => updateImageCaption(index, e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0"
                    placeholder="Bildbeschreibung..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {image.width} × {image.height}px
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* PDFs Sektion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDFs ({pdfs.length})
          </h2>
        </div>

        {pdfs.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Keine PDFs vorhanden</p>
              <p className="text-sm">Upload-Funktionen sind vorübergehend deaktiviert</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfs.map((pdf, index) => (
              <Card key={index} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {pdf.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PDF-Dokument
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(pdf.src, '_blank')}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        title="PDF öffnen"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePdf(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 cursor-pointer"
                        title="PDF entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Upload-Funktionen deaktiviert
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Die Upload- und Download-Funktionen sind vorübergehend deaktiviert. 
                Alle Dokumente werden automatisch in der Cloud gespeichert.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}