"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2
} from "lucide-react";

interface PDFDocument {
  src: string;
  name: string;
  description?: string;
}

interface PDFViewerProps {
  pdfs: PDFDocument[];
  title?: string;
  showDownloadButtons?: boolean;
}

export function PDFViewer({ 
  pdfs, 
  title = "Dokumente", 
  showDownloadButtons = true 
}: PDFViewerProps) {
  const [selectedPdf, setSelectedPdf] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const downloadPdf = (pdf: PDFDocument) => {
    const link = document.createElement("a");
    link.href = pdf.src;
    link.download = pdf.name;
    link.click();
  };

  const openPdfInNewTab = (pdf: PDFDocument) => {
    window.open(pdf.src, '_blank');
  };

  const nextPdf = () => {
    if (selectedPdf !== null && selectedPdf < pdfs.length - 1) {
      setSelectedPdf(selectedPdf + 1);
    }
  };

  const prevPdf = () => {
    if (selectedPdf !== null && selectedPdf > 0) {
      setSelectedPdf(selectedPdf - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (pdfs.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-gray-300 dark:border-gray-600">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Keine PDF-Dokumente verfügbar
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-600" />
            {title} ({pdfs.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Alle wichtigen Dokumente auf einen Blick - keine Downloads erforderlich
          </p>
        </div>
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          {pdfs.length} Dokumente
        </Badge>
      </div>

      {/* PDF List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs.map((pdf, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPdf === index ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => setSelectedPdf(index)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm font-medium truncate">
                    {pdf.name}
                  </CardTitle>
                  {pdf.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {pdf.description}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPdf(index);
                  }}
                  className="flex-1 gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Ansehen
                </Button>
                {showDownloadButtons && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPdf(pdf);
                    }}
                    className="flex-1 gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF Viewer Modal */}
      {selectedPdf !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
          <div className="w-full h-full bg-white dark:bg-gray-900">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-1 border-b border-gray-200 dark:border-gray-700 h-12 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {pdfs[selectedPdf].name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{selectedPdf + 1} von {pdfs.length}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={prevPdf}
                  disabled={selectedPdf === 0}
                  className="gap-1 px-1 py-0 text-xs h-8"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Zurück
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={nextPdf}
                  disabled={selectedPdf === pdfs.length - 1}
                  className="gap-1 px-1 py-0 text-xs h-8"
                >
                  Weiter
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="gap-1 px-1 py-0 text-xs h-8"
                >
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPdf(null)}
                  className="gap-1 px-1 py-0 text-xs h-8"
                >
                  <X className="w-3 h-3" />
                  Schließen
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="absolute top-12 bottom-12 left-0 right-0">
              <iframe
                src={pdfs[selectedPdf].src}
                className="w-full h-full border-0"
                title={pdfs[selectedPdf].name}
                onError={() => {
                  console.error('PDF konnte nicht geladen werden:', pdfs[selectedPdf].src);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-1 border-t border-gray-200 dark:border-gray-700 h-12 bg-white dark:bg-gray-900">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openPdfInNewTab(pdfs[selectedPdf])}
                  className="gap-1 px-1 py-0 text-xs h-8"
                >
                  <Eye className="w-3 h-3" />
                  In neuem Tab öffnen
                </Button>
                {showDownloadButtons && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPdf(pdfs[selectedPdf])}
                    className="gap-1 px-1 py-0 text-xs h-8"
                  >
                    <Download className="w-3 h-3" />
                    Herunterladen
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                Tipp: Pfeiltasten oder Navigation oben verwenden
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

