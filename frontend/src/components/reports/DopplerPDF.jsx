import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/background.png";
import { calculateAge, formatDate } from "../../utils/data";

const DopplerPDF = ({
  patient = {},
  consultation = {},
  dopplerForm = {},
  dopplerType = "MI",
  dopplerSubType = "normal",
  availableFields = [],
  boldFields = {}, // Receive bold fields configuration
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
              color: isBold ? "#000" : "inherit",
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

  // Get doppler type label for the title
  const getDopplerTypeLabel = () => {
    const types = {
      MI: "DES MEMBRES INFÉRIEURS",
      MS: "DES MEMBRES SUPÉRIEURS",
      Porte: "DU SYSTÈME PORTE",
      Renal: "DES ARTÈRES RÉNALES",
      TSA: "DES TRONCS SUPRA-AORTIQUES",
    };
    return types[dopplerType] || "VASCULAIRE";
  };

  // Get sub-type name
  const getSubTypeName = () => {
    const subTypes = {
      MI: [
        { id: "normal", name: "Doppler Normal" },
        { id: "pathological", name: "Doppler Pathologique" },
        { id: "pathological2", name: "Doppler Pathologique 2" },
        { id: "MIAVNORM", name: "Doppler MI et V Norm" },
        { id: "VMIControl", name: "Doppler VMI Contrôle" },
        { id: "VMINormal", name: "Doppler VMI Normal" },
        { id: "VMINormal2", name: "Doppler VMI Normal 2" },
        { id: "VMIPath", name: "Doppler VMI Pathologique" },
        { id: "VMISuperf", name: "Doppler VMI Superficiel" },
      ],
      MS: [
        { id: "AMSnormal", name: "Doppler Normal" },
        { id: "AMSnormal2", name: "Doppler Normal 2" },
        { id: "AMSPatho", name: "Doppler Pathologique" },
        { id: "VMSNormal", name: "VMS Normal" },
        { id: "VMSPatho", name: "VMS Pathologique" },
        { id: "VMSPatho2", name: "VMS Pathologique 2" },
        { id: "VMSoedem", name: "VMS Œdème par compression" },
      ],
      Porte: [
        { id: "path1", name: "Porte Pathologique 1" },
        { id: "path2", name: "Porte Pathologique 2" },
        { id: "path3", name: "Porte Pathologique 3" },
        { id: "path4", name: "Porte Pathologique 4" },
        { id: "path5", name: "Porte Pathologique 5" },
      ],
      Renal: [
        { id: "normal", name: "Artères Rénales Normales" },
        { id: "path", name: "Artères Rénales Pathologiques" },
        { id: "confectionFavNorm", name: "Bilan Confection Fav Norm" },
        { id: "confectionFavPath", name: "Bilan Confection Fav Path" },
        {
          id: "evaluationFavBrachioBasilic",
          name: "Evaluation Fav Brachio Basilic",
        },
        {
          id: "evalutionFavBrachioCephal",
          name: "Evaluation Fav Brachio Cephal",
        },
        { id: "transplantationRenal", name: "Transplantation Rénale" },
        { id: "vrnormal", name: "VR Normal" },
      ],
      TSA: [
        { id: "normal", name: "TSA Normal" },
        { id: "aborddialyse", name: "A Bord Dialyse" },
        { id: "chambreconfection", name: "Chambre Implantable Confection" },
        { id: "chambrethrombosse", name: "Chambre Implantable Thrombosée" },
        { id: "tsaplaque", name: "TSA Plaque" },
        { id: "vcervical", name: "V Cervical" },
      ],
    };

    const subTypeList = subTypes[dopplerType] || [];
    const subType = subTypeList.find((st) => st.id === dopplerSubType);
    return subType ? subType.name : "Standard";
  };

  // Helper function to check if a field has any content
  const hasContent = (fieldKey) => {
    const fieldData = dopplerForm[fieldKey];
    if (!fieldData || !Array.isArray(fieldData)) return false;
    return fieldData.some((item) => item && item.toString().trim() !== "");
  };

  // Get fields that have content for rendering
  const getFieldsWithContent = () => {
    return availableFields.filter((field) => hasContent(field.key));
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
      console.error("Erreur génération PDF Doppler:", err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const fieldsWithContent = getFieldsWithContent();

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
        {isGenerating ? "⏳ Génération en cours..." : "🖨 Aperçu PDF Doppler"}
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
          COMPTE RENDU D'ÉCHO-DOPPLER {getDopplerTypeLabel()}
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

        {/* Doppler Results */}
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
          {/* Dynamic Fields Based on Available Templates */}
          {fieldsWithContent.map((field) => {
            const isBold = boldFields[field.key] || false;
            const isConclusion = field.label
              .toLowerCase()
              .includes("conclusion");

            return (
              <div
                key={field.key}
                style={{ marginBottom: isConclusion ? "4mm" : "2mm" }}
              >
                <h4
                  style={{
                    fontWeight: isConclusion ? "bold" : "bold",
                    marginBottom: "2mm",
                    fontSize: isConclusion ? "13pt" : "12pt",
                    color: isConclusion ? "#000" : "inherit",
                    textDecoration: isConclusion ? "underline" : "none",
                  }}
                >
                  {field.label} :
                </h4>
                {renderList(dopplerForm[field.key] || [], isBold)}

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
              Aucun résultat saisi pour cet examen Doppler.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DopplerPDF;
