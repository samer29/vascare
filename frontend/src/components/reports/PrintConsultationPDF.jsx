// PrintConsultationPDF.jsx
import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundA5.png";
import { calculateAge, formatDate } from "../../utils/data";

const PrintConsultationPDF = ({
  patient = {},
  consultation = {},
  consultForm = {},
}) => {
  const pageRefs = useRef([]);
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  const splitContentIntoPages = useCallback(() => [[]], []);
  const pagesContent = useMemo(
    () => splitContentIntoPages(),
    [splitContentIntoPages]
  );

  const handleGeneratePDF = async () => {
    try {
      if (!consultation && !consultForm.motif) {
        alert(
          "Veuillez remplir au moins le motif de consultation avant de générer le PDF."
        );
        return;
      }

      await waitFor(300);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < pageRefs.current.length; i++) {
        if (pageRefs.current[i]) {
          if (i > 0) pdf.addPage();
          const canvas = await html2canvas(pageRefs.current[i], {
            scale: 4,
            useCORS: true,
            allowTaint: true,
          });
          const imgData = canvas.toDataURL("image/jpeg", 1.0);
          pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        }
      }

      window.open(pdf.output("bloburl"), "_blank");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF. Voir la console.");
    }
  };

  const pages = pagesContent.map((_, pageIndex) => (
    <div
      key={pageIndex}
      ref={(el) => (pageRefs.current[pageIndex] = el)}
      style={{
        position: "relative",
        width: "210mm",
        height: "297mm",
        boxSizing: "border-box",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "12pt",
        lineHeight: 1.6,
        color: "#000",
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <img
        src={backgroundImage}
        alt="background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "20mm" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "15mm" }}>
          <h1
            style={{
              fontWeight: "bold",
              fontSize: "16pt",
              margin: "22mm 0 3mm 0",
              textTransform: "uppercase",
            }}
          >
            COMPTE RENDU DE CONSULTATION
          </h1>
          <div
            style={{
              borderBottom: "2px solid #000",
              margin: "0 auto 5mm auto",
              width: "60mm",
            }}
          ></div>
        </div>

        {/* Patient Information */}
        <div
          style={{
            marginBottom: "6mm",
            padding: "2mm",
            border: "1px solid #000",
            backgroundColor: "#f8f9fa",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "2mm", width: "50%" }}>
                  <strong>Nom & Prénom:</strong> {patient.nom || patient.Nom}{" "}
                  {patient.prenom || patient.Prenom}
                </td>
                <td style={{ padding: "2mm", width: "25%" }}>
                  <strong>Âge:</strong> {calculateAge(patient.dob)} ans
                </td>
                <td style={{ padding: "2mm", width: "25%" }}>
                  <strong>Date:</strong> {formatDate(consultation?.date)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Consultation Details */}
        <div style={{ marginBottom: "10mm" }}>
          <div style={{ marginBottom: "8mm" }}>
            <h2
              style={{
                fontSize: "13pt",
                fontWeight: "bold",
                marginBottom: "3mm",
                borderBottom: "1px solid #000",
                paddingBottom: "1mm",
              }}
            >
              MOTIF DE CONSULTATION
            </h2>
            <div
              style={{
                minHeight: "20mm",
                padding: "3mm",
                border: "1px solid #ddd",
                borderRadius: "2mm",
                backgroundColor: "#fff",
              }}
            >
              {consultForm.motif || consultation?.Motif || "Non spécifié"}
            </div>
          </div>

          <div style={{ marginBottom: "8mm" }}>
            <h2
              style={{
                fontSize: "12pt",
                fontWeight: "bold",
                marginBottom: "3mm",
                borderBottom: "1px solid #000",
                paddingBottom: "1mm",
              }}
            >
              CONCLUSION ET OBSERVATIONS
            </h2>
            <div
              style={{
                minHeight: "30mm",
                padding: "3mm",
                border: "1px solid #ddd",
                borderRadius: "2mm",
                backgroundColor: "#fff",
              }}
            >
              {consultForm.conclusion ||
                consultation?.Conclusion ||
                "Aucune observation"}
            </div>
          </div>

          <div
            style={{
              marginTop: "5mm",
              padding: "3mm",
              backgroundColor: "#e8f5e8",
              border: "1px solid #4caf50",
              borderRadius: "2mm",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2mm" }}>
                    <strong>Prix de la consultation:</strong>
                  </td>
                  <td style={{ padding: "2mm", textAlign: "right" }}>
                    <strong>
                      {(
                        consultForm.prix ||
                        consultation?.Prix ||
                        0
                      ).toLocaleString("fr-DZ")}{" "}
                      DZD
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: "10mm", textAlign: "right" }}>
          <div style={{ display: "inline-block", textAlign: "center" }}>
            <p
              style={{
                margin: "0",
                paddingTop: "10mm",
                borderTop: "1px solid #000",
                fontWeight: "bold",
              }}
            >
              Signature et cachet
            </p>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "10mm",
            left: "20mm",
            right: "20mm",
            textAlign: "center",
            fontSize: "9pt",
            color: "#666",
            borderTop: "1px solid #ddd",
            paddingTop: "2mm",
          }}
        >
          <p style={{ margin: "0" }}>
            Document médical confidentiel - Ce compte rendu est établi à titre
            informatif pour le patient
          </p>
        </div>
      </div>
    </div>
  ));

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={!consultation && !consultForm.motif}
        className="px-8 py-3 bg-secondary text-text-main rounded-lg hover:bg-secondary-dark flex items-center transition shadow-sm"
      >
        Imprimer Consultation
      </button>

      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0px",
          width: "0px",
          height: "0px",
          overflow: "hidden",
        }}
      >
        {pages}
      </div>
    </div>
  );
};

export default PrintConsultationPDF;
