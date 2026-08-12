import { useEffect, useState } from "react";

interface FileDataUrlState {
  file: File | null;
  dataUrl: string | null;
}

export default function useFileDataUrl(file: File | null) {
  const [result, setResult] = useState<FileDataUrlState>({
    file: null,
    dataUrl: null,
  });

  useEffect(() => {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    let isCancelled = false;

    reader.onload = () => {
      if (isCancelled || typeof reader.result !== "string") {
        return;
      }

      setResult({
        file,
        dataUrl: reader.result,
      });
    };

    reader.onerror = () => {
      if (isCancelled) {
        return;
      }

      setResult({
        file,
        dataUrl: null,
      });
    };

    reader.readAsDataURL(file);

    return () => {
      isCancelled = true;

      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file]);

  /*
   * If the incoming file changes, don't briefly
   * expose the previous file's data URL while
   * the new FileReader is still loading.
   */
  if (result.file !== file) {
    return null;
  }

  return result.dataUrl;
}
