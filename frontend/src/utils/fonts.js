// src/utils/fonts.js
import gothicRegular from "../fonts/GOTHIC.TTF";
import gothicBold from "../fonts/GOTHICB.TTF";
import gothicItalic from "../fonts/GOTHICI.TTF";
import gothicBoldItalic from "../fonts/GOTHICBI.TTF";

/**
 * Registers Century Gothic family in a jsPDF instance.
 * Webpack will inline the TTF files as base64 strings so jsPDF.addFileToVFS works.
 */
export function registerCenturyGothic(pdf) {
  try {
    if (!pdf) return;
    // Normal
    pdf.addFileToVFS("GOTHIC.TTF", gothicRegular);
    pdf.addFont("GOTHIC.TTF", "CenturyGothic", "normal");

    // Bold
    pdf.addFileToVFS("GOTHICB.TTF", gothicBold);
    pdf.addFont("GOTHICB.TTF", "CenturyGothic", "bold");

    // Italic
    pdf.addFileToVFS("GOTHICI.TTF", gothicItalic);
    pdf.addFont("GOTHICI.TTF", "CenturyGothic", "italic");

    // BoldItalic
    pdf.addFileToVFS("GOTHICBI.TTF", gothicBoldItalic);
    pdf.addFont("GOTHICBI.TTF", "CenturyGothic", "bolditalic");

    pdf.setFont("CenturyGothic", "normal");
  } catch (err) {
    // If fonts fail, fall back silently (jsPDF will use default fonts)
    // but we log for debug.
    // eslint-disable-next-line no-console
    console.error("registerCenturyGothic error:", err);
  }
}
