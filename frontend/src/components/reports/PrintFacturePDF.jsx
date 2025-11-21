// PrintFacturePDF.jsx
import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundA5.png";
import {
  convertNumberToWords,
  calculateAge,
  formatDate,
} from "../../utils/data";
import clinicInfo from "../../config/clinicinfo.json";

const PrintFacturePDF = ({
  patient = {},
  consultation = {},
  factureItems = [],
  totalAmount = 0,
}) => {
  const pageRefs = useRef([]);
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  const splitContentIntoPages = useCallback(() => [[]], []);
  const pagesContent = useMemo(() => splitContentIntoPages(), [splitContentIntoPages]);

  const handleGeneratePDF = async () => {
    try {
      if (!consultation) {
        alert("Veuillez sélectionner une consultation avant de générer le PDF.");
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
        fontFamily: "'Century Gothic', 'Arial', sans-serif",
        fontSize: "10pt",
        lineHeight: 1.4,
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

      <div style={{ position: "relative", zIndex: 1, padding: "9mm 9mm" }}>
        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "15pt",
            margin: "14mm 0 4mm 0", // moved slightly lower
            letterSpacing: "0.4mm",
          }}
        >
          FACTURE
        </h1>

        {/* Clinic Info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #000",
            paddingBottom: "2mm",
            marginBottom: "3mm",
          }}
        >
          <div style={{ fontSize: "9pt", color: "#444" }}>
            <p style={{ margin: 0 }}>{clinicInfo.name}</p>
            <p style={{ margin: 0 }}>{clinicInfo.address}</p>
            <p style={{ margin: 0 }}>NIF : {clinicInfo.nif}</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "9pt", color: "#444" }}>
            <p style={{ margin: 0 }}>
              <strong>N° :</strong> {consultation?.id || "—"}/{new Date().getFullYear()}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Date :</strong> {formatDate(consultation?.date)}
            </p>
          </div>
        </div>

        {/* Patient Info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #000",
            paddingBottom: "2mm",
            marginBottom: "4mm",
          }}
        >
          <div style={{ fontSize: "10pt" }}>
            <strong>Nom & Prénom : </strong>
            {patient.nom || patient.Nom} {patient.prenom || patient.Prenom}
          </div>
          <div style={{ fontSize: "10pt" }}>
            <strong>Âge :</strong> {calculateAge(patient.dob)} ans
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #000",
            fontSize: "9.5pt",
            marginBottom: "4mm",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f1f1f1" }}>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                Date
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                Liste des actes
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                Total (DZD)
              </th>
            </tr>
          </thead>
          <tbody>
            {factureItems.map((item, index) => (
              <tr key={index}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {formatDate(consultation?.date)}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {item.Act}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "4px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  {parseFloat(item.PrixAct).toLocaleString("fr-DZ")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#f1f1f1" }}>
              <td
                colSpan="2"
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                Net à payer :
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "4px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {totalAmount.toLocaleString("fr-DZ")} DZD
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Total in Words */}
        <div
          style={{
            padding: "4px 6px",
            backgroundColor: "#fff3cd",
            borderLeft: "3px solid #ffc107",
            fontSize: "9pt",
            marginBottom: "4mm",
          }}
        >
          <em>
            <strong>Arrêtée la présente facture à la somme de :</strong>{" "}
            {convertNumberToWords(totalAmount)} dinars algériens
          </em>
        </div>

        {/* Signature */}
        <div style={{ textAlign: "right", marginTop: "3mm" }}>
          <p
            style={{
              margin: 0,
              fontWeight: "bold",
              borderTop: "1px solid #000",
              display: "inline-block",
              paddingTop: "1.5mm",
              paddingLeft: "10mm",
              paddingRight: "10mm",
            }}
          >
            Signature et cachet
          </p>
        </div>
      </div>
    </div>
  ));

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={!consultation}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        Imprimer Facture PDF
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

export default PrintFacturePDF;
