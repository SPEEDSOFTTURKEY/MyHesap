import { useContext } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import PurchasesContext from "../../context/PurchasesContext";

const SupplierModal = () => {
  const { showSupplierModal, setShowSupplierModal, suppliers, navigate } =
    useContext(PurchasesContext);

  const handleSupplierSelect = (supplier) => {
    setShowSupplierModal(false);
    navigate("/app/purchases/registered-supplier-purchase", {
      state: { supplier },
    });
  };

  return (
    <CModal
      visible={showSupplierModal}
      onClose={() => setShowSupplierModal(false)}
      backdrop="static"
      size="lg"
    >
      <CModalHeader>
        <CModalTitle>Tedarikçi Arama</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p
          style={{
            backgroundColor: "#FFC107",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "25px",
            fontWeight: "500",
          }}
        >
          Alış yaptığınız tedarikçiyi bulun
        </p>

        <div className="mb-3">
          <label className="form-label fw-bold">Tedarikçi Seçimi</label>
          <CDropdown style={{ width: "100%" }}>
            <CDropdownToggle
              color="light"
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                backgroundColor: "#fff",
                minHeight: "48px",
              }}
            >
              Tedarikçi Seç
            </CDropdownToggle>
            <CDropdownMenu
              style={{
                width: "100%",
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {suppliers.length === 0 ? (
                <CDropdownItem disabled style={{ padding: "12px 16px" }}>
                  Tedarikçi bulunamadı
                </CDropdownItem>
              ) : (
                suppliers.map((supplier) => (
                  <CDropdownItem
                    key={supplier.id}
                    onClick={() => handleSupplierSelect(supplier)}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f8f9fa",
                    }}
                  >
                    <div>
                      <strong>{supplier.unvan}</strong>
                      {supplier.vergiNo && (
                        <div style={{ fontSize: "0.875rem", color: "#6c757d" }}>
                          Vergi No: {supplier.vergiNo}
                        </div>
                      )}
                    </div>
                  </CDropdownItem>
                ))
              )}
            </CDropdownMenu>
          </CDropdown>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          onClick={() => setShowSupplierModal(false)}
          style={{ color: "white" }}
        >
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default SupplierModal;
