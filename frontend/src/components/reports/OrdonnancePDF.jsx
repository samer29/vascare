import React, { useRef, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import backgroundImage from "../../assets/backgroundOrdonnace.png";
import { calculateAge, formatDate } from "../../utils/data";

const OrdonnancePDF = ({
  patient = {},
  consultation = {},
  prescriptionItems = [],
  prescriptionDurations = [],
}) => {
  const pageRefs = useRef([]);
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

  const formatPrescriptionInfo = (item, prescriptionDurations = []) => {
    if (item.prescriptionType === "quantite") {
      const qty = parseInt(item.quantite) || 1;
      if (qty === 1) return "1 boite";
      return `${qty} boites`;
    } else {
      // Utiliser displayDuree si disponible
      if (item.displayDuree) {
        return `QSP ${item.displayDuree}`;
      }

      // Chercher dans prescriptionDurations depuis l'API
      if (item.duree && prescriptionDurations.length > 0) {
        const duration = prescriptionDurations.find(
          (d) => d.Days === parseInt(item.duree)
        );
        if (duration) {
          return `QSP ${duration.DisplayText}`;
        }
      }

      // Fallback si rien ne fonctionne
      return `QSP ${item.duree || ""} jours`;
    }
  };

  const splitContentIntoPages = useCallback(() => {
    if (!prescriptionItems || prescriptionItems.length === 0) {
      return [[]];
    }

    const pages = [];
    let currentPageItems = [];
    const maxItemsPerPage = 11;

    let itemsOnCurrentPage = 0;

    prescriptionItems.forEach((item) => {
      if (itemsOnCurrentPage >= maxItemsPerPage) {
        pages.push([...currentPageItems]);
        currentPageItems = [];
        itemsOnCurrentPage = 0;
      }

      currentPageItems.push(item);
      itemsOnCurrentPage++;
    });

    if (currentPageItems.length > 0) {
      pages.push(currentPageItems);
    }

    return pages;
  }, [prescriptionItems]);

  const pagesContent = useMemo(
    () => splitContentIntoPages(),
    [splitContentIntoPages]
  );

  const handleGeneratePDF = async () => {
    try {
      if (!prescriptionItems || prescriptionItems.length === 0) {
        alert(
          "Veuillez ajouter des médicaments à l'ordonnance avant de générer le PDF."
        );
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

          pdf.setFontSize(9);
          pdf.setTextColor(100);
          pdf.setFont("helvetica", "normal");
        }
      }

      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank");
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Erreur lors de la génération du PDF. Voir la console.");
    }
  };

  const renderPageHeader = (pageIndex) => {
    // Only show full header on first page
    if (pageIndex === 0) {
      return (
        <>
          <div style={{ height: "25mm" }}></div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "3mm",
              borderBottom: "0.5px solid #000",
              paddingBottom: "2mm",
              fontSize: "9pt",
            }}
          >
            <div>
              <p style={{ margin: "0", fontWeight: "bold" }}>
                <span style={{ fontWeight: "normal" }}>Nom & Prénom : </span>
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
        </>
      );
    } else {
      // For subsequent pages, just show a simple continuation header
      return (
        <div
          style={{
            padding: "5mm 0 2mm 0",
            borderBottom: "0.5px solid #000",
            marginBottom: "2mm",
            fontSize: "9pt",
          }}
        >
          <p style={{ margin: "0", fontWeight: "bold", textAlign: "center" }}>
            Suite de l'ordonnance - Page {pageIndex + 1}
          </p>
          <p
            style={{
              margin: "1mm 0 0 0",
              textAlign: "center",
              fontSize: "8pt",
            }}
          >
            {patient.nom || patient.Nom} {patient.prenom || patient.Prenom} -{" "}
            {formatDate(consultation.date)}
          </p>
        </div>
      );
    }
  };

  const pages = pagesContent.map((pageItems, pageIndex) => {
    let globalStartIndex = 0;
    for (let i = 0; i < pageIndex; i++) {
      globalStartIndex += pagesContent[i].length;
    }

    return (
      <div
        key={pageIndex}
        ref={(el) => (pageRefs.current[pageIndex] = el)}
        style={{
          position: "relative",
          width: "148mm",
          height: "210mm",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "10pt",
          lineHeight: 1.2,
          color: "#000",
          overflow: "hidden",
          backgroundColor: pageIndex === 0 ? "transparent" : "white",
        }}
      >
        {/* ✅ Background image only on first page */}
        {pageIndex === 0 && (
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
        )}

        {/* Content Layer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: pageIndex === 0 ? "10mm 8mm 5mm 8mm" : "8mm 8mm 5mm 8mm",
            boxSizing: "border-box",
            height: "100%",
          }}
        >
          {renderPageHeader(pageIndex)}

          <div style={{ marginTop: pageIndex === 0 ? "2mm" : "0" }}>
            {pageItems.map((item, itemIndex) => {
              const globalIndex = globalStartIndex + itemIndex;

              return (
                <div
                  key={item.id}
                  style={{
                    marginBottom: "2mm",
                    padding: "1mm 0",
                    borderBottom: "0.3px solid #ddd",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontWeight: "bold",
                        marginRight: "2mm",
                        minWidth: "3mm",
                        fontSize: "9pt",
                      }}
                    >
                      {globalIndex + 1}-
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "0.5mm",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "9pt",
                            textTransform: "uppercase",
                            flex: 1,
                            marginRight: "2mm",
                          }}
                        >
                          {item.medicament}
                        </span>
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "9pt",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatPrescriptionInfo(item)}
                        </span>
                      </div>

                      {item.detail && (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "9pt",
                            color: "#333",
                            marginTop: "0.3mm",
                            fontStyle: "italic",
                          }}
                        >
                          {item.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer for continuation pages */}
          {pageIndex > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: "5mm",
                left: "8mm",
                right: "8mm",
                textAlign: "center",
                fontSize: "8pt",
                color: "#666",
                borderTop: "0.3px solid #ddd",
                paddingTop: "2mm",
              }}
            >
              Page {pageIndex + 1} - {patient.nom || patient.Nom}{" "}
              {patient.prenom || patient.Prenom}
            </div>
          )}
        </div>
      </div>
    );
  });

  return (
    <div>
      <button
        onClick={handleGeneratePDF}
        disabled={!prescriptionItems || prescriptionItems.length === 0}
        className="px-5 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition"
      >
        🖨 Aperçu PDF Ordonnance
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

export default OrdonnancePDF;
