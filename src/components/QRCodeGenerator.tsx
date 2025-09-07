"use client";

import React, { useState, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, QrCode, Copy, Check } from "lucide-react";

interface QRCodeGeneratorProps {
  projectName: string;
  onClose?: () => void;
}

export function QRCodeGenerator({ projectName, onClose }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generiere QR-Code URL für das Projekt
  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Erstelle eine URL die das Projekt mit gesperrtem PIN öffnet
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const projectUrl = `${baseUrl}/project/${encodeURIComponent(projectName)}?locked=true`;
      
      // Generiere QR-Code mit höherer Auflösung für bessere Lesbarkeit
      const qrDataUrl = await QRCode.toDataURL(projectUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Kopiere URL in Zwischenablage
  const copyUrl = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const projectUrl = `${baseUrl}/project/${encodeURIComponent(projectName)}?locked=true`;
    
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    }
  };

  // Download QR-Code als PNG
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `projekt-${projectName}-qr-code.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    generateQRCode();
  }, [projectName]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white dark:bg-slate-800">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            QR-Code für Projekt
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {projectName}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : qrCodeDataUrl ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR-Code für Projekt" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kunden können diesen QR-Code scannen, um das Projekt im gesperrten Modus zu öffnen.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={copyUrl}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        URL kopieren
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={downloadQRCode}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Fehler beim Generieren des QR-Codes
              </p>
              <Button
                onClick={generateQRCode}
                className="mt-4"
                variant="outline"
              >
                Erneut versuchen
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
