import React, { useState, useEffect } from "react";
import { PlusCircleIcon, TrashIcon, RefreshCwIcon } from "./Icons";
import api from "../utils/api";
import { toast } from "react-toastify";
import PrintFacturePDF from "./reports/PrintFacturePDF";
import { convertNumberToWords, calculateAge } from "../utils/data";
import clinicInfo from "../config/clinicinfo.json";
import { DollarSignIcon } from "./icons/DollarSignIcon";
const FactureManager = ({ patient, consultation, consultForm }) => {
  const [factureItems, setFactureItems] = useState([]);
  const [newItem, setNewItem] = useState({
    act: "",
    prix: "",
  });
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [factureStatus, setFactureStatus] = useState("unpaid"); // unpaid, paid, partial
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [availableActs, setAvailableActs] = useState([]);

  useEffect(() => {
    if (consultation?.id) {
      loadFactureItems();
      loadFactureStatus();
      loadMedicalActs(); // ← Add this
    }
  }, [consultation?.id]);
  const loadMedicalActs = async () => {
    try {
      const res = await api.get("/medical-acts");
      setAvailableActs(res.data);
      console.log("Available medical acts loaded:", res.data);
    } catch (err) {
      console.error("Error loading medical acts:", err);
      // Fallback to default acts if API fails
      setAvailableActs([
        { name: "Consultation", defaultPrice: 2000 },
        { name: "Anuscopie", defaultPrice: 3500 },
        // ... other default acts
      ]);
    }
  };
  const loadFactureItems = async () => {
    try {
      const res = await api.get(`/factures?consultationId=${consultation.id}`);

      // Filter out duplicate consultation items (keep only the most recent one)
      const items = res.data || [];
      const consultationItems = items.filter(
        (item) => item.Act === "Consultation"
      );

      if (consultationItems.length > 1) {
        // Keep only the most recent consultation item, delete others
        const [latestConsultation, ...duplicates] = consultationItems.sort(
          (a, b) =>
            new Date(b.createdAt || b.ID) - new Date(a.createdAt || a.ID)
        );

        // Delete duplicates
        for (const duplicate of duplicates) {
          await api.delete(`/factures/${duplicate.ID}`);
        }

        // Set items without duplicates
        const filteredItems = items.filter(
          (item) =>
            item.Act !== "Consultation" || item.ID === latestConsultation.ID
        );
        setFactureItems(filteredItems);
      } else {
        setFactureItems(items);
      }
    } catch (err) {
      console.error("Error loading facture items:", err);
      toast.error("Erreur lors du chargement des éléments de facture");
    }
  };
  const loadFactureStatus = async () => {
    try {
      const res = await api.get(
        `/factures/status?consultationId=${consultation.id}`
      );
      if (res.data) {
        setFactureStatus(res.data.status || res.data.Status || "unpaid");
        setPaidAmount(res.data.paidAmount || res.data.PaidAmount || 0);
        setPaymentDate(res.data.paymentDate || res.data.PaymentDate || "");
      }
    } catch (err) {
      console.error("Error loading facture status:", err);
      // Set default values if API fails
      setFactureStatus("unpaid");
      setPaidAmount(0);
      setPaymentDate("");
    }
  };

  // Sync consultation price with facture - ONLY when explicitly called
  const syncConsultationPrice = async () => {
    if (!consultation?.id || !consultForm?.prix) return;

    try {
      setSyncLoading(true);

      // Check if consultation item already exists
      const existingConsultationItem = factureItems.find(
        (item) => item.Act === "Consultation"
      );

      if (existingConsultationItem) {
        // Update existing consultation item only if price changed
        if (parseFloat(existingConsultationItem.PrixAct) !== consultForm.prix) {
          await api.put(`/factures/${existingConsultationItem.ID}`, {
            PrixAct: consultForm.prix,
          });
          toast.success("Prix de consultation mis à jour");
        } else {
          toast.info("Le prix de consultation est déjà à jour");
          return; // Exit early if no change needed
        }
      } else {
        // Create new consultation item only if it doesn't exist
        await api.post("/factures", {
          IDConsultation: consultation.id,
          Act: "Consultation",
          PrixAct: consultForm.prix,
        });
        toast.success("Article consultation ajouté à la facture");
      }

      await loadFactureItems();
    } catch (err) {
      console.error("Error syncing consultation price:", err);
      toast.error("Erreur lors de la synchronisation du prix");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.act || !newItem.prix) {
      toast.error("Veuillez sélectionner un acte et entrer un prix");
      return;
    }

    setLoading(true);
    try {
      await api.post("/factures", {
        IDConsultation: consultation.id,
        Act: newItem.act,
        PrixAct: parseFloat(newItem.prix),
      });

      setNewItem({ act: "", prix: "" });
      await loadFactureItems();
      toast.success("Acte ajouté à la facture");
    } catch (err) {
      console.error("Error adding facture item:", err);
      toast.error("Erreur lors de l'ajout de l'acte");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Supprimer cet acte de la facture ?")) return;

    try {
      await api.delete(`/factures/${itemId}`);
      await loadFactureItems();
      toast.success("Acte supprimé de la facture");
    } catch (err) {
      console.error("Error deleting facture item:", err);
      toast.error("Erreur lors de la suppression");
    }
  };

  const calculateTotal = () => {
    return factureItems.reduce(
      (total, item) => total + (parseFloat(item.PrixAct) || 0),
      0
    );
  };

  const handleUpdatePayment = async () => {
    try {
      await api.post("/factures/update-payment", {
        consultationId: consultation.id,
        status: factureStatus,
        paidAmount: parseFloat(paidAmount),
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        totalAmount: calculateTotal(),
      });

      toast.success("Statut de paiement mis à jour");
      await loadFactureStatus(); // Reload the status after update
    } catch (err) {
      console.error("Error updating payment:", err);
      toast.error("Erreur lors de la mise à jour du paiement");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "partial":
        return "Partiellement Payée";
      case "unpaid":
        return "Impayée";
      default:
        return "Inconnu";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            Gestion des Factures
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={syncConsultationPrice}
              disabled={syncLoading || !consultForm?.prix}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              <RefreshCwIcon
                className={`h-4 w-4 mr-2 ${syncLoading ? "animate-spin" : ""}`}
              />
              {syncLoading ? "Synchronisation..." : "Synchroniser Prix"}
            </button>
            <div
              className={`px-4 py-2 rounded-full border-2 ${getStatusColor(
                factureStatus
              )}`}
            >
              <span className="font-semibold">
                {getStatusText(factureStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Prix Consultation</p>
                <p className="text-xl font-bold text-blue-800">
                  {consultForm?.prix?.toLocaleString("fr-DZ") || 0} DZD
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Total Facture</p>
                <p className="text-xl font-bold text-purple-800">
                  {calculateTotal().toLocaleString("fr-DZ")} DZD
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Payé</p>
                <p className="text-xl font-bold text-green-800">
                  {paidAmount.toLocaleString("fr-DZ")} DZD
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <DollarSignIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-600">Reste à Payer</p>
                <p className="text-xl font-bold text-orange-800">
                  {(calculateTotal() - paidAmount).toLocaleString("fr-DZ")} DZD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Add Items and Payment Management */}
        <div className="space-y-6">
          {/* Add New Item Form */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">
              Ajouter un acte à la facture
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Acte médical
                </label>
                <select
                  value={newItem.act}
                  onChange={(e) => {
                    const selectedAct = availableActs.find(
                      (act) => act.name === e.target.value
                    );
                    setNewItem({
                      act: e.target.value,
                      prix: selectedAct
                        ? selectedAct.defaultPrice || selectedAct.default_price
                        : "", // Fixed this line
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un acte</option>
                  {availableActs.map((act) => (
                    <option key={act.name} value={act.name}>
                      {act.name}
                      {/* -{" "}
                      {parseFloat(
                        act.defaultPrice || act.default_price || 0
                      ).toLocaleString("fr-DZ")}{" "}
                      DZD */}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Prix (DZD)
                </label>
                <input
                  type="number"
                  value={newItem.prix}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, prix: e.target.value }))
                  }
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <button
                onClick={handleAddItem}
                disabled={loading || !newItem.act || !newItem.prix}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition font-semibold"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                {loading ? "Ajout..." : "Ajouter à la Facture"}
              </button>
            </div>
          </div>

          {/* Payment Management */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold mb-4 text-gray-800">
              Gestion du Paiement
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Statut de Paiement
                </label>
                <select
                  value={factureStatus}
                  onChange={(e) => setFactureStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unpaid">Impayée</option>
                  <option value="partial">Partiellement Payée</option>
                  <option value="paid">Payée</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Montant Payé (DZD)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max={calculateTotal()}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {calculateTotal().toLocaleString("fr-DZ")} DZD
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Date de Paiement
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleUpdatePayment}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center transition font-semibold"
              >
                <DollarSignIcon className="h-5 w-5 mr-2" />
                Mettre à Jour le Paiement
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Invoice Preview */}
        <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-inner">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div className="text-left">
              <p className="text-sm text-gray-600 mb-1">
                NIF: {clinicInfo.nif}
              </p>
              <p className="text-sm text-gray-600">{clinicInfo.name}</p>
              <p className="text-sm text-gray-600">{clinicInfo.address}</p>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">FACTURE</h2>
              <p className="text-sm text-gray-600 mt-1">
                N° {consultation?.id}/{new Date().getFullYear()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Date:{" "}
                {consultation?.date
                  ? new Date(consultation.date).toLocaleDateString("fr-FR")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">
                  Nom & Prénom: {patient?.nom} {patient?.prenom}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {patient?.adresse || "Adresse non renseignée"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">
                  Âge: {calculateAge(patient?.dob)} ans
                </p>
                {patient?.telephone && (
                  <p className="text-sm text-gray-600 mt-1">
                    Tél: {patient.telephone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Acte Médical
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Prix (DZD)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {factureItems.map((item) => (
                  <tr key={item.ID}>
                    <td className="border border-gray-300 px-4 py-2">
                      {item.Act}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {parseFloat(item.PrixAct).toLocaleString("fr-DZ")}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteItem(item.ID)}
                        className="text-red-500 hover:text-red-700 transition p-1 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {factureItems.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="border border-gray-300 px-4 py-4 text-center text-gray-500"
                    >
                      Aucun acte ajouté à la facture
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    Total:
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                    {calculateTotal().toLocaleString("fr-DZ")} DZD
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
                {paidAmount > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        Payé:
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                        {paidAmount.toLocaleString("fr-DZ")} DZD
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        Reste:
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right text-orange-600">
                        {(calculateTotal() - paidAmount).toLocaleString(
                          "fr-DZ"
                        )}{" "}
                        DZD
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {/* Amount in words */}
          {calculateTotal() > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="text-sm text-gray-700 italic">
                <span className="font-semibold">
                  La présente facture est arrêtée à la somme de :{" "}
                </span>
                {convertNumberToWords(calculateTotal())} dinars algériens
              </p>
              {paidAmount > 0 && (
                <p className="text-sm text-gray-700 italic mt-2">
                  <span className="font-semibold">Montant payé : </span>
                  {convertNumberToWords(paidAmount)} dinars algériens
                </p>
              )}
            </div>
          )}

          {/* Payment Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">
                  Statut de Paiement:
                </p>
                <p
                  className={`text-sm font-medium ${getStatusColor(
                    factureStatus
                  )} px-3 py-1 rounded-full inline-block mt-1`}
                >
                  {getStatusText(factureStatus)}
                </p>
              </div>
              {paymentDate && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Date de paiement:{" "}
                    {new Date(paymentDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PrintFacturePDF
              patient={patient}
              consultation={consultation}
              factureItems={factureItems}
              totalAmount={calculateTotal()}
              paidAmount={paidAmount}
              factureStatus={factureStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureManager;
