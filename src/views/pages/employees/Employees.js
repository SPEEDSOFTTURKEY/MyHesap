import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastBody,
  CToastHeader,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilReload } from "@coreui/icons";
import { useEmployees } from "../../../context/EmployeesContext";
import { useUser } from "../../../context/UserContext";
import EmployeeCard from "../../../components/employees/EmployeeCard";

const Employees = () => {
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const navigate = useNavigate();
  const { employees, fetchEmployees, loading, error, deleteEmployee } =
    useEmployees();
  const { user: currentUser } = useUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    const toast = (
      <CToast
        key={id}
        autohide={true}
        visible={true}
        delay={5000}
        className={
          type === "error" ? "bg-danger text-white" : "bg-success text-white"
        }
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  };

  const handleDelete = async (id) => {
    if (currentUser?.yetkiId !== 1) {
      addToast("Çalışan silme yetkiniz yok", "error");
      return;
    }
    const employee = employees.find((emp) => emp.id === id);
    if (!employee) {
      addToast("Çalışan bulunamadı", "error");
      return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete?.id) {
      addToast("Çalışan ID'si eksik", "error");
      setShowDeleteModal(false);
      return;
    }
    try {
      const result = await deleteEmployee(employeeToDelete.id);
      addToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        await fetchEmployees();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Silme hatası:", errorMessage);
      addToast(`Çalışan silinirken hata oluştu: ${errorMessage}`, "error");
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  const handleNewEmployee = () => {
    if (currentUser?.yetkiId !== 1) {
      addToast("Yeni çalışan ekleme yetkiniz yok", "error");
      return;
    }
    navigate("/app/employee-update", { state: { employee: null } });
  };

  const handleRowClick = (employee) => {
    if (!employee.id) {
      addToast("Çalışan ID'si bulunamadı", "error");
      console.error("Employees - Geçersiz çalışan ID:", employee);
      return;
    }
    navigate(`/app/employee-detail/${employee.id}`, { state: { employee } });
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>
      <div className="d-flex gap-2 mb-3">
        <CButton
          color="success"
          className="text-light"
          onClick={handleNewEmployee}
          disabled={currentUser?.yetkiId !== 1}
        >
          <CIcon icon={cilPlus} size="m" /> Yeni Çalışan Ekle
        </CButton>
        <CButton
          color="primary"
          className="text-light"
          onClick={fetchEmployees}
          disabled={loading}
        >
          <CIcon icon={cilReload} size="m" /> Çalışanları Yenile
        </CButton>
      </div>

      {loading && (
        <CCard className="mb-3">
          <CCardBody>Yükleniyor...</CCardBody>
        </CCard>
      )}

      {error && (
        <CCard className="mt-3">
          <CCardHeader>Hata</CCardHeader>
          <CCardBody>
            <p>{error}</p>
            <CButton color="primary" onClick={fetchEmployees}>
              Tekrar Dene
            </CButton>
          </CCardBody>
        </CCard>
      )}

      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
          size="xl"
        >
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Çalışan Kartları</span>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                color: "#2965A8",
                padding: "5px 10px",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "14px",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              Toplam Çalışan: {employees.length}
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <p>
            Bir çalışana tıklayarak detaylarını görüntüleyebilir veya
            düzenleyebilirsiniz.
          </p>
          {employees.length > 0 ? (
            <CRow>
              {employees.map((employee, index) => (
                <CCol key={employee.id || index} xs={12} sm={6} md={4} lg={3}>
                  <EmployeeCard
                    employee={employee}
                    onClick={() => handleRowClick(employee)}
                  />
                </CCol>
              ))}
            </CRow>
          ) : (
            <p>Çalışan bulunamadı.</p>
          )}
        </CCardBody>
      </CCard>

      <CModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEmployeeToDelete(null);
        }}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#dc3545", color: "#FFFFFF" }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Çalışan "
            <strong>{employeeToDelete?.adiSoyadi || "Bilinmiyor"}</strong>"
            silinecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setEmployeeToDelete(null);
            }}
          >
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            className="text-white"
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Employees;
