import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/background.png";
import schemaImage from "../../assets/schema.png";
import { calculateAge, formatDate } from "../../utils/data";

const ThyroidePDF = ({
  patient = {},
  consultation = {},
  thyroideForm = {},
  thyroideType = "avec_schema",
}) => {
  const pageRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
  const safe = (text) => (text && text.toString().trim() !== "" ? text : "—");

  const renderList = (items) => {
    if (!Array.isArray(items)) return safe(items);

    const filteredItems = items.filter(
      (item) => item && item.toString().trim() !== ""
    );

    return filteredItems.length > 0 ? (
      <ul style={{ listStyleType: "none", paddingLeft: "4mm", margin: "0" }}>
        {filteredItems.map((item, i) => (
          <li
            key={i}
            style={{ lineHeight: "1.4", marginBottom: "1mm", fontSize: "11pt" }}
          >
            {safe(item)}
          </li>
        ))}
      </ul>
    ) : (
      "—"
    );
  };

  // Field configurations for each type
  const getFieldsToRender = () => {
    const fieldConfigs = {
      avec_schema: [
        { key: "Indication", label: "INDICATION" },
        { key: "Technique", label: "TECHNIQUE" },
        { key: "Resultats", label: "RÉSULTATS" },
        { key: "Conclusion", label: "CONCLUSION" },
        { key: "CAT", label: "CONDUITE À TENIR" },
      ],
      sans_schema: [
        { key: "Technique", label: "TECHNIQUE" },
        { key: "Resultats", label: "RÉSULTATS" },
        { key: "Conclusion", label: "CONCLUSION" },
        { key: "CAT", label: "CONDUITE À TENIR" },
      ],
      thyroidectomie: [
        { key: "Technique", label: "TECHNIQUE" },
        { key: "Resultats", label: "RÉSULTATS" },
        { key: "Conclusion", label: "CONCLUSION" },
        { key: "CAT", label: "CONDUITE À TENIR" },
      ],
      thyroidite: [
        { key: "Technique", label: "TECHNIQUE" },
        { key: "Resultats", label: "RÉSULTATS" },
        { key: "Conclusion", label: "CONCLUSION" },
        { key: "CAT", label: "CONDUITE À TENIR" },
      ],
    };

    return fieldConfigs[thyroideType] || fieldConfigs.avec_schema;
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

      //  Render text layer using html2canvas
      const canvas = await html2canvas(pageRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
      });

      const textLayer = canvas.toDataURL("image/png", 1.0);

      // Load background
      const bg = new Image();
      bg.src = backgroundImage;
      await new Promise((resolve) => (bg.onload = resolve));

      // Add background + text
      pdf.addImage(bg, "PNG", 0, 0, 210, 297);
      pdf.addImage(textLayer, "PNG", 0, 0, 210, 297);

      // ⭐⭐⭐ ADD SCHEMA IMAGE ONLY FOR "avec_schema" ⭐⭐⭐
      if (thyroideType === "avec_schema") {
        const schema = new Image();
        schema.src = schemaImage;

        await new Promise((resolve) => (schema.onload = resolve));

        // Display at bottom-right
        const imgWidth = 70; // adjust size as needed
        const imgHeight = 70; // adjust size as needed

        const x = 210 - imgWidth - 10; // 10mm from right border
        const y = 297 - imgHeight - 10; // 10mm from bottom border

        pdf.addImage(schema, "PNG", x, y, imgWidth, imgHeight);
      }

      // Open PDF preview
      window.open(pdf.output("bloburl"), "_blank");
    } catch (err) {
      console.error("Erreur génération PDF Thyroïde:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to check if a field has any content
  const hasContent = (fieldKey) => {
    const fieldData = thyroideForm[fieldKey];
    if (!fieldData || !Array.isArray(fieldData)) return false;

    return fieldData.some((item) => item && item.toString().trim() !== "");
  };

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className={`px-5 py-2 rounded-md shadow text-sm font-medium transition ${
          isGenerating
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-purple-600 text-white hover:bg-purple-700"
        }`}
      >
        {isGenerating ? "⏳ Génération en cours..." : "🖨 Aperçu PDF Thyroïde"}
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
          COMPTE RENDU D'ÉCHOGRAPHIE THYROÏDIENNE
        </h2>

        {/* Patient Information - Better spaced */}
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

        {/* Motif + Antécédents - Better spacing */}
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

        {/* Thyroide Results - Better spacing */}
        <div style={{ marginBottom: "2mm" }}>
          {/* Dynamic Fields Based on Thyroide Type - Better spacing */}
          {getFieldsToRender().map(({ key, label }) => {
            // Skip fields that have no content
            if (!hasContent(key)) return null;

            return (
              <div key={key} style={{ marginBottom: "3mm" }}>
                <h4
                  style={{
                    fontWeight: "bold",
                    marginBottom: "2mm",
                    fontSize: "12pt",
                    textTransform: "uppercase",
                  }}
                >
                  {label} :
                </h4>
                {renderList(thyroideForm[key] || [])}
              </div>
            );
          })}

          {/* Show message if no fields have content */}
          {getFieldsToRender().every(({ key }) => !hasContent(key)) && (
            <div
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "#666",
                fontSize: "12pt",
                marginTop: "10mm",
              }}
            >
              Aucun résultat saisi pour cet examen thyroïdien.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThyroidePDF;
