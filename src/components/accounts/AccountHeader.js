import { CCard, CCardHeader, CCardBody } from "@coreui/react";
import { useAccounts } from "../../context/AccountsContext";
import "../../scss/style.scss";

const AccountHeader = () => {
  const { selectedUser, getTextColor, getCurrencySymbol } = useAccounts();

  if (!selectedUser) {
    return (
      <CCard className="mb-3 shadow-sm">
        <CCardBody>
          <p>Lütfen bir hesap seçin.</p>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <CCard className="mb-3 shadow-sm w-50">
      <CCardHeader
        className="p-3"
        style={{
          backgroundColor: selectedUser.labelColor || "var(--primary-color)",
          color: getTextColor(selectedUser.labelColor),
        }}
      >
        <h4>
          <strong>{selectedUser.userName}</strong>
        </h4>
      </CCardHeader>
      <CCardBody className="d-flex">
        <div
          className="d-flex align-items-center justify-content-center me-4"
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            backgroundColor: selectedUser.labelColor || "#eee",
            color: getTextColor(selectedUser.labelColor),
          }}
        >
          {getCurrencySymbol(selectedUser.currency)}
        </div>
        <div>
          <p className="mb-1">
            <strong>Hesap No:</strong>{" "}
            {selectedUser.accountNumber || "Bilinmiyor"}
          </p>
          <p className="mb-1">
            <strong>Bakiye:</strong>{" "}
            {(selectedUser.balance || 0).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })}{" "}
            {selectedUser.currency || "TRY"}
          </p>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default AccountHeader;
