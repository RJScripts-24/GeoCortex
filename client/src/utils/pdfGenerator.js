import { jsPDF } from "jspdf";

/* ─────────────────────────────
   Utility
───────────────────────────── */
const safe = (v, fallback = "N/A") =>
  v !== undefined && v !== null && v !== "" ? String(v) : fallback;

/* ─────────────────────────────
   PDF Generator
───────────────────────────── */
export const generatePDF = async (data, location) => {
  if (!data) {
    alert("Report data unavailable. Please run analysis again.");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  let y = 20;

  /* ───────── HEADER ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Government of Karnataka", 105, y, { align: "center" });

  y += 8;
  doc.setFontSize(13);
  doc.text(
    "Urban Climate & Heat Island Assessment Report",
    105,
    y,
    { align: "center" }
  );

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Prepared by GeoCortex Environmental Intelligence System",
    105,
    y,
    { align: "center" }
  );

  y += 6;
  doc.line(20, y, 190, y);
  y += 8;

  /* ───────── SECTION 1 ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Location Overview", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Location Name: ${safe(data.location?.name)}`, 25, y);
  y += 5;
  doc.text(`Coordinates: ${safe(data.location?.coordinates)}`, 25, y);
  y += 8;

  /* ───────── STATIC MAP ───────── */
  if (location?.lat && location?.lng) {
    try {
      const mapUrl =
        `/api/static-map` +
        `?center=${location.lat},${location.lng}` +
        `&zoom=14` +
        `&size=600x400` +
        `&maptype=satellite` +
        `&markers=color:red|${location.lat},${location.lng}`;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = mapUrl;

      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      doc.addImage(img, "PNG", 25, y, 160, 85);
      y += 90;
    } catch {
      doc.setFontSize(9);
      doc.text("Map preview unavailable.", 25, y);
      y += 6;
    }
  }

  /* ───────── SECTION 2 ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Thermal Assessment Summary", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Observed Land Surface Temperature: ${safe(
      data.temperature?.value
    )} ${safe(data.temperature?.unit)}`,
    25,
    y
  );
  y += 5;

  doc.text(`Thermal Zone Classification: ${safe(data.zone)}`, 25, y);
  y += 5;
  doc.text(`Risk Status: ${safe(data.status)}`, 25, y);
  y += 8;

  /* ───────── SECTION 3 ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Key Findings", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const summary = doc.splitTextToSize(
    safe(data.analysis?.summary),
    160
  );
  doc.text(summary, 25, y);
  y += summary.length * 5 + 6;

  /* ───────── SECTION 4 ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. Identified Urban Causes", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  (data.analysis?.causes || []).forEach((c, i) => {
    doc.text(`${i + 1}. ${c}`, 25, y);
    y += 5;
  });
  y += 6;

  /* ───────── SECTION 5 ───────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("5. Recommended Mitigation Measures", 20, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  (data.analysis?.actions || []).forEach((a, i) => {
    doc.text(`${i + 1}. ${a}`, 25, y);
    y += 5;
  });

  /* ───────── FOOTER ───────── */
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Disclaimer: This report is generated for planning and environmental assessment purposes only.\nIt does not constitute a legally binding document.",
    105,
    285,
    { align: "center" }
  );

  doc.save("Urban_Heat_Island_Assessment_Report.pdf");
};
