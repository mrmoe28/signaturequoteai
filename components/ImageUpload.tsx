'use client';
import { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Card } from './ui/Card';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string | null) => void;
  placeholder?: string;
  className?: string;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export default function ImageUpload({
  currentImage,
  onImageChange,
  placeholder = "Upload an image",
  className = "",
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`File must be one of: ${acceptedFormats.join(', ')}`);
      return;
    }

    setIsUploading(true);

    try {
      // For now, we'll use a data URL. In production, you'd upload to a service like Cloudinary, AWS S3, etc.
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {currentImage ? (
        <Card className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={currentImage}
                alt="Uploaded"
                className="w-20 h-20 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={handleRemoveImage}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Image uploaded</p>
              <p className="text-xs text-muted-foreground">
                Click to change or remove
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card 
          className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onClick={handleClick}
        >
          <div className="p-8 text-center">
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">{placeholder}</p>
            <p className="text-xs text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max size: {maxSize}MB • {acceptedFormats.map(f => f.split('/')[1]).join(', ')}
            </p>
          </div>
        </Card>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
