import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { LuImage, LuPencil, LuUpload } from "react-icons/lu";

import { ART_TEMPLATE_LIST, type ArtTemplate } from "../../../../assets/art-templates";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import ArtworkEditorModal from "./components/ArtworkEditorModal/ArtworkEditorModal";
import ArtTemplatePreview from "./components/ArtTemplatePreview/ArtTemplatePreview";
import UploadedArtCard from "./components/UploadedArtCard/UploadedArtCard";
import UploadedArtworkCard from "./components/UploadedArtworkCard/UploadedArtworkCard";

import styles from "./ArtworkStep.module.scss";
import type { ArtworkAdjustments } from "./lib/artworkEditor";
import type { ArtworkTextDraft } from "../../context/CreateStoreContext.types";

const MAX_MASCOT_FILE_SIZE = 5 * 1024 * 1024;

interface ArtworkTemplateGalleryItem {
  template: ArtTemplate;
  baseSvg: string;
  customizedSvg: string;
  isSelected: boolean;
  artworkAdjustments: ArtworkAdjustments;
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

export default function SelectArtworksStep() {
  const {
    currentStep,
    setCurrentStep,
    storeDraft,
    updateStoreDraft,
    updateArtworkTemplateDraft,
    resolvedArtworkText,
    mascotDataUrl,
    artworkBaseSvgsByTemplateId,
    artworkSvgsByTemplateId,
  } = useCreateStore();

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [mascotError, setMascotError] = useState<string | null>(null);

  const templateGalleryItems = useMemo<ArtworkTemplateGalleryItem[]>(
    () =>
      ART_TEMPLATE_LIST.map((template) => {
        const templateDraft = storeDraft.artworkTemplates[template.id];
        const artworkAdjustments = templateDraft?.artworkAdjustments ?? {};
        const baseSvg = artworkBaseSvgsByTemplateId[template.id] ?? template.svg;
        const customizedSvg = artworkSvgsByTemplateId[template.id] ?? baseSvg;

        return {
          template,
          baseSvg,
          customizedSvg,
          isSelected: templateDraft?.isSelected ?? false,
          artworkAdjustments,
        };
      }),
    [artworkBaseSvgsByTemplateId, artworkSvgsByTemplateId, storeDraft.artworkTemplates],
  );

  const editingTemplate = useMemo(
    () => (editingTemplateId ? (templateGalleryItems.find(({ template }) => template.id === editingTemplateId) ?? null) : null),
    [editingTemplateId, templateGalleryItems],
  );

  const selectedTemplateCount = useMemo(() => templateGalleryItems.filter(({ isSelected }) => isSelected).length, [templateGalleryItems]);

  const [uploadedArtworkPreviews, setUploadedArtworkPreviews] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let isCancelled = false;

    void Promise.all(
      storeDraft.uploadedArtworks.map(async (artwork) => {
        if (artwork.file) {
          const previewUrl = await readFileAsDataUrl(artwork.file);

          return [artwork.id, previewUrl] as const;
        }

        if (artwork.storageUrl) {
          return [artwork.id, artwork.storageUrl] as const;
        }

        return null;
      }),
    )
      .then((entries) => {
        if (isCancelled) {
          return;
        }

        const validEntries = entries.filter((entry): entry is readonly [string, string] => entry !== null);

        setUploadedArtworkPreviews(new Map(validEntries));
      })
      .catch((error) => {
        console.error("Could not build uploaded artwork previews.", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [storeDraft.uploadedArtworks]);

  function updateArtworkText(field: keyof ArtworkTextDraft, value: string) {
    updateStoreDraft({
      artworkText: {
        ...storeDraft.artworkText,
        [field]: value,
      },
    });
  }

  function handleArtworkFilesAdded(files: File[]) {
    const newArtworks = files.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      file,
      storageId: null,
      storageUrl: null,
      isSelected: false,
    }));

    updateStoreDraft({
      uploadedArtworks: [...storeDraft.uploadedArtworks, ...newArtworks],
    });
  }

  function handleArtworkRemove(artworkId: string) {
    updateStoreDraft({
      uploadedArtworks: storeDraft.uploadedArtworks.filter((artwork) => artwork.id !== artworkId),
    });
  }

  function handleUploadedArtworkSelectionChange(artworkId: string, isSelected: boolean) {
    updateStoreDraft({
      uploadedArtworks: storeDraft.uploadedArtworks.map((artwork) =>
        artwork.id === artworkId
          ? {
              ...artwork,
              isSelected,
            }
          : artwork,
      ),
    });
  }

  function handleMascotChange(event: ChangeEvent<HTMLInputElement>) {
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
  }

  return (
    <>
      <WizardLayout
        step={currentStep}
        title="Choose Your Artwork"
        description="Customize a template, upload your own art, or continue without artwork."
        onBack={() => setCurrentStep(2)}
        onNext={() => setCurrentStep(4)}
        width="wide"
      >
        <div className={styles.editor}>
          <section className={styles.controls} aria-label="Artwork customization">
            <div className={styles.controlSection}>
              <div className={styles.controlsHeading}>
                <h2>Artwork Text</h2>
                <p>Customize the text used across your artwork templates.</p>
              </div>

              <label className={styles.field}>
                <span>Line 1</span>
                <input
                  type="text"
                  placeholder="Line 1"
                  value={resolvedArtworkText.organizationName}
                  onChange={(event) => updateArtworkText("organizationName", event.currentTarget.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Line 2</span>
                <input
                  type="text"
                  placeholder="Line 2"
                  value={resolvedArtworkText.mascotName}
                  onChange={(event) => updateArtworkText("mascotName", event.currentTarget.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Established year</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={resolvedArtworkText.yearEstablished}
                  onChange={(event) => updateArtworkText("yearEstablished", event.currentTarget.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
            </div>

            <div className={styles.divider} />

            <div className={styles.controlSection}>
              <div className={styles.controlsHeading}>
                <h2>Mascot</h2>
                <p>The mascot uploaded earlier is loaded automatically. Upload another file to replace it in every preview.</p>
              </div>

              <div className={styles.mascotCard}>
                <div className={styles.mascotThumbnail}>
                  {mascotDataUrl ? <img src={mascotDataUrl} alt="Current mascot" /> : <LuImage aria-hidden="true" />}
                </div>

                <div className={styles.mascotDetails}>
                  <strong>{storeDraft.logoFile?.name ?? (storeDraft.logoStorageId ? "Saved mascot" : "No mascot uploaded")}</strong>
                  <span>{storeDraft.logoFile ? formatFileSize(storeDraft.logoFile.size) : "PNG, JPG, or SVG · Maximum 5 MB"}</span>

                  <label className={styles.replaceButton}>
                    <LuUpload aria-hidden="true" />
                    {storeDraft.logoFile || storeDraft.logoStorageId ? "Replace mascot" : "Upload mascot"}
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
                  This draft has a stored mascot, but its public URL is not loaded in the current wizard state. Uploading a replacement will
                  preview it immediately.
                </p>
              )}
            </div>
          </section>

          <section className={styles.templateGallery} aria-labelledby="artwork-template-gallery-title">
            <UploadedArtCard onFilesAdded={handleArtworkFilesAdded} />

            {storeDraft.uploadedArtworks.length > 0 && (
              <div className={styles.uploadedArtworkGrid}>
                {storeDraft.uploadedArtworks.map((artwork) => {
                  return (
                    <UploadedArtworkCard
                      key={artwork.id}
                      fileName={artwork.fileName}
                      previewUrl={uploadedArtworkPreviews.get(artwork.id)}
                      isSelected={artwork.isSelected}
                      onSelectionChange={(checked) => handleUploadedArtworkSelectionChange(artwork.id, checked)}
                      onRemove={() => handleArtworkRemove(artwork.id)}
                    />
                  );
                })}
              </div>
            )}

            <div className={styles.templateGalleryHeader}>
              <div>
                <h2 id="artwork-template-gallery-title">Artwork Templates</h2>
                <p>Select any templates you want to use, or continue without artwork.</p>
              </div>

              <p className={styles.selectionCount} aria-live="polite">
                {selectedTemplateCount} selected
              </p>
            </div>

            <div className={styles.templateGrid}>
              {templateGalleryItems.map(({ template, customizedSvg, isSelected }) => (
                <article key={template.id} className={styles.templateCard} data-selected={isSelected}>
                  <div className={styles.templateCardHeader}>
                    <h3>{template.name}</h3>
                  </div>

                  <div className={styles.templateThumbnail}>
                    <ArtTemplatePreview template={template} svg={customizedSvg} />
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
              ))}
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
