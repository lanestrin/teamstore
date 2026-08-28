export interface DecorationPreviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DecorationPreviewOverrides = Record<string, Record<string, DecorationPreviewBounds>>;

export const decorationPreviewOverrides: DecorationPreviewOverrides = {
  "650SLY": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },

  "689SY": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },

  "689S": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },

  "650SLA": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },

  "6857PY": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },

  "6857P": {
    front: {
      x: 0.285,
      y: 0.382,
      width: 0.18,
      height: 0.42,
    },
  },
};

export function getDecorationPreviewBounds(
  providerProductId: string,
  _colorKey: string,
  view: string,
): DecorationPreviewBounds | undefined {
  return decorationPreviewOverrides[providerProductId]?.[view];
}
