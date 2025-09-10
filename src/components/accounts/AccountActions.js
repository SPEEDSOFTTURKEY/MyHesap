import React from "react";
import {
  CButton,
  CCol,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormInput,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilActionRedo,
  cilArrowThickTop,
  cilTransfer,
  cilListFilter,
  cilPencil,
} from "@coreui/icons";
import { useAccounts } from "../../context/AccountsContext";
import dayjs from "dayjs";

const AccountActions = () => {
  const {
    setModalVisible,
    setTransactionModalVisible,
    setTransactionType,
    setTransactionForm,
    setVisibleTransferModal,
    setTransferDirection,
    setFilterPeriod,
    searchQuery,
    setSearchQuery,
    setEditingTransaction,
  } = useAccounts();

  const transactionDropdown = {
    "--cui-dropdown-link-hover-color": "#ffffff",
    "--cui-dropdown-link-hover-bg": "#f0b942",
    "--cui-dropdown-link-active-color": "#ffffff",
    "--cui-dropdown-link-active-bg": "#eead20",
  };

  const listDropdown = {
    "--cui-dropdown-link-hover-color": "#ffffff",
    "--cui-dropdown-link-hover-bg": "#504fb0",
    "--cui-dropdown-link-active-color": "#ffffff",
    "--cui-dropdown-link-active-bg": "#5e5cd0",
  };

  const handleUpdateClick = () => setModalVisible(true);

  const handleTransactionClick = (type) => {
    setEditingTransaction(null);
    setTransactionType(type);
    setTransactionForm({
      rawAmount: "",
      formattedAmount: "",
      description: "",
      date: dayjs().format("YYYY-MM-DD"),
      recipientAccount: "",
      submissionTimestamp: null,
    });
    setTransactionModalVisible(true);
  };

  const handleTransferClick = (direction) => {
    setEditingTransaction(null);
    setTransferDirection(direction);
    setTransactionForm({
      rawAmount: "",
      formattedAmount: "",
      description: "",
      date: dayjs().format("YYYY-MM-DD"),
      recipientAccount: "",
      submissionTimestamp: null,
    });
    setVisibleTransferModal(true);
  };

  // Arama fonksiyonu: Güvenli ve sağlam bir arama işlemi
  const handleSearchChange = (e) => {
    const query = e.target.value || "";
    try {
      setSearchQuery(query);
      console.log("Arama terimi:", query);
    } catch (error) {
      console.error("Arama güncelleme hatası:", error);
    }
  };

  return (
    <CRow className="d-flex gap-2 flex-wrap mb-2">
      <CCol>
        <CButton
          className="mx-1 text-white"
          color="info"
          size="sm"
          onClick={handleUpdateClick}
        >
          <CIcon icon={cilPencil} /> Hesabı Güncelle
        </CButton>
        <CButton
          className="mx-1 text-white"
          color="success"
          size="sm"
          onClick={() => handleTransactionClick("in")}
        >
          <CIcon icon={cilActionRedo} /> Para Girişi
        </CButton>
        <CButton
          className="mx-1 text-white"
          color="danger"
          size="sm"
          onClick={() => handleTransactionClick("out")}
        >
          <CIcon icon={cilArrowThickTop} /> Para Çıkışı
        </CButton>
        <CDropdown>
          <CDropdownToggle
            className="mx-1 text-white"
            size="sm"
            color="warning"
          >
            <CIcon icon={cilTransfer} /> Hesaplar Arası Transfer
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem
              style={transactionDropdown}
              onClick={() => handleTransferClick("outgoing")}
            >
              Bu hesaptan başka hesaba para aktar
            </CDropdownItem>
            <CDropdownItem
              style={transactionDropdown}
              onClick={() => handleTransferClick("incoming")}
            >
              Başka hesaptan bu hesaba para aktar
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
        <CDropdown>
          <CDropdownToggle
            className="mx-1 text-white"
            size="sm"
            color="primary"
          >
            <CIcon icon={cilListFilter} /> Listele
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem
              style={listDropdown}
              onClick={() => setFilterPeriod("all")}
            >
              Tümünü Göster
            </CDropdownItem>
            <CDropdownItem
              style={listDropdown}
              onClick={() => setFilterPeriod("today")}
            >
              Bugün
            </CDropdownItem>
            <CDropdownItem
              style={listDropdown}
              onClick={() => setFilterPeriod("last7days")}
            >
              Son 7 gün
            </CDropdownItem>
            <CDropdownItem
              style={listDropdown}
              onClick={() => setFilterPeriod("last30days")}
            >
              Son 30 gün
            </CDropdownItem>
            <CDropdownItem
              style={listDropdown}
              onClick={() => setFilterPeriod("last1year")}
            >
              Son 1 yıl
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
        {/* Arama kutusu: Eşleşme olmasa bile hata vermez */}
        <CFormInput
          type="text"
          style={{ margin: "5px", width: "200px", display: "inline-block" }}
          size="sm"
          placeholder="Hesaplarda ara..."
          value={searchQuery || ""} // Undefined ise boş string
          onChange={handleSearchChange}
          className="my-2"
        />
      </CCol>
    </CRow>
  );
};

export default AccountActions;
