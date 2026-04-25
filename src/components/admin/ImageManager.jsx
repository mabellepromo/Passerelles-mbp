import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageManager() {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const newImages = [];

    for (const file of files) {
      const result = await base44.integrations.Core.UploadFile({ file });
      newImages.push({ name: file.name, url: result.file_url });
    }

    setUploadedImages([...uploadedImages, ...newImages]);
    setIsUploading(false);
    toast.success(`${newImages.length} image(s) téléchargée(s)`);
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée !');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Images</CardTitle>
        <CardDescription>Téléchargez vos logos et obtenez les URLs à utiliser dans le code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="block">
            <div className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600">Cliquez pour télécharger des images</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max 5MB)</p>
              </div>
            </div>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléchargement en cours...
            </div>
          )}
        </div>

        {uploadedImages.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Images Téléchargées</h3>
            <div className="space-y-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <img src={image.url} alt={image.name} className="w-12 h-12 object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                    <p className="text-xs text-gray-500 truncate">{image.url}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(image.url)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copier
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}