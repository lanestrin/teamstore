import { useEffect, useState } from "react";

export default function useFileDataUrl(file: File | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setDataUrl(null);
      return;
    }

    const reader = new FileReader();
    let isCancelled = false;

    reader.onload = () => {
      if (!isCancelled && typeof reader.result === "string") {
        setDataUrl(reader.result);
      }
    };

    reader.onerror = () => {
      if (!isCancelled) {
        setDataUrl(null);
      }
    };

    reader.readAsDataURL(file);

    return () => {
      isCancelled = true;

      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    };
  }, [file]);

  return dataUrl;
}
