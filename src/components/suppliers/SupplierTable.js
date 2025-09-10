import React from "react";
import {
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilTrash } from "@coreui/icons";

const SupplierTable = ({
  suppliers,
  onSupplierClick,
  onUpdate,
  onDelete,
  loading,
}) => {
  const handleDelete = (e, supplierId) => {
    e.stopPropagation(); // Prevent row click event
    onDelete(supplierId);
  };

  const handleUpdate = (e, supplier) => {
    e.stopPropagation(); // Prevent row click event
    onUpdate(supplier);
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <CSpinner color="primary" />
        <p className="mt-2">Yükleniyor...</p>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="text-center p-5">
        <p className="text-muted">Tedarikçi bulunamadı.</p>
      </div>
    );
  }

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Tedarikçi Adı/Unvanı</CTableHeaderCell>
          <CTableHeaderCell>Telefon</CTableHeaderCell>
          <CTableHeaderCell>Sınıflandırma</CTableHeaderCell>
          <CTableHeaderCell>Açık Bakiye</CTableHeaderCell>
          <CTableHeaderCell>Çek/Senet Bakiyesi</CTableHeaderCell>
          <CTableHeaderCell width="120" className="text-center">
            İşlemler
          </CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {suppliers.map((supplier) => (
          <CTableRow
            key={supplier.id}
            onClick={() => onSupplierClick(supplier)}
            style={{ cursor: "pointer" }}
          >
            <CTableDataCell>
              <strong>{supplier.name}</strong>
              {supplier.email && (
                <div className="small text-muted">{supplier.email}</div>
              )}
            </CTableDataCell>
            <CTableDataCell>{supplier.phone || "-"}</CTableDataCell>
            <CTableDataCell>
              <span className="badge bg-info text-white">
                {supplier.classification || "Sınıflandırılmamış"}
              </span>
            </CTableDataCell>
            <CTableDataCell>
              <span
                className={
                  supplier.openBalance > 0 ? "text-danger fw-bold" : ""
                }
              >
                {supplier.openBalance.toLocaleString("tr-TR")} TRY
              </span>
            </CTableDataCell>
            <CTableDataCell>
              <span
                className={
                  supplier.chequeBondBalance > 0 ? "text-warning fw-bold" : ""
                }
              >
                {supplier.chequeBondBalance.toLocaleString("tr-TR")} TRY
              </span>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CButton
                size="sm"
                className="me-1"
                style={{
                  backgroundColor: "#FFC107",
                  border: "none",
                  color: "white",
                  padding: "4px 8px",
                }}
                title="Düzenle"
                onClick={(e) => handleUpdate(e, supplier)}
              >
                <CIcon icon={cilPencil} size="sm" />
              </CButton>
              <CButton
                size="sm"
                style={{
                  backgroundColor: "#DC3545",
                  border: "none",
                  color: "white",
                  padding: "4px 8px",
                }}
                title="Sil"
                onClick={(e) => handleDelete(e, supplier.id)}
              >
                <CIcon icon={cilTrash} size="sm" />
              </CButton>
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  );
};

export default SupplierTable;
