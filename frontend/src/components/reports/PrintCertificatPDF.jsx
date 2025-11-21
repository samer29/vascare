// PrintCertificatPDF.jsx
import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundA5.png";
import { calculateAge, formatDate } from "../../utils/data";

const PrintCertificatPDF = ({
  patient = {},
  consultation = {},
  dureeStop = "",
  certificatDate = "",
}) => {
  const pageRefs = useRef([]);
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  // Format certificat date for display
  const formatCertificatDate = (date) => {
    if (!date) return "—";
    return date.split("-").reverse().join("/");
  };

  // Split content into pages (always one page for certificat)
  const splitContentIntoPages = useCallback(() => {
    return [[]]; // Always one page for certificat
  }, []);

  const pagesContent = useMemo(
    () => splitContentIntoPages(),
    [splitContentIntoPages]
  );

  // Generate PDF
  const handleGeneratePDF = async () => {
    try {
      if (!dureeStop || !certificatDate) {
        alert("Veuillez remplir la durée et la date avant de générer le PDF.");
        return;
      }

      await waitFor(300);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5",
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
          pdf.addImage(imgData, "JPEG", 0, 0, 148, 210);
        }
      }

      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Erreur lors de la génération du PDF. Voir la console.");
    }
  };

  // Dynamic pages
  const pages = pagesContent.map((pageItems, pageIndex) => {
    return (
      <div
        key={pageIndex}
        ref={(el) => (pageRefs.current[pageIndex] = el)}
        style={{
          position: "relative",
          width: "148mm",
          height: "210mm",
          boxSizing: "border-box",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "12pt",
          lineHeight: 1.6,
          color: "#000",
          overflow: "hidden",
        }}
      >
        {/* Background Image – FIXED with <img> */}
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

        {/* Content Layer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "15mm 12mm",
          }}
        >
          {/* Header */}
          <h1
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "16pt",
              margin: "22mm 0 3mm 0",
              textTransform: "uppercase",
            }}
          >
            Certificat d'arrêt de travail
          </h1>

          {/* Patient Info */}
          <div
            style={{
              marginBottom: "8mm",
              paddingBottom: "4mm",
              borderBottom: "1px solid #000",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 2mm 0", fontWeight: "bold" }}>
                  <span style={{ fontWeight: "normal" }}>Nom : & Prénom</span>
                  {patient.nom || patient.Nom}{" "}
                  {patient.prenom || patient.Prenom}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2mm 0" }}>
                  <span style={{ fontWeight: "bold" }}>Âge : </span>
                  {calculateAge(patient.dob)} ans
                </p>
                <p style={{ margin: "0" }}>
                  <span style={{ fontWeight: "bold" }}>Date : </span>
                  {formatDate(consultation.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Certificat Content */}
          <div style={{ marginBottom: "10mm" }}>
            <p style={{ margin: "0 0 6mm 0", textAlign: "justify" }}>
              <span style={{ fontWeight: "bold" }}>
                Je Soussigné
                <span style={{ display: "inline-block", width: "50mm" }}></span>
              </span>
              Certifie avoir vu et examiné à ce jour{"   "}
              <span style={{ display: "inline-block", width: "1mm" }}></span>
              <span style={{ fontWeight: "bold" }}>
                le (a) patient (e) susnommé(e)
              </span>
              , et déclare que son état de santé nécessite un repos avec un
              arrêt de travail de
              <span style={{ fontWeight: "bold" }}>
                <span style={{ display: "inline-block", width: "10mm" }}></span>
                {dureeStop} jour(s)
              </span>
              <span style={{ display: "inline-block", width: "1mm" }}></span>à
              compter du
              <span style={{ fontWeight: "bold" }}>
                <span style={{ display: "inline-block", width: "9mm" }}></span>
                {formatCertificatDate(certificatDate)}
              </span>
              .
            </p>

            {/* Empty lines for spacing */}
            <div style={{ height: "8mm" }}></div>
            <div style={{ height: "8mm" }}></div>

            <p style={{ margin: "8mm 0 0 0", textAlign: "justify" }}>
              Le présent certificat est délivré à l'intéressé(e) pour servir et
              valoir ce que de droit.
            </p>
          </div>

          {/* Signature */}
          <div
            style={{
              textAlign: "right",
              marginTop: "15mm",
              paddingTop: "8mm",
            }}
          >
            <p
              style={{
                margin: "0",
                fontWeight: "bold",
                borderTop: "1px solid #000",
                display: "inline-block",
                paddingTop: "2mm",
                paddingLeft: "15mm",
                paddingRight: "15mm",
              }}
            >
              Signature
            </p>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={!dureeStop || !certificatDate}
        className="px-5 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        Aperçu PDF Certificat
      </button>

      {/* Hidden pages for PDF generation */}
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

export default PrintCertificatPDF;
