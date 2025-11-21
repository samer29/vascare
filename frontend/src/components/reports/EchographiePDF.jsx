import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/background.png";
import { calculateAge, formatDate } from "../../utils/data";

const EchographiePDF = ({
  patient = {},
  consultation = {},
  echographieForm = {},
  echoType = "normal_h",
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
            - {safe(item)}
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
      normal_h: [
        { key: "Foie", label: "Foie" },
        { key: "Vesicule_biliaire", label: "Vésicule Biliaire" },
        { key: "Voies_biliaires", label: "Voies Biliaires" },
        { key: "TP_VCI_VSH", label: "TP, VCI et VSH" },
        { key: "Reins", label: "Reins (droit et gauche)" },
        { key: "Pancreas", label: "Pancréas" },
        { key: "Rate", label: "Rate" },
        { key: "Vessie", label: "Vessie" },
        { key: "Prostate", label: "Prostate" },
        { key: "Conclusion", label: "Conclusion" },
      ],
      normal_f: [
        { key: "Foie", label: "Foie" },
        { key: "Vesicule_biliaire", label: "Vésicule Biliaire" },
        { key: "Voies_biliaires", label: "Voies Biliaires" },
        { key: "TP_VCI_VSH", label: "TP, VCI et VSH" },
        { key: "Reins", label: "Reins (droit et gauche)" },
        { key: "Pancreas", label: "Pancréas" },
        { key: "Rate", label: "Rate" },
        { key: "Vessie", label: "Vessie" },
        { key: "Utérus", label: "Utérus" },
        { key: "Conclusion", label: "Conclusion" },
      ],
      lithiase_h: [
        { key: "Aérocolie_diffuse", label: "Aérocolie diffuse+++" },
        { key: "Rein_gauche", label: "Rein Gauche" },
        { key: "Rein_droite", label: "Rein Droite" },
        { key: "Vessie", label: "Vessie" },
        { key: "Prostate", label: "Prostate" },
        { key: "Foie", label: "Foie" },
        { key: "Rate", label: "Rate" },
        { key: "Pancreas", label: "Pancréas" },
        { key: "Conclusion", label: "Conclusion" },
      ],
      lithiase_f: [
        { key: "Aérocolie_diffuse", label: "Aérocolie diffuse+++" },
        { key: "Rein_gauche", label: "Rein Gauche" },
        { key: "Rein_droite", label: "Rein Droite" },
        { key: "Vessie", label: "Vessie" },
        { key: "Utérus", label: "Utérus" },
        { key: "Foie", label: "Foie" },
        { key: "Rate", label: "Rate" },
        { key: "Pancreas", label: "Pancréas" },
        { key: "Conclusion", label: "Conclusion" },
      ],
    };

    return fieldConfigs[echoType] || fieldConfigs.normal_h;
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      await waitFor(300);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4", // Changed to A4
      });

      // Render transparent text layer
      const canvas = await html2canvas(pageRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
      });

      const textLayer = canvas.toDataURL("image/png", 1.0);

      // Load your high-res background
      const bg = new Image();
      bg.src = backgroundImage;
      await new Promise((resolve) => (bg.onload = resolve));

      // Add background and overlay text - A4 dimensions: 210x297mm
      pdf.addImage(bg, "PNG", 0, 0, 210, 297);
      pdf.addImage(textLayer, "PNG", 0, 0, 210, 297);

      window.open(pdf.output("bloburl"), "_blank");
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to check if a field has any content
  const hasContent = (fieldKey) => {
    const fieldData = echographieForm[fieldKey];
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
            : "bg-teal-600 text-white hover:bg-teal-700"
        }`}
      >
        {isGenerating ? "⏳ Génération en cours..." : "🖨 Aperçu PDF"}
      </button>

      {/* Hidden content for rendering only */}
      <div
        ref={pageRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm", // A4 width
          height: "297mm", // A4 height
          padding: "15mm 20mm", // More padding for A4
          boxSizing: "border-box",
          fontFamily: "'Century Gothic', 'Arial Narrow', Arial, sans-serif",
          fontSize: "12pt", // Larger font size
          lineHeight: 1.4, // Better line spacing
          color: "#000",
        }}
      >
        {/* Header */}
        <h2
          style={{
            textAlign: "center",
            fontWeight: "bold",
            margin: "22mm 0 6mm 0",
            fontSize: "16pt", // Larger header
            textTransform: "uppercase",
          }}
        >
          COMPTE RENDU D'ÉCHOGRAPHIE ABDOMINALE
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
        {/* Echographie Results - Better spacing */}
        <div style={{ marginBottom: "2mm" }}>
          <h3
            style={{
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "2mm",
              borderBottom: "0.5mm solid #000",
              paddingBottom: "2mm",
              fontSize: "14pt", // Larger section header
            }}
          >
            RÉSULTATS
          </h3>

          {/* Dynamic Fields Based on Echo Type - Better spacing */}
          {getFieldsToRender().map(({ key, label }) => {
            // Skip fields that have no content
            if (!hasContent(key)) return null;

            return (
              <div key={key} style={{ marginBottom: "2mm" }}>
                <h4
                  style={{
                    fontWeight: "bold",
                    marginBottom: "2mm",
                    fontSize: "12pt", // Larger field labels
                  }}
                >
                  {label} :
                </h4>
                {renderList(echographieForm[key] || [])}
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
              Aucun résultat saisi pour cette échographie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EchographiePDF;
