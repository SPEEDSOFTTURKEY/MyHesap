import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CRow,
  CCol,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import { useEmployees } from "../../../context/EmployeesContext";
import Notifications from "../../../components/employees/Notifications";
import EmployeeForm from "../../../components/employees/EmployeeForm";

const EmployeeUpdate = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { employee: initialEmployee } = state || {};
  const {
    addEmployee,
    updateEmployee,
    deleteEmployee,
    fetchEmployeeById,
    fetchEmployees,
  } = useEmployees();
  const [employee, setEmployee] = useState(initialEmployee);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const toaster = useRef();

  // Yeni çalışan eklendiğinde veya güncellendiğinde başarılı mesaj göstermek için
  const addToast = (message, type = "hata") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  // Başlangıçta çalışan verisini çekmek için
  useEffect(() => {
    if (initialEmployee?.id) {
      fetchEmployeeById(initialEmployee.id).then((result) => {
        if (result.success) {
          setEmployee(result.data);
        } else {
          setError(result.message);
          addToast(result.message, "hata");
        }
      });
    }
  }, [initialEmployee, fetchEmployeeById]);

  // Form gönderildiğinde çalışan ekleme veya güncelleme işlemini gerçekleştir
  const handleSubmit = async (employeeData) => {
    // Zorunlu alanların kontrolü
    if (!employeeData.adiSoyadi || !employeeData.email || !employeeData.tc) {
      addToast("Ad Soyad, T.C. Kimlik Numarası ve E-Posta zorunlu.", "hata");
      return;
    }
    setLoading(true);
    let result;
    try {
      const { fotograf, ...restData } = employeeData;
      const file = typeof fotograf === "object" ? fotograf : null;
      if (employee?.id) {
        // Çalışan güncelleme işlemi
        result = await updateEmployee(employee.id, restData, file);
        if (result.success) {
          // Güncelleme başarılıysa çalışan listesini yenile
          await fetchEmployees();
          addToast("Çalışan başarıyla güncellendi.", "başarılı");
          setTimeout(() => navigate("/app/employees"), 1000);
        } else {
          addToast(result.message, "hata");
        }
      } else {
        // Yeni çalışan ekleme işlemi
        result = await addEmployee(restData, file);
        if (result.success) {
          // Ekleme başarılıysa çalışan listesini yenile
          await fetchEmployees();
          addToast("Çalışan başarıyla eklendi.", "başarılı");
          setTimeout(() => navigate("/app/employees"), 1000);
        } else {
          addToast(result.message, "hata");
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      addToast("İşlem başarısız: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  /*
  const confirmDelete = async () => {
    if (!employee?.id) {
      addToast("Çalışan ID'si eksik", "hata");
      return;
    }

    setLoading(true);

    try {
      const result = await deleteEmployee(employee.id);
      addToast(result.message, result.success ? "başarılı" : "hata");

      if (result.success) {
        setShowDeleteModal(false);
        await fetchEmployees();
        setTimeout(() => navigate("/app/employees"), 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      addToast("Silme başarısız: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

*/

  // İptal butonuyla çalışanlar sayfasına dön
  const handleCancel = () => {
    navigate("/app/employees");
  };

  if (loading) return <div>Yükleniyor...</div>;

  if (error)
    return (
      <div>
        <h3>Hata</h3>
        <p>{error}</p>
        <CButton onClick={handleCancel}>İptal</CButton>
      </div>
    );

  return (
    <>
      <Notifications toasts={toasts} ref={toaster} />
      <CRow className="my-3">
        <CCol xs={12}>
          <EmployeeForm
            employee={employee}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onDelete={() => setShowDeleteModal(true)}
          />
        </CCol>
      </CRow>
      <CModal
        style={{ backgroundColor: "#dc3545" }}
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Çalışan "{employee?.adiSoyadi}" silinecek, emin misiniz?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={async () => {
              await confirmDelete();
              setShowDeleteModal(false); // Silme işleminden sonra modal kapanır
            }}
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EmployeeUpdate;
