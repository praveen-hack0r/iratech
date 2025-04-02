import { useState, useRef, ChangeEvent } from "react";
import { Button } from "./button";
import { Progress } from "./progress";
import { Upload, X, FileType } from "lucide-react";
import { Card, CardContent } from "./card";

interface FileUploadProps {
  onUpload: (file: File) => void;
  onReset?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  buttonText?: string;
  uploading?: boolean;
  uploadProgress?: number;
  className?: string;
  error?: string;
  fileType?: 'video' | 'resource' | 'image';
}

export function FileUpload({
  onUpload,
  onReset,
  accept = "image/*,video/*,application/pdf,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.*",
  maxSize = 100, // 100MB default max size
  label = "Upload a file",
  buttonText = "Select File",
  uploading = false,
  uploadProgress = 0,
  className = "",
  error,
  fileType = 'resource'
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds the ${maxSize}MB limit.`);
      return;
    }
    
    setSelectedFile(file);
    onUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const resetFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onReset) onReset();
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'video':
        return <FileType className="h-10 w-10 text-primary" />;
      case 'image':
        return <FileType className="h-10 w-10 text-green-500" />;
      default:
        return <FileType className="h-10 w-10 text-blue-500" />;
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      {selectedFile && !uploading ? (
        <Card className="p-4 bg-gray-50 border-dashed">
          <CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <p className="font-medium truncate" title={selectedFile.name}>
                  {selectedFile.name.length > 30 
                    ? selectedFile.name.substring(0, 30) + "..." 
                    : selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={resetFile}
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : uploading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">{uploadProgress}% uploaded</span>
            <span className="text-sm text-muted-foreground">
              {selectedFile?.name || "Uploading..."}
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 text-center mb-1">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {maxSize}MB maximum file size
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
      
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
