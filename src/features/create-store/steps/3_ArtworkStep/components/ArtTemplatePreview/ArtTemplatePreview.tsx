import type { ArtTemplate } from "../../../../../../assets/art-templates";
import styles from "./ArtTemplatePreview.module.scss";

interface ArtTemplatePreviewProps {
  template: ArtTemplate;
  svg?: string;
}

export default function ArtTemplatePreview({ template, svg }: ArtTemplatePreviewProps) {
  return (
    <div
      className={styles.preview}
      role="img"
      aria-label={`${template.name} artwork preview`}
      dangerouslySetInnerHTML={{
        __html: svg ?? template.svg,
      }}
    />
  );
}
