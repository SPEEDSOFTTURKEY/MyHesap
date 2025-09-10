import { cilLoop, cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton } from "@coreui/react";

const EmployeeListActions = ({ onNewEmployee, onFetchEmployees, loading }) => {
  return (
    <div className="d-flex gap-2 mb-2">
      <CButton
        color="primary"
        onClick={() => {
          console.log("EmployeeListActions - Yeni Çalışan Ekle'ye tıklandı");
          onNewEmployee();
        }}
        disabled={loading}
      >
        <CIcon icon={cilPlus} /> Yeni Çalışan Ekle
      </CButton>
      <CButton
        color="secondary"
        onClick={onFetchEmployees}
        disabled={loading}
      >
        <CIcon icon={cilLoop} /> Yenile
      </CButton>
    </div>
  );
};

export default EmployeeListActions;