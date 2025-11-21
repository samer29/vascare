// PrintExamensPDF.jsx
import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundA5.png";
import { calculateAge, formatDate } from "../../utils/data";

const PrintExamensPDF = ({
  patient = {},
  consultation = {},
  bioSelected = [],
  explSelected = [],
  biologicalGroups = [],
  explorationGroups = [],
}) => {
  const pageRefs = useRef([]);
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  const splitContentIntoPages = useCallback(() => {
    const allContent = [];

    if (bioSelected.length > 0) {
      allContent.push({
        type: "section",
        title: "EXAMENS BIOLOGIQUES PRESCRITS",
        content: biologicalGroups
          .map((group) => ({
            groupName: group.name,
            items: group.items.filter((item) => bioSelected.includes(item)),
          }))
          .filter((group) => group.items.length > 0),
      });
    }

    if (explSelected.length > 0) {
      allContent.push({
        type: "section",
        title: "EXPLORATIONS FONCTIONNELLES PRESCRITES",
        content: explorationGroups
          .map((group) => ({
            groupName: group.name,
            items: group.items.filter((item) => explSelected.includes(item)),
          }))
          .filter((group) => group.items.length > 0),
      });
    }

    if (allContent.length === 0) return [[]];

    const pages = [];
    let currentPage = [];

    allContent.forEach((section) => {
      const totalItems = section.content.reduce(
        (sum, group) => sum + group.items.length,
        0
      );
      if (totalItems > 20 || currentPage.length > 0) {
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
          currentPage = [];
        }
      }
      currentPage.push(section);
    });

    if (currentPage.length > 0) pages.push(currentPage);
    return pages;
  }, [bioSelected, explSelected, biologicalGroups, explorationGroups]);

  const pagesContent = useMemo(
    () => splitContentIntoPages(),
    [splitContentIntoPages]
  );

  const handleGeneratePDF = async () => {
    try {
      if (
        (!bioSelected || bioSelected.length === 0) &&
        (!explSelected || explSelected.length === 0)
      ) {
        alert("Veuillez sélectionner des examens avant de générer le PDF.");
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

  const pages = pagesContent.map((pageSections, pageIndex) => (
    <div
      key={pageIndex}
      ref={(el) => (pageRefs.current[pageIndex] = el)}
      style={{
        position: "relative",
        width: "148mm",
        height: "210mm",
        boxSizing: "border-box",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: "11pt",
        lineHeight: 1.3,
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

      <div style={{ position: "relative", zIndex: 1, padding: "6mm 8mm" }}>
        <h1
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "16pt",
            margin: "22mm 0 3mm 0",
            textTransform: "uppercase",
          }}
        >
          Examens Complémentaires
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "2mm",
            borderBottom: "1px solid #000",
            paddingBottom: "2mm",
          }}
        >
          <div>
            <p style={{ margin: "0", fontWeight: "bold" }}>
              <span style={{ fontWeight: "normal" }}>Nom & Prénom: </span>
              {patient.nom || patient.Nom} {patient.prenom || patient.Prenom}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0" }}>
              <span style={{ fontWeight: "bold" }}>Âge : </span>
              {calculateAge(patient.dob)} ans
            </p>
            <p style={{ margin: "0" }}>
              <span style={{ fontWeight: "bold" }}>Date : </span>
              {formatDate(consultation.date)}
            </p>
          </div>
        </div>

        <div style={{ marginTop: "3mm" }}>
          {pageSections.map((section, sectionIndex) => (
            <div key={sectionIndex} style={{ marginBottom: "3mm" }}>
              <div
                style={{
                  background: "#f0f7ff",
                  padding: "2mm 3mm",
                  marginBottom: "2mm",
                  borderLeft: "3px solid #2c5aa0",
                  fontWeight: "bold",
                  color: "#2c5aa0",
                  fontSize: "11pt",
                }}
              >
                {section.title}
              </div>

              {section.content.map((group, groupIndex) => (
                <div key={groupIndex} style={{ marginBottom: "2mm" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#495057",
                      marginBottom: "1mm",
                      fontSize: "10pt",
                      paddingLeft: "1mm",
                    }}
                  ></div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "1mm",
                      marginBottom: "2mm",
                      paddingLeft: "2mm",
                    }}
                  >
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        style={{
                          fontSize: "9pt",
                          color: "#030303ff",
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "0.5mm",
                        }}
                      >
                        <span
                          style={{ marginRight: "1mm", fontWeight: "bold" }}
                        >
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  ));

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={
          (!bioSelected || bioSelected.length === 0) &&
          (!explSelected || explSelected.length === 0)
        }
        className="px-5 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        Aperçu PDF Examens
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

export default PrintExamensPDF;
