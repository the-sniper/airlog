"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
  previewClassName?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled,
  className,
  previewClassName,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (disabled || loading) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    setLoading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setLoading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (disabled || loading) return;
    onChange("");
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {value ? (
        <div
          className={cn(
            "relative h-40 w-40 overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center",
            previewClassName
          )}
        >
          <img
            src={value}
            alt="Upload"
            className="h-full w-full object-contain p-2"
          />
          <div className="absolute top-1 right-1">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6 rounded-full opacity-80 hover:opacity-100 shadow-sm"
              onClick={handleRemove}
              disabled={disabled || loading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors md:p-8",
            dragActive && "border-primary/50 bg-primary/5",
            disabled && "cursor-not-allowed opacity-60",
            !disabled && "cursor-pointer hover:bg-muted/20"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !loading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled || loading}
          />

          <div className="rounded-full bg-muted p-3 shadow-sm">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">
              {loading ? "Uploading..." : "Click or drag to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG or GIF (max 2MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
