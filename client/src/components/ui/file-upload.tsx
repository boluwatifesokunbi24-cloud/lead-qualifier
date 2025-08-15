import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload01, X, File02, CheckCircle } from "@untitledui/icons";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  uploadedFile: File | null;
  leadCount?: number;
}

export function FileUpload({ onFileSelect, uploadedFile, leadCount }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-navy-600', 'bg-navy-50');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-navy-600', 'bg-navy-50');
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-navy-600', 'bg-navy-50');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const removeFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Note: We don't have a callback to notify parent of file removal
    // This would need to be added to the parent component
  }, []);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {!uploadedFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 sm:p-8 text-center hover:border-navy-600 transition-colors duration-200 cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          data-testid="area-file-upload"
        >
          <Upload01 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium text-charcoal-600 mb-2">Drop your CSV file here</p>
          <p className="text-sm sm:text-base text-gray-600 mb-6">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            data-testid="input-file-upload"
          />
          <Button
            type="button"
            variant="outline"
            className="px-8 py-3 w-full sm:w-auto"
            data-testid="button-choose-file"
          >
            Choose File
          </Button>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4" data-testid="preview-uploaded-file">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-charcoal-600" data-testid="text-file-name">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-gray-600" data-testid="text-file-info">
                  {leadCount ? `${leadCount.toLocaleString()} leads • ` : ''}
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600"
              data-testid="button-remove-file"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
