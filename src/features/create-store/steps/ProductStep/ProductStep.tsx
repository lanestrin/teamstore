import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { LuImage, LuPencil, LuUpload } from "react-icons/lu";

import {
  ART_TEMPLATES,
  type ArtTemplateEditableElement,
} from "../../../../assets/art-templates";
import ArtTemplatePreview from "../../../../components/art-template-preview/ArtTemplatePreview";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import {
  useCreateStore,
  type ArtworkTextDraft,
} from "../../context/CreateStoreContext";

import ArtworkEditorModal from "./components/ArtworkEditorModal/ArtworkEditorModal";
import {
  applyArtworkAdjustments,
  type ArtworkAdjustments,
} from "./artworkEditor";

import styles from "./ProductStep.module.scss";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_MASCOT_FILE_SIZE = 5 * 1024 * 1024;

function setSvgText(svgDocument: Document, elementId: string, value: string) {
  const element = svgDocument.getElementById(elementId);

  if (!element) {
    console.warn(`SVG element "#${elementId}" was not found.`);
    return;
  }

  const textTarget =
    element.querySelector("textPath") ??
    element.querySelector("tspan") ??
    element;

  textTarget.textContent = value;
}

function setSvgMascot(svgDocument: Document, mascotSource: string | null) {
  if (!mascotSource) {
    return;
  }

  const currentMascot = svgDocument.getElementById("Mascot");

  if (!currentMascot) {
    console.warn('SVG element "#Mascot" was not found.');
    return;
  }

  const mascotImage = svgDocument.createElementNS(SVG_NAMESPACE, "image");

  for (const attribute of ["x", "y", "width", "height", "transform"]) {
    const value = currentMascot.getAttribute(attribute);

    if (value) {
      mascotImage.setAttribute(attribute, value);
    }
  }

  mascotImage.setAttribute("id", "Mascot");
  mascotImage.setAttribute("preserveAspectRatio", "xMidYMid meet");
  mascotImage.setAttribute("href", mascotSource);

  currentMascot.replaceWith(mascotImage);
}

function createCustomizedSvg(
  templateSvg: string,
  values: ArtworkTextDraft,
  mascotSource: string | null,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(templateSvg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error("The artwork template could not be parsed.");
    return templateSvg;
  }

  const year = values.yearEstablished.replace(/\D/g, "").slice(0, 4);

  setSvgText(
    svgDocument,
    "Line1",
    values.organizationName.trim().toUpperCase(),
  );
  setSvgText(svgDocument, "Line2", year.slice(0, 2));
  setSvgText(svgDocument, "Line3", year.slice(2, 4));
  setSvgText(svgDocument, "Line4", values.mascotName.trim().toUpperCase());

  setSvgMascot(svgDocument, mascotSource);

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}

function applySavedArtworkAdjustments(
  svg: string,
  editableElements: readonly ArtTemplateEditableElement[],
  adjustments: ArtworkAdjustments,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error("The customized artwork could not be parsed.");
    return svg;
  }

  applyArtworkAdjustments(svgDocument, editableElements, adjustments);

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}

function useFileDataUrl(file: File | null) {
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

function isSupportedMascotFile(file: File) {
  const supportedTypes = ["image/png", "image/jpeg", "image/svg+xml"];

  if (supportedTypes.includes(file.type)) {
    return true;
  }

  return /\.(png|jpe?g|svg)$/i.test(file.name);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductStep() {
  const { currentStep, setCurrentStep, storeDraft, updateStoreDraft } =
    useCreateStore();

  const template = ART_TEMPLATES.E20_31;

  const artworkText = useMemo<ArtworkTextDraft>(
    () => ({
      ...storeDraft.artworkText,
      organizationName:
        storeDraft.artworkText.organizationName ||
        storeDraft.organizationName ||
        "MARTINIVILLE",
    }),
    [storeDraft.artworkText, storeDraft.organizationName],
  );

  const artworkAdjustments = storeDraft.artworkAdjustments;

  const [isArtworkEditorOpen, setIsArtworkEditorOpen] = useState(false);

  const [mascotError, setMascotError] = useState<string | null>(null);

  const mascotDataUrl = useFileDataUrl(storeDraft.logoFile);

  const baseCustomizedSvg = useMemo(
    () => createCustomizedSvg(template.svg, artworkText, mascotDataUrl),
    [template.svg, artworkText, mascotDataUrl],
  );

  const customizedSvg = useMemo(
    () =>
      applySavedArtworkAdjustments(
        baseCustomizedSvg,
        template.editableElements,
        artworkAdjustments,
      ),
    [baseCustomizedSvg, template.editableElements, artworkAdjustments],
  );

  const updateArtworkText = (field: keyof ArtworkTextDraft, value: string) => {
    updateStoreDraft({
      artworkText: {
        ...artworkText,
        [field]: value,
      },
    });
  };

  const handleMascotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (!isSupportedMascotFile(file)) {
      setMascotError("Choose a PNG, JPG, JPEG, or SVG file.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size > MAX_MASCOT_FILE_SIZE) {
      setMascotError("The mascot file must be 5 MB or smaller.");
      event.currentTarget.value = "";
      return;
    }

    setMascotError(null);

    updateStoreDraft({
      logoFile: file,
      logoStorageId: null,
    });
  };

  return (
    <>
      <WizardLayout
        step={currentStep}
        title="Choose Your Products"
        description="Preview generated artwork and choose products for your store."
        onBack={() => setCurrentStep(2)}
        nextDisabled
      >
        <div className={styles.editor}>
          <section
            className={styles.controls}
            aria-label="Artwork customization"
          >
            <div className={styles.controlSection}>
              <div className={styles.controlsHeading}>
                <h2>Artwork Text</h2>
                <p>Changes appear in the preview immediately.</p>
              </div>

              <label className={styles.field}>
                <span>Organization name</span>

                <input
                  type="text"
                  value={artworkText.organizationName}
                  onChange={(event) =>
                    updateArtworkText(
                      "organizationName",
                      event.currentTarget.value,
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Established year</span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={artworkText.yearEstablished}
                  onChange={(event) =>
                    updateArtworkText(
                      "yearEstablished",
                      event.currentTarget.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Mascot name</span>

                <input
                  type="text"
                  value={artworkText.mascotName}
                  onChange={(event) =>
                    updateArtworkText("mascotName", event.currentTarget.value)
                  }
                />
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.controlSection}>
              <div className={styles.controlsHeading}>
                <h2>Mascot</h2>
                <p>
                  The mascot uploaded earlier is loaded automatically. Upload
                  another file to replace it.
                </p>
              </div>

              <div className={styles.mascotCard}>
                <div className={styles.mascotThumbnail}>
                  {mascotDataUrl ? (
                    <img src={mascotDataUrl} alt="Current mascot" />
                  ) : (
                    <LuImage aria-hidden="true" />
                  )}
                </div>

                <div className={styles.mascotDetails}>
                  <strong>
                    {storeDraft.logoFile?.name ??
                      (storeDraft.logoStorageId
                        ? "Saved mascot"
                        : "No mascot uploaded")}
                  </strong>

                  <span>
                    {storeDraft.logoFile
                      ? formatFileSize(storeDraft.logoFile.size)
                      : "PNG, JPG, or SVG · Maximum 5 MB"}
                  </span>

                  <label className={styles.replaceButton}>
                    <LuUpload aria-hidden="true" />

                    {storeDraft.logoFile || storeDraft.logoStorageId
                      ? "Replace mascot"
                      : "Upload mascot"}

                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                      className={styles.fileInput}
                      onChange={handleMascotChange}
                    />
                  </label>
                </div>
              </div>

              {mascotError && (
                <p className={styles.error} role="alert">
                  {mascotError}
                </p>
              )}

              {!storeDraft.logoFile && storeDraft.logoStorageId && (
                <p className={styles.notice}>
                  This draft has a stored mascot, but its public URL is not
                  loaded in the current wizard state. Uploading a replacement
                  will preview it immediately.
                </p>
              )}
            </div>
          </section>

          <div className={styles.preview}>
            <ArtTemplatePreview template={template} svg={customizedSvg} />

            <button
              type="button"
              className={styles.replaceButton}
              onClick={() => setIsArtworkEditorOpen(true)}
            >
              <LuPencil aria-hidden="true" />
              Edit Artwork
            </button>
          </div>
        </div>
      </WizardLayout>

      <ArtworkEditorModal
        isOpen={isArtworkEditorOpen}
        svg={baseCustomizedSvg}
        editableElements={template.editableElements}
        adjustments={artworkAdjustments}
        onCancel={() => setIsArtworkEditorOpen(false)}
        onSave={(nextAdjustments) => {
          updateStoreDraft({
            artworkAdjustments: nextAdjustments,
          });
          setIsArtworkEditorOpen(false);
        }}
      />
    </>
  );
}
