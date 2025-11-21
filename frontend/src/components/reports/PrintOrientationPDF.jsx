// PrintOrientationPDF.jsx
import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundA5.png";
import { calculateAge, formatDate } from "../../utils/data";

const PrintOrientationPDF = ({
  patient = {},
  consultation = {},
  orientationForm = {},
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
      if (
        !orientationForm.atcd &&
        !orientationForm.presente &&
        !orientationForm.pour
      ) {
        alert("Veuillez remplir au moins un champ avant de générer le PDF.");
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

      <div style={{ position: "relative", zIndex: 1, padding: "15mm 12mm" }}>
        <h1
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "16pt",
            margin: "22mm 0 3mm 0",
            textTransform: "uppercase",
          }}
        >
          Lettre d'orientation
        </h1>

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
                <span style={{ fontWeight: "normal" }}>Nom & Prénom: </span>
                {patient.nom || patient.Nom} {patient.prenom || patient.Prenom}
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

        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "13pt",
            margin: "0 0 10mm 0",
          }}
        >
          CHER(E) CONFRÈRE / CONSOEUR
        </div>

        <div style={{ marginBottom: "8mm", textAlign: "justify" }}>
          <p style={{ margin: "0 0 4mm 0" }}>
            Permettez-moi de vous adresser le (la) sus nommé(e) aux fins de
            votre avis spécialisé.
          </p>

          {orientationForm.atcd && (
            <p style={{ margin: "0 0 4mm 0" }}>
              <span style={{ fontWeight: "bold" }}>ATCDS : </span>
              {orientationForm.atcd}
            </p>
          )}

          {orientationForm.presente && (
            <p style={{ margin: "0 0 4mm 0" }}>
              <span style={{ fontWeight: "bold" }}>Qui présente : </span>
              {orientationForm.presente}
            </p>
          )}

          <div style={{ height: "6mm" }}></div>

          {orientationForm.pour && (
            <div>
              <p style={{ margin: "0 0 2mm 0", fontWeight: "bold" }}>
                POUR : {orientationForm.pour}
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "12mm",
            fontWeight: "bold",
            fontSize: "13pt",
          }}
        >
          Confraternellement
        </div>
      </div>
    </div>
  ));

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={
          !orientationForm.atcd &&
          !orientationForm.presente &&
          !orientationForm.pour
        }
        className="px-5 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        Aperçu PDF Lettre
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

export default PrintOrientationPDF;
