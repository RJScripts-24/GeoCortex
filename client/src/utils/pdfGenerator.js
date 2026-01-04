import { jsPDF } from 'jspdf';

export const generatePDF = (analysisText) => {
  const doc = new jsPDF();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(6, 182, 212);
  doc.text("GEOCORTEX AI ANALYSIS REPORT", 20, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
  doc.text("Source: Landsat 9 Satellite Data", 20, 35);
  
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  
  const splitText = doc.splitTextToSize(analysisText || "No analysis data provided.", 170);
  doc.text(splitText, 20, 50);
  
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("CONFIDENTIAL - GEOCORTEX COMMAND CENTER", 105, 280, { align: "center" });
  
  doc.save('GeoCortex_Report.pdf');
};