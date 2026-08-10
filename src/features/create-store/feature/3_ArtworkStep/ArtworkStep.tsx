import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { LuImage, LuPencil, LuUpload } from "react-icons/lu";

import {
  ART_TEMPLATE_LIST,
  type ArtTemplate,
  type ArtTemplateEditableElement,
  type ArtTemplateTextBinding,
} from "../../../../assets/art-templates";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import {
  useCreateStore,
  type ArtworkTextDraft,
} from "../../context/CreateStoreContext";

import ArtworkEditorModal from "./components/ArtworkEditorModal/ArtworkEditorModal";
import ArtTemplatePreview from "./components/ArtTemplatePreview/ArtTemplatePreview";
import {
  applyArtworkAdjustments,
  type ArtworkAdjustments,
} from "./artworkEditor";

import styles from "./ArtworkStep.module.scss";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_MASCOT_FILE_SIZE = 5 * 1024 * 1024;

interface ArtworkTemplateGalleryItem {
  template: ArtTemplate;
  baseSvg: string;
  customizedSvg: string;
  isSelected: boolean;
  artworkAdjustments: ArtworkAdjustments;
}

function getPresentationAttribute(element: Element, name: string) {
  let current: Element | null = element;

  while (current) {
    const directValue = current.getAttribute(name);

    if (directValue) {
      return directValue;
    }

    const inlineStyle = current.getAttribute("style");

    if (inlineStyle) {
      const declaration = inlineStyle
        .split(";")
        .map((item) => item.trim())
        .find((item) =>
          item.toLowerCase().startsWith(`${name.toLowerCase()}:`),
        );

      if (declaration) {
        return declaration.slice(declaration.indexOf(":") + 1).trim();
      }
    }

    current = current.parentElement;
  }

  return null;
}

function parseSvgNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

let textMeasurementContext: CanvasRenderingContext2D | null | undefined;

function getTextMeasurementContext() {
  if (typeof document === "undefined") {
    return null;
  }

  if (textMeasurementContext !== undefined) {
    return textMeasurementContext;
  }

  const canvas = document.createElement("canvas");
  textMeasurementContext = canvas.getContext("2d");

  return textMeasurementContext;
}

function measureSvgText(element: Element, value: string) {
  const context = getTextMeasurementContext();

  if (!context || !value) {
    return 0;
  }

  const fontStyle = getPresentationAttribute(element, "font-style") ?? "normal";
  const fontWeight =
    getPresentationAttribute(element, "font-weight") ?? "normal";
  const fontSize = parseSvgNumber(
    getPresentationAttribute(element, "font-size"),
    16,
  );
  const fontFamily =
    getPresentationAttribute(element, "font-family") ?? "sans-serif";
  const letterSpacing = parseSvgNumber(
    getPresentationAttribute(element, "letter-spacing"),
    0,
  );

  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const measuredWidth = context.measureText(value).width;
  const spacingWidth = Math.max(0, value.length - 1) * letterSpacing;

  return measuredWidth + spacingWidth;
}

function getTextFitWidth(
  svgDocument: Document,
  element: Element,
  textTarget: Element,
  originalValue: string,
) {
  const configuredWidth =
    textTarget.getAttribute("data-fit-width") ??
    element.getAttribute("data-fit-width");

  if (configuredWidth) {
    return parseSvgNumber(configuredWidth, 0);
  }

  const existingTextLength =
    textTarget.getAttribute("textLength") ?? element.getAttribute("textLength");

  if (existingTextLength) {
    return parseSvgNumber(existingTextLength, 0);
  }

  const originalWidth = measureSvgText(textTarget, originalValue);

  if (originalWidth > 0) {
    return originalWidth;
  }

  const viewBox = svgDocument.documentElement
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);

  if (viewBox?.length === 4 && Number.isFinite(viewBox[2])) {
    return viewBox[2] * 0.92;
  }

  return 0;
}

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
  const originalValue = textTarget.textContent?.trim() ?? "";
  const fitWidth = getTextFitWidth(
    svgDocument,
    element,
    textTarget,
    originalValue,
  );

  textTarget.textContent = value;
  textTarget.removeAttribute("textLength");
  textTarget.removeAttribute("lengthAdjust");

  const updatedWidth = measureSvgText(textTarget, value);

  if (fitWidth > 0 && updatedWidth > fitWidth) {
    textTarget.setAttribute("textLength", fitWidth.toFixed(3));
    textTarget.setAttribute("lengthAdjust", "spacingAndGlyphs");
  }
}

function setSvgMascot(
  svgDocument: Document,
  mascotElementId: string | undefined,
  mascotSource: string | null,
) {
  if (!mascotElementId || !mascotSource) {
    return;
  }

  const currentMascot = svgDocument.getElementById(mascotElementId);

  if (!currentMascot) {
    console.warn(`SVG element "#${mascotElementId}" was not found.`);
    return;
  }

  const mascotImage = svgDocument.createElementNS(SVG_NAMESPACE, "image");

  for (const attribute of [
    "x",
    "y",
    "width",
    "height",
    "transform",
    "clip-path",
  ]) {
    const value = currentMascot.getAttribute(attribute);

    if (value) {
      mascotImage.setAttribute(attribute, value);
    }
  }

  mascotImage.setAttribute("id", mascotElementId);
  mascotImage.setAttribute("preserveAspectRatio", "xMidYMid meet");
  mascotImage.setAttribute("href", mascotSource);

  currentMascot.replaceWith(mascotImage);
}

function getTextBindingValue(
  values: ArtworkTextDraft,
  binding: ArtTemplateTextBinding,
) {
  let value = values[binding.field];

  if (binding.field === "yearEstablished") {
    value = value.replace(/\D/g, "").slice(0, 4);
  } else {
    value = value.trim();
  }

  if (binding.slice) {
    value = value.slice(binding.slice[0], binding.slice[1]);
  }

  if (binding.transform === "uppercase") {
    value = value.toUpperCase();
  }

  return value;
}

function createCustomizedSvg(
  template: ArtTemplate,
  values: ArtworkTextDraft,
  mascotSource: string | null,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(template.svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error(`Artwork template "${template.id}" could not be parsed.`);
    return template.svg;
  }

  for (const binding of template.textBindings) {
    setSvgText(
      svgDocument,
      binding.elementId,
      getTextBindingValue(values, binding),
    );
  }

  setSvgMascot(svgDocument, template.mascotElementId, mascotSource);

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

export default function SelectArtworksStep() {
  const {
    currentStep,
    setCurrentStep,
    storeDraft,
    updateStoreDraft,
    updateArtworkTemplateDraft,
  } = useCreateStore();

  const artworkText = useMemo<ArtworkTextDraft>(
    () => ({
      ...storeDraft.artworkText,
      organizationName:
        storeDraft.artworkText.organizationName || storeDraft.organizationName,
    }),
    [storeDraft.artworkText, storeDraft.organizationName],
  );

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );

  const [mascotError, setMascotError] = useState<string | null>(null);
  const [fontLoadVersion, setFontLoadVersion] = useState(0);

  const mascotDataUrl = useFileDataUrl(storeDraft.logoFile);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }

    let isCancelled = false;

    void document.fonts.ready.then(() => {
      if (!isCancelled) {
        setFontLoadVersion((current) => current + 1);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const templateGalleryItems = useMemo<ArtworkTemplateGalleryItem[]>(
    () =>
      ART_TEMPLATE_LIST.map((template) => {
        const templateDraft = storeDraft.artworkTemplates[template.id];
        const artworkAdjustments = templateDraft?.artworkAdjustments ?? {};
        const baseSvg = createCustomizedSvg(
          template,
          artworkText,
          mascotDataUrl,
        );

        return {
          template,
          baseSvg,
          customizedSvg: applySavedArtworkAdjustments(
            baseSvg,
            template.editableElements,
            artworkAdjustments,
          ),
          isSelected: templateDraft?.isSelected ?? false,
          artworkAdjustments,
        };
      }),
    [artworkText, fontLoadVersion, mascotDataUrl, storeDraft.artworkTemplates],
  );

  const editingTemplate = useMemo(
    () =>
      editingTemplateId
        ? (templateGalleryItems.find(
            ({ template }) => template.id === editingTemplateId,
          ) ?? null)
        : null,
    [editingTemplateId, templateGalleryItems],
  );

  const selectedTemplateCount = useMemo(
    () => templateGalleryItems.filter(({ isSelected }) => isSelected).length,
    [templateGalleryItems],
  );

  const updateArtworkText = (field: keyof ArtworkTextDraft, value: string) => {
    updateStoreDraft({
      artworkText: {
        ...storeDraft.artworkText,
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
        title="Choose Your Artwork"
        description="Customize the previews, then select every artwork template you want to use."
        onBack={() => setCurrentStep(2)}
        onNext={() => setCurrentStep(4)}
        nextDisabled={selectedTemplateCount === 0}
        width="wide"
      >
        <div className={styles.editor}>
          <section
            className={styles.controls}
            aria-label="Artwork customization"
          >
            <div className={styles.controlSection}>
              <div className={styles.controlsHeading}>
                <h2>Artwork Text</h2>
                <p>Changes appear in every template preview immediately.</p>
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
                  another file to replace it in every preview.
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

          <section
            className={styles.templateGallery}
            aria-labelledby="artwork-template-gallery-title"
          >
            <div className={styles.templateGalleryHeader}>
              <div>
                <h2 id="artwork-template-gallery-title">Artwork Templates</h2>
                <p>
                  Select any number of templates. Each template keeps its own
                  artwork adjustments.
                </p>
              </div>

              <p className={styles.selectionCount} aria-live="polite">
                {selectedTemplateCount} selected
              </p>
            </div>

            <div className={styles.templateGrid}>
              {templateGalleryItems.map(
                ({ template, customizedSvg, isSelected }) => (
                  <article
                    key={template.id}
                    className={styles.templateCard}
                    data-selected={isSelected}
                  >
                    <div className={styles.templateCardHeader}>
                      <h3>{template.name}</h3>
                    </div>

                    <div className={styles.templateThumbnail}>
                      <ArtTemplatePreview
                        template={template}
                        svg={customizedSvg}
                      />
                    </div>

                    <div className={styles.templateCardActions}>
                      <label className={styles.templateCheckbox}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) =>
                            updateArtworkTemplateDraft(template.id, {
                              isSelected: event.currentTarget.checked,
                            })
                          }
                        />

                        <span>Use this template</span>
                      </label>

                      <button
                        type="button"
                        className={styles.editArtworkButton}
                        aria-label={`Edit ${template.name} artwork`}
                        onClick={() => setEditingTemplateId(template.id)}
                      >
                        <LuPencil aria-hidden="true" />
                        <span>Edit art</span>
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        </div>
      </WizardLayout>

      {editingTemplate && (
        <ArtworkEditorModal
          isOpen
          svg={editingTemplate.baseSvg}
          editableElements={editingTemplate.template.editableElements}
          adjustments={editingTemplate.artworkAdjustments}
          onCancel={() => setEditingTemplateId(null)}
          onSave={(nextAdjustments) => {
            updateArtworkTemplateDraft(editingTemplate.template.id, {
              artworkAdjustments: nextAdjustments,
            });
            setEditingTemplateId(null);
          }}
        />
      )}
    </>
  );
}
