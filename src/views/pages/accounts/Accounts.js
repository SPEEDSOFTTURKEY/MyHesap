import {
  CCard,
  CCardHeader,
  CCardBody,
  CCardText,
  CButton,
  CRow,
  CCol,
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import { AccountsProvider } from "../../../context/AccountsContext";
import AccountHeader from "../../../components/accounts/AccountHeader";
import AccountActions from "../../../components/accounts/AccountActions";
import TransactionTable from "../../../components/accounts/TransactionTable";
import UpdateAccountModal from "../../../components/accounts/UpdateAccountModal";
import TransactionModal from "../../../components/accounts/TransactionModal";
import TransferModal from "../../../components/accounts/TransferModal";
import ToastNotification from "../../../components/accounts/ToastNotification";
import { useAccounts } from "../../../context/AccountsContext";

const AccountsContent = () => {
  const { loading, error, selectedUser } = useAccounts();
  const navigate = useNavigate();

  if (loading) {
    return (
      <CCard>
        <CCardBody>Yükleniyor...</CCardBody>
      </CCard>
    );
  }

  if (error) {
    return (
      <CCard className="mt-4">
        <CCardHeader>Hesap Bilgisi</CCardHeader>
        <CCardBody>
          <CCardText>{error}</CCardText>
          <CButton color="primary" onClick={() => navigate("/app/dashboard")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  if (!selectedUser) {
    return (
      <CCard className="mt-4">
        <CCardHeader>Hesap Bilgisi</CCardHeader>
        <CCardBody>
          <CCardText>Lütfen bir kullanıcı seçin.</CCardText>
          <CButton color="primary" onClick={() => navigate("/app/dashboard")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <ToastNotification />
      <AccountHeader />
      <AccountActions />
      <CRow>
        <CCol xs={12}>
          <TransactionTable />
        </CCol>
      </CRow>
      <UpdateAccountModal />
      <TransactionModal />
      <TransferModal />
    </>
  );
};

const Accounts = () => {
  return (
    <AccountsProvider>
      <AccountsContent />
    </AccountsProvider>
  );
};

export default Accounts;
