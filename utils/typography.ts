import type { FontMetrics } from 'capsize';

const robotoFontMetrics: FontMetrics = {
  ascent: 1900,
  capHeight: 1456,
  descent: -500,
  lineGap: 0,
  unitsPerEm: 2048,
};

const segoeUiFontMetrics: FontMetrics = {
  ascent: 2210,
  capHeight: 1434,
  descent: -514,
  lineGap: 0,
  unitsPerEm: 2048,
};

const sfProFontMetrics: FontMetrics = {
  ascent: 1950,
  capHeight: 1450,
  descent: -420,
  lineGap: 0,
  unitsPerEm: 2048,
};

export function getFontMetricsFromUserAgent(): FontMetrics {
  // This try/catch is a workaround for `typeof window === 'undefined'` not
  // working here.
  try {
    const userAgent = window.navigator.userAgent;

    if (/iPhone|iPad|iPod|Mac/.test(userAgent)) {
      return sfProFontMetrics;
    } else if (/Windows/.test(userAgent)) {
      return segoeUiFontMetrics;
    } else {
      return robotoFontMetrics;
    }
  } catch {
    return sfProFontMetrics;
  }
}
