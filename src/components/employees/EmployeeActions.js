import {
  CButton,
  CCol,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilPencil,
  cilTrash,
  cilMoney,
  cilActionUndo,
  cilTransfer,
  cilSave,
  cilFile,
} from "@coreui/icons";

const EmployeeActions = ({
  onUpdate,
  onDelete,
  onModalToggle,
  onExpense,
  onStatement,
  onDocuments,
  disableDocuments,
}) => {
  const dropdownItemStyle = {
    cursor: "pointer",
    padding: "8px 16px",
    fontSize: "14px",
    "--cui-dropdown-link-hover-color": "#ffffff",
    "--cui-dropdown-link-hover-bg": "#34A149",
    "--cui-dropdown-link-active-color": "#ffffff",
    "--cui-dropdown-link-active-bg": "#34A149",
  };

  return (
    <CCol className="d-flex gap-2 flex-wrap">
      <CButton
        className="mx-1 text-white"
        color="info"
        size="sm"
        onClick={onUpdate}
      >
        <CIcon icon={cilPencil} /> Güncelle
      </CButton>

      <CButton
        className="mx-1 text-white"
        color="danger"
        size="sm"
        onClick={onDelete}
      >
        <CIcon icon={cilTrash} /> Sil
      </CButton>


      <CDropdown>
        <CDropdownToggle className="mx-1 text-white" color="success" size="sm">
          <span style={{ fontSize: "medium" }}>₺</span> Ödeme İşlemleri
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem
            style={dropdownItemStyle}
            onClick={() => onModalToggle("accrual")}
          >
            Maaş/Prim Tahakkuku Yap
          </CDropdownItem>
          <CDropdownItem
            style={dropdownItemStyle}
            onClick={() => onModalToggle("payment")}
          >
            <CIcon icon={cilMoney} /> Ödeme Yap (Maaş/Prim/Avans)
          </CDropdownItem>
          <CDropdownItem
            style={dropdownItemStyle}
            onClick={() => onModalToggle("advanceReturn")}
          >
            <CIcon icon={cilActionUndo} /> Avans İadesi Al
          </CDropdownItem>
          <CDropdownItem
            style={dropdownItemStyle}
            onClick={() => onModalToggle("debtCredit")}
          >
            <CIcon icon={cilTransfer} /> Borç-Alacak Fişleri
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
      <CButton
        className="mx-1 text-white"
        color="danger"
        size="sm"
        onClick={onExpense}
      >
        <CIcon icon={cilSave} /> Masraf Kaydet
      </CButton>
      <CButton
        className="mx-1 text-white"
        color="warning"
        size="sm"
        onClick={onStatement}
      >
        <CIcon icon={cilFile} /> Hesap Ekstresi
      </CButton>
      <CButton
        className="mx-1 text-white"
        color="secondary"
        size="sm"
        onClick={onDocuments}
        disabled={disableDocuments}
      >
        <CIcon icon={cilFile} /> Dökümanlar
      </CButton>
    </CCol>
  );
};

export default EmployeeActions;
