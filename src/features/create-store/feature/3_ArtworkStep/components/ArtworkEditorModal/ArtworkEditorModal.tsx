import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  LuArrowDown,
  LuArrowLeft,
  LuArrowRight,
  LuArrowUp,
  LuRotateCcw,
  LuX,
} from "react-icons/lu";

import type { ArtTemplateEditableElement } from "../../../../../../assets/art-templates";
import {
  applyArtworkAdjustments,
  constrainArtworkAdjustment,
  type ArtworkAdjustments,
  type ArtworkElementAdjustment,
} from "../../artworkEditor";

import styles from "./ArtworkEditorModal.module.scss";

const MOVE_STEP = 5;

interface ArtworkEditorModalProps {
  isOpen: boolean;
  svg: string;
  editableElements: readonly ArtTemplateEditableElement[];
  adjustments: ArtworkAdjustments;
  onCancel: () => void;
  onSave: (adjustments: ArtworkAdjustments) => void;
}

interface SvgPoint {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  elementId: string;
  startPoint: SvgPoint;
  startAdjustment: ArtworkElementAdjustment;
}

function cloneAdjustments(adjustments: ArtworkAdjustments): ArtworkAdjustments {
  return Object.fromEntries(
    Object.entries(adjustments).map(([elementId, adjustment]) => [
      elementId,
      {
        x: adjustment.x,
        y: adjustment.y,
      },
    ]),
  );
}

function createEditorSvg(
  svg: string,
  editableElements: readonly ArtTemplateEditableElement[],
  adjustments: ArtworkAdjustments,
  selectedElementId: string | null,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error("The artwork SVG could not be parsed.");
    return svg;
  }

  applyArtworkAdjustments(svgDocument, editableElements, adjustments);

  for (const editableElement of editableElements) {
    const element = svgDocument.getElementById(editableElement.id);

    if (!element) {
      continue;
    }

    element.setAttribute("data-artwork-editor-element", editableElement.id);

    element.setAttribute(
      "data-artwork-editor-movement",
      editableElement.movement,
    );

    if (editableElement.id === selectedElementId) {
      element.setAttribute("data-artwork-editor-selected", "true");
    }
  }

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}

function screenPointToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): SvgPoint | null {
  const matrix = svg.getScreenCTM();

  if (!matrix) {
    return null;
  }

  const point = svg.createSVGPoint();

  point.x = clientX;
  point.y = clientY;

  const transformedPoint = point.matrixTransform(matrix.inverse());

  return {
    x: transformedPoint.x,
    y: transformedPoint.y,
  };
}

function getElementAdjustment(
  adjustments: ArtworkAdjustments,
  elementId: string,
): ArtworkElementAdjustment {
  return (
    adjustments[elementId] ?? {
      x: 0,
      y: 0,
    }
  );
}

export default function ArtworkEditorModal({
  isOpen,
  svg,
  editableElements,
  adjustments,
  onCancel,
  onSave,
}: ArtworkEditorModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [draftAdjustments, setDraftAdjustments] = useState<ArtworkAdjustments>(
    {},
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftAdjustments(cloneAdjustments(adjustments));

    setSelectedElementId(editableElements[0]?.id ?? null);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, adjustments, editableElements]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  const selectedElement = editableElements.find(
    (element) => element.id === selectedElementId,
  );

  const selectedAdjustment = selectedElementId
    ? getElementAdjustment(draftAdjustments, selectedElementId)
    : {
        x: 0,
        y: 0,
      };

  const editorSvg = useMemo(
    () =>
      createEditorSvg(
        svg,
        editableElements,
        draftAdjustments,
        selectedElementId,
      ),
    [svg, editableElements, draftAdjustments, selectedElementId],
  );

  if (!isOpen) {
    return null;
  }

  const updateSelectedAdjustment = (deltaX: number, deltaY: number) => {
    if (!selectedElement) {
      return;
    }

    setDraftAdjustments((current) => {
      const currentAdjustment = getElementAdjustment(
        current,
        selectedElement.id,
      );

      const nextAdjustment = constrainArtworkAdjustment(
        {
          x: currentAdjustment.x + deltaX,
          y: currentAdjustment.y + deltaY,
        },
        selectedElement.movement,
      );

      return {
        ...current,
        [selectedElement.id]: nextAdjustment,
      };
    });
  };

  const resetSelectedAdjustment = () => {
    if (!selectedElementId) {
      return;
    }

    setDraftAdjustments((current) => {
      const next = {
        ...current,
      };

      delete next[selectedElementId];

      return next;
    });
  };

  const resetAllAdjustments = () => {
    setDraftAdjustments({});
  };

  const handlePreviewPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const editableTarget = target.closest("[data-artwork-editor-element]");

    if (!editableTarget) {
      return;
    }

    const elementId = editableTarget.getAttribute(
      "data-artwork-editor-element",
    );

    if (!elementId) {
      return;
    }

    const editableElement = editableElements.find(
      (element) => element.id === elementId,
    );

    if (!editableElement) {
      return;
    }

    setSelectedElementId(elementId);

    if (editableElement.movement === "none" || event.button !== 0) {
      return;
    }

    const svgElement = previewRef.current?.querySelector("svg");

    if (!(svgElement instanceof SVGSVGElement)) {
      return;
    }

    const startPoint = screenPointToSvgPoint(
      svgElement,
      event.clientX,
      event.clientY,
    );

    if (!startPoint) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      elementId,
      startPoint,
      startAdjustment: getElementAdjustment(draftAdjustments, elementId),
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    event.preventDefault();
  };

  const handlePreviewPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const editableElement = editableElements.find(
      (element) => element.id === dragState.elementId,
    );

    if (!editableElement) {
      return;
    }

    const svgElement = previewRef.current?.querySelector("svg");

    if (!(svgElement instanceof SVGSVGElement)) {
      return;
    }

    const currentPoint = screenPointToSvgPoint(
      svgElement,
      event.clientX,
      event.clientY,
    );

    if (!currentPoint) {
      return;
    }

    const nextAdjustment = constrainArtworkAdjustment(
      {
        x:
          dragState.startAdjustment.x + currentPoint.x - dragState.startPoint.x,
        y:
          dragState.startAdjustment.y + currentPoint.y - dragState.startPoint.y,
      },
      editableElement.movement,
    );

    setDraftAdjustments((current) => ({
      ...current,
      [dragState.elementId]: nextAdjustment,
    }));
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const canMoveHorizontally =
    selectedElement?.movement === "horizontal" ||
    selectedElement?.movement === "both";

  const canMoveVertically =
    selectedElement?.movement === "vertical" ||
    selectedElement?.movement === "both";

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artwork-editor-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="artwork-editor-title">Edit Artwork</h2>

            <p>Select an element, then drag it or use the movement controls.</p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            aria-label="Close artwork editor"
            onClick={onCancel}
          >
            <LuX aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div
            ref={previewRef}
            className={styles.canvas}
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={finishDragging}
            onPointerCancel={finishDragging}
            dangerouslySetInnerHTML={{
              __html: editorSvg,
            }}
          />

          <aside className={styles.sidebar}>
            <div>
              <h3>Elements</h3>
            </div>

            <div className={styles.elementList}>
              {editableElements.map((element) => (
                <button
                  key={element.id}
                  type="button"
                  className={styles.elementButton}
                  data-selected={element.id === selectedElementId}
                  onClick={() => setSelectedElementId(element.id)}
                >
                  {element.label}
                </button>
              ))}
            </div>

            <div>
              <h3>{selectedElement?.label ?? "Select an element"}</h3>

              {selectedElement?.movement === "none" && (
                <p className={styles.position}>This element is locked.</p>
              )}
            </div>

            <div className={styles.movement}>
              <button
                type="button"
                className={`${styles.moveButton} ${styles.moveUp}`}
                aria-label="Move selected element up"
                disabled={!canMoveVertically}
                onClick={() => updateSelectedAdjustment(0, -MOVE_STEP)}
              >
                <LuArrowUp aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`${styles.moveButton} ${styles.moveLeft}`}
                aria-label="Move selected element left"
                disabled={!canMoveHorizontally}
                onClick={() => updateSelectedAdjustment(-MOVE_STEP, 0)}
              >
                <LuArrowLeft aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`${styles.moveButton} ${styles.resetSelected}`}
                aria-label="Reset selected element position"
                disabled={!selectedElement}
                onClick={resetSelectedAdjustment}
              >
                <LuRotateCcw aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`${styles.moveButton} ${styles.moveRight}`}
                aria-label="Move selected element right"
                disabled={!canMoveHorizontally}
                onClick={() => updateSelectedAdjustment(MOVE_STEP, 0)}
              >
                <LuArrowRight aria-hidden="true" />
              </button>

              <button
                type="button"
                className={`${styles.moveButton} ${styles.moveDown}`}
                aria-label="Move selected element down"
                disabled={!canMoveVertically}
                onClick={() => updateSelectedAdjustment(0, MOVE_STEP)}
              >
                <LuArrowDown aria-hidden="true" />
              </button>
            </div>

            <p className={styles.position}>
              X: {Math.round(selectedAdjustment.x)} · Y:{" "}
              {Math.round(selectedAdjustment.y)}
            </p>

            <button
              type="button"
              className={`${styles.button} ${styles.resetAll}`}
              onClick={resetAllAdjustments}
            >
              Reset All Positions
            </button>
          </aside>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.button} onClick={onCancel}>
            Cancel
          </button>

          <button
            type="button"
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => onSave(cloneAdjustments(draftAdjustments))}
          >
            Save Changes
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
