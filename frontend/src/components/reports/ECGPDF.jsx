import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/background.png";
import { calculateAge, formatDate } from "../../utils/data";

const ECGPDF = ({ 
  patient = {}, 
  consultation = {}, 
  ecgForm = {},
  boldFields = {},
  hiddenFields = {},
  customFields = [] 
}) => {
  const pageRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
  const safe = (text) => (text && text.toString().trim() !== "" ? text : "—");

  const renderList = (items, isBold = false) => {
    if (!Array.isArray(items)) return safe(items);

    const filteredItems = items.filter(
      (item) => item && item.toString().trim() !== ""
    );

    return filteredItems.length > 0 ? (
      <ul style={{ listStyleType: "none", paddingLeft: "4mm", margin: "0" }}>
        {filteredItems.map((item, i) => (
          <li
            key={i}
            style={{ 
              lineHeight: "1.4", 
              marginBottom: "1mm", 
              fontSize: isBold ? "12pt" : "11pt",
              fontWeight: isBold ? "bold" : "normal",
              color: isBold ? "#000" : "inherit"
            }}
          >
            - {safe(item)}
          </li>
        ))}
      </ul>
    ) : (
      "—"
    );
  };

  // Helper function to check if a field has any content
  const hasContent = (fieldKey) => {
    const fieldData = ecgForm[fieldKey];
    if (!fieldData || !Array.isArray(fieldData)) return false;
    return fieldData.some((item) => item && item.toString().trim() !== "");
  };

  // Get all fields including custom fields
  const getAllFields = () => {
    const defaultFields = [
      { key: "Examen", label: "EXAMEN" },
      { key: "Electrocardiogramme", label: "Electrocardiogramme" },
      { key: "Conclusion", label: "CONCLUSION" },
    ];

    const customFieldList = customFields.map(field => ({
      key: field.key,
      label: field.label.toUpperCase(),
      isCustom: true
    }));

    return [...defaultFields, ...customFieldList];
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      await waitFor(300);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const canvas = await html2canvas(pageRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
      });

      const textLayer = canvas.toDataURL("image/png", 1.0);

      const bg = new Image();
      bg.src = backgroundImage;
      await new Promise((resolve) => (bg.onload = resolve));

      pdf.addImage(bg, "PNG", 0, 0, 210, 297);
      pdf.addImage(textLayer, "PNG", 0, 0, 210, 297);

      window.open(pdf.output("bloburl"), "_blank");
    } catch (err) {
      console.error("Erreur génération PDF ECG:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const allFields = getAllFields();
  const fieldsWithContent = allFields.filter(({ key }) => 
    !hiddenFields[key] && hasContent(key)
  );

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className={`px-5 py-2 rounded-md shadow text-sm font-medium transition ${
          isGenerating
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isGenerating ? "⏳ Génération en cours..." : "🖨 Aperçu PDF ECG"}
      </button>

      {/* Hidden content for rendering only */}
      <div
        ref={pageRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm",
          height: "297mm",
          padding: "15mm 20mm",
          boxSizing: "border-box",
          fontFamily: "'Century Gothic', 'Arial Narrow', Arial, sans-serif",
          fontSize: "12pt",
          lineHeight: 1.4,
          color: "#000",
        }}
      >
        {/* Header */}
        <h2
          style={{
            textAlign: "center",
            fontWeight: "bold",
            margin: "22mm 0 6mm 0",
            fontSize: "16pt",
            textTransform: "uppercase",
          }}
        >
          COMPTE RENDU D'ÉLECTROCARDIOGRAMME (ECG)
        </h2>

        {/* Patient Information */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "2mm",
            fontSize: "12pt",
          }}
        >
          <p style={{ margin: 0 }}>
            <b>Nom & Prénom:</b> {safe(patient.nom || patient.Nom)}{" "}
            {safe(patient.prenom || patient.Prenom)}
          </p>
          <p style={{ margin: 0 }}>
            <b>Date :</b> {formatDate(consultation.date)}
          </p>
        </div>

        {/* Age */}
        <p style={{ margin: "0 0 2mm 0", fontSize: "12pt" }}>
          <b>Âge :</b> {calculateAge(patient.dob)} ans
        </p>

        {/* Motif + Antécédents */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10mm",
            marginBottom: "6mm",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12pt" }}>
              <b>MOTIF :</b> {safe(consultation.diagnostic)}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "12pt" }}>
              <b>ANTÉCÉDENTS :</b> {renderList(patient.history || [])}
            </p>
          </div>
        </div>

        {/* ECG Results */}
        <div style={{ marginBottom: "2mm" }}>
          <h3
            style={{
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "2mm",
              borderBottom: "0.5mm solid #000",
              paddingBottom: "2mm",
              fontSize: "14pt",
            }}
          >
            RÉSULTATS
          </h3>

          {/* Dynamic Fields */}
          {fieldsWithContent.map(({ key, label }) => {
            const isBold = boldFields[key] || false;
            const isConclusion = key.toLowerCase().includes('conclusion');
            
            return (
              <div key={key} style={{ marginBottom: isConclusion ? "4mm" : "2mm" }}>
                <h4
                  style={{
                    fontWeight: isConclusion ? "bold" : "bold",
                    marginBottom: "2mm",
                    fontSize: isConclusion ? "13pt" : "12pt",
                    color: isConclusion ? "#000" : "inherit",
                    textDecoration: isConclusion ? "underline" : "none"
                  }}
                >
                  {label} :
                </h4>
                {renderList(ecgForm[key] || [], isBold)}
                
                {/* Add extra spacing after conclusion */}
                {isConclusion && <div style={{ height: "2mm" }} />}
              </div>
            );
          })}

          {/* Show message if no fields have content */}
          {fieldsWithContent.length === 0 && (
            <div
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "#666",
                fontSize: "12pt",
                marginTop: "10mm",
              }}
            >
              Aucun résultat saisi pour cet ECG.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ECGPDF;