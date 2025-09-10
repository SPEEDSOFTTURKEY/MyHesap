import { useContext, useState } from "react";
import { CButton } from "@coreui/react";
import PurchasesContext from "../../context/PurchasesContext";
import { CIcon } from "@coreui/icons-react";
import { cilPlus } from "@coreui/icons";
import SupplierNewModal from "../../views/pages/suppliers/SupplierNewModal";

const PurchasesHeader = () => {
  const { setShowSupplierModal, navigate } = useContext(PurchasesContext);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);

  const handleRegisteredSupplierPurchase = () => {
    setShowSupplierModal(true);
  };

  const handleNewSupplierPurchase = () => {
    setShowNewSupplierModal(true);
  };

  const handleSupplierCreated = (newSupplier) => {
    navigate("/app/purchases/registered-supplier-purchase", {
      state: { supplier: newSupplier },
    });
    setShowNewSupplierModal(false);
  };

  return (
    <>
      <CButton
        color="success"
        style={{
          color: "white",
          marginRight: "10px",
          marginBottom: "10px",
        }}
        onClick={handleRegisteredSupplierPurchase}
      >
        <CIcon icon={cilPlus} /> Kayıtlı Tedarikçiden Ürün/Hizmet Gir
      </CButton>

      <CButton
        color="info"
        style={{
          color: "white",
          marginRight: "10px",
          marginBottom: "10px",
        }}
        onClick={handleNewSupplierPurchase}
      >
        <CIcon icon={cilPlus} /> Yeni Tedarikçiden Ürün/Hizmet Gir
      </CButton>

      <SupplierNewModal
        visible={showNewSupplierModal}
        onClose={() => setShowNewSupplierModal(false)}
        onSupplierCreated={handleSupplierCreated}
      />
    </>
  );
};
export default PurchasesHeader;
