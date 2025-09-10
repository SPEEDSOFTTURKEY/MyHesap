import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";

import { useUsers } from "../../../context/UsersContext";
import { useEmployees } from "../../../context/EmployeesContext";
import api from "../../../api/api";
import Notifications from "../../../components/employees/Notifications";
import EmployeeHeader from "../../../components/employees/EmployeeHeader";
import EmployeeActions from "../../../components/employees/EmployeeActions";
import EmployeeTable from "../../../components/employees/EmployeeTable";
import EmployeeModals from "../../../components/employees/EmployeeModals";
const API_BASE_URL = "https://localhost:44375/api";

const accountCategories = [
  { categoryId: 1, accountName: "Banka Hesapları", type: "bank" },
  { categoryId: 2, accountName: "Kasa Tanımları", type: "cash" },
  { categoryId: 3, accountName: "Kredi Kartları", type: "creditCard" },
  { categoryId: 4, accountName: "Pos Hesapları", type: "pos" },
  { categoryId: 5, accountName: "Şirket Ortakları Hesapları", type: "partner" },
  { categoryId: 6, accountName: "Veresiye Hesapları", type: "debt" },
];

const BASE_PHOTO_URL = "https://speedsofttest.com";
const DEFAULT_PHOTO = "/default-profile.png";

const getPhotoUrl = (foto) => {
  if (!foto || typeof foto !== "string" || foto === "null") {
    return DEFAULT_PHOTO;
  }
  if (foto.startsWith("https")) {
    return `${foto}?t=${new Date().getTime()}`;
  }
  const normalizedFoto = foto.startsWith("/") ? foto : `/${foto}`;
  return `${BASE_PHOTO_URL}${normalizedFoto}?t=${new Date().getTime()}`;
};

const EmployeeDetail = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    //--
    /*const result = await deleteEmployee(selectedEmployee.id);
    addToast(result.message, result.success ? "başarılı" : "hata");
  
    if (result.success) {
      navigate("/app/employees");  */
    setShowDeleteModal(true); //* butona basınca doğrudan silmez modal çıkartır
  };

  const navigate = useNavigate();

  const handleNavigation = (path, state = {}) => {
    navigate(path, { state });
  };

  const confirmDelete = async () => {
    console.log("silme baslası");
    const result = await deleteEmployee(selectedEmployee.id);
    addToast(result.message, result.success ? "başarılı" : "hata");

    if (result.success) {
      navigate("/app/employees");
    }
    setShowDeleteModal(false);
  };

  const { employeeId } = useParams();
  const { state } = useLocation();
  const {
    selectedEmployee,
    fetchEmployeeById,
    employeeBalances,
    fetchEmployeeBalance,
    loading: employeeLoading,
    error: employeeError,
  } = useEmployees();
  const { users: accounts } = useUsers();
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState({
    mainCategories: [],
    subCategories: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    accrual: false,
    payment: false,
    advanceReturn: false,
    debtCredit: false,
    expense: false,
  });

  const addToast = (message, type = "başarılı") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const fetchTransactions = useCallback(
    async (id) => {
      if (!id || isNaN(id)) {
        setError("Çalışan ID'si eksik veya geçersiz.");
        addToast("Çalışan bilgisi eksik", "hata");
        return;
      }
      setLoading(true);
      try {
        const response = await api.get(
          `${API_BASE_URL}/calisancari/calisancaricalisan-get-by-Id/${id}`,
          {
            headers: { accept: "*/*" },
          },
        );
        console.log("ÇalışanCari Get By ID: ", response);
        const rawData = response.data;
        const data = Array.isArray(rawData)
          ? rawData
          : rawData
            ? [rawData]
            : [];
        const formattedData = data.map((transaction) => ({
          id: transaction.id,
          tarih: transaction.tarih || "",
          masrafAnaKategoriId: transaction.masrafAnaKategoriId || 0,
          masrafAltKategoriId: transaction.masrafAltKategoriId || 0,
          aciklama: transaction.aciklama || "-",
          borc: transaction.borc || 0,
          alacak: transaction.alacak || 0,
          bakiye: transaction.bakiye || 0,
          calisanId: transaction.calisanId || id,
          durumu: transaction.durumu || 0,
        }));
        setTransactions(formattedData);
        setError(null);
        await fetchEmployeeBalance(id);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        console.error("Cari işlemler hatası:", {
          message: errorMessage,
          status: err.response?.status,
          url: err.config?.url,
        });
        if (err.response?.status === 404) {
          setError(`Çalışan ID ${id} için cari işlem bulunamadı.`);
          addToast(`Çalışan ID ${id} için cari işlem bulunamadı`, "hata");
        } else {
          setError("Cari işlemler alınamadı: " + errorMessage);
          addToast("Cari işlemler yüklenemedi: " + errorMessage, "hata");
        }
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchEmployeeBalance],
  );

  const fetchExpenseCategories = async () => {
    try {
      const mainCategoriesResponse = await api.get(
        `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
        { headers: { accept: "*/*" } },
      );
      const subCategoriesResponse = await api.get(
         `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-get-all`,
        { headers: { accept: "*/*" } },
      );
      const mainCategories = Array.isArray(mainCategoriesResponse.data)
        ? mainCategoriesResponse.data
        : [];
      const subCategories = Array.isArray(subCategoriesResponse.data)
        ? subCategoriesResponse.data
        : [];
      setExpenseCategories({ mainCategories, subCategories });
    } catch (err) {
      console.error("Masraf kategorileri alınamadı:", err);
      addToast("Masraf kategorileri yüklenemedi", "hata");
    }
  };

  useEffect(() => {
    if (employeeId && employeeId !== "new" && !isNaN(employeeId)) {
      fetchEmployeeById(Number(employeeId));
      fetchTransactions(Number(employeeId));
      fetchExpenseCategories();
    } else {
      setError("Çalışan ID'si eksik veya geçersiz.");
      addToast("Çalışan bilgisi eksik veya geçersiz", "hata");
      navigate("/app/employees");
    }
  }, [employeeId, fetchEmployeeById, fetchTransactions, navigate]);

  if (employeeLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (employeeError || !selectedEmployee) {
    return (
      <CCard>
        <CCardHeader>Çalışan Bilgisi</CCardHeader>
        <CCardBody>
          <p>{employeeError || "Çalışan bulunamadı."}</p>
          <CButton color="primary" onClick={() => navigate("/app/employees")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <Notifications toasts={toasts} />
      <CRow>
        <CCol xs={12}>
          <EmployeeHeader
            employee={{
              ...selectedEmployee,
              fotograf: getPhotoUrl(selectedEmployee.fotograf),
              balance:
                employeeBalances[selectedEmployee.id] !== undefined
                  ? `${employeeBalances[selectedEmployee.id].toLocaleString("tr-TR")} ${selectedEmployee.paraBirimi || "TRY"}`
                  : "Veri bulunamadı",
            }}
          />
        </CCol>
        <CCol xs={12} className="mb-3">
          <EmployeeActions
            onUpdate={() =>
              handleNavigation(`/app/employee-update`, {
                employee: selectedEmployee,
                mode: "update",
              })
            }
            onDelete={handleDelete}
            onModalToggle={(modalType) =>
              setModalState((prev) => ({ ...prev, [modalType]: true }))
            }
            onExpense={() =>
              setModalState((prev) => ({ ...prev, expense: true }))
            }
            onStatement={() =>
              handleNavigation(`/app/employee-statement/${employeeId}`, {
                employee: selectedEmployee,
                expenseCategories: expenseCategories,
              })
            }
            onDocuments={() =>
              handleNavigation("/app/employee-documents", {
                employeeId: selectedEmployee.id,
              })
            }
            disableDocuments={true}
          />
        </CCol>

        <CCol xs={12}>
          <EmployeeTable
            transactions={transactions}
            loading={loading}
            error={error}
            currency={selectedEmployee?.paraBirimi || "TRY"}
            onPrint={(message, type) => addToast(message, type)}
            addToast={addToast}
            onRefresh={() => fetchTransactions(selectedEmployee.id)}
            expenseMainCategories={expenseCategories.mainCategories || []}
            expenseSubCategories={expenseCategories.subCategories || []}
          />
        </CCol>
      </CRow>

      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Çalışan <strong>"{selectedEmployee?.adiSoyadi}"</strong> silinecek.
            Emin misiniz?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Sil
          </CButton>
        </CModalFooter>
      </CModal>

      <EmployeeModals
        modalState={modalState}
        setModalState={setModalState}
        employeeId={selectedEmployee.id}
        onSubmit={() => fetchTransactions(selectedEmployee.id)}
        addToast={addToast}
      />
    </>
  );
};

export default EmployeeDetail;
