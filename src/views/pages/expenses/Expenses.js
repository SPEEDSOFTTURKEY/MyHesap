import {
  CButton,
  CButtonGroup,
  CFormCheck,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CSpinner,
  CModal,
  CModalTitle,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilColorBorder,
  cilListFilter,
  cilPencil,
  cilPlus,
  cilTrash,
} from "@coreui/icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useUsers } from "../../../context/UsersContext";
import api from "../../../api/api";
const API_BASE_URL = "https://speedsofttest.com/api";

const Expenses = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filter, setFilter] = useState({
    type: "status",
    value: "all",
    search: "",
  });
  const [uploadModal, setUploadModal] = useState(null);
  const [uploadData, setUploadData] = useState({ arsiv: null, Arsiv: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const navigate = useNavigate();
  const { users } = useUsers();
  const [toast, setToast] = useState(null);
  const toaster = useRef();

  // Kullanıcı ID'sini al
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      return user.id;
    } catch (err) {
      console.error("Kullanıcı ID'si alınırken hata:", err);
      return 0;
    }
  };

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`${API_BASE_URL}/masraf/masraf-get-all`);
      console.log("Masraflar API response (masraf-get-all):", data);
      setExpenses(data);
    } catch (error) {
      console.error(
        "Masraflar çekilirken hata oluştu:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Masraflar yüklenirken hata oluştu.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMainCategories = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
      );
      console.log("Ana Kategoriler API response (masrafAnaKategori-get-all):", data);
      setMainCategories(data);
    } catch (error) {
      console.error(
        "Ana kategoriler çekilirken hata oluştu:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Ana kategoriler yüklenirken hata oluştu.",
        color: "danger",
      });
    }
  };

  const fetchSubCategories = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-get-all`,
      );
      console.log("Alt Kategoriler API response (masrafAltKategori-get-all):", data);
      setSubCategories(data);
    } catch (error) {
      console.error(
        "Alt kategoriler çekilirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Alt kategoriler yüklenirken hata oluştu.",
        color: "danger",
      });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) {
      setToast({
        message: "Geçerli bir kullanıcı oturumu bulunamadı.",
        color: "danger",
      });
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    formData.append("Id", uploadModal.id.toString());
    formData.append("arsiv", uploadData.arsiv);
    formData.append("Arsiv", uploadData.Arsiv);
    formData.append("HesapId", uploadModal.hesapId);
    formData.append("OdemeDurumu", uploadModal.odemeDurumu);
    formData.append("OdemeTuru", uploadModal.odemeTuru || "");
    formData.append("Tutar", uploadModal.tutar);
    formData.append(
      "GuncellenmeTarihi",
      new Date().toISOString().split("T")[0],
    );
    formData.append("EklenmeTarihi", uploadModal.eklenmeTarihi);
    formData.append("Aciklama", uploadModal.aciklama || "");
    formData.append("OdemeTarihi", uploadModal.odemeTarihi);
    formData.append("IslemTarihi", uploadModal.islemTarihi);
    formData.append("MasrafAltKategoriId", uploadModal.masrafAltKategoriId);
    formData.append("MasrafAnaKategoriId", uploadModal.MasrafAnaKategoriId);
    formData.append("KDVOrani", uploadModal.kdvOrani);
    formData.append("kullaniciId", userId);

    console.log("Belge yükleme payload:", {
      id: uploadModal.id,
      hasFile: !!uploadData.arsiv,
      userId: userId,
    });

    try {
      const response = await api.put(`${API_BASE_URL}/masraf/masraf-update`, formData, {
        headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
      });
      console.log("Belge yükleme API response (masraf-update):", response.data);
      await fetchExpenses();
      setToast({
        message: "Belge başarıyla yüklendi.",
        color: "success",
      });
      setUploadModal(null);
      setUploadData({ arsiv: null, Arsiv: "" });
    } catch (error) {
      console.error(
        "Belge yüklenirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: `Belge yüklenirken hata: ${error.response?.data?.message || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    const expense = expenses.find((exp) => exp.id === id);
    if (!expense) {
      setToast({
        message: "Masraf bulunamadı.",
        color: "danger",
      });
      return;
    }
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete?.id) {
      setToast({
        message: "Masraf ID'si eksik.",
        color: "danger",
      });
      setShowDeleteModal(false);
      return;
    }
    
    const userId = getUserId();
    if (!userId) {
      setToast({
        message: "Geçerli bir kullanıcı oturumu bulunamadı.",
        color: "danger",
      });
      setShowDeleteModal(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Masraf silme isteği: ID =", expenseToDelete.id, "Kullanıcı ID =", userId);
      
      const response = await api.delete(
        `${API_BASE_URL}/masraf/masraf-delete/${expenseToDelete.id}?kullaniciId=${userId}`,
        { headers: { accept: "*/*" } },
      );
      console.log("Masraf delete API response (masraf-delete):", response.data);
      
      await fetchExpenses();
      setToast({
        message: "Masraf başarıyla silindi.",
        color: "success",
      });
    } catch (error) {
      console.error(
        "Masraf silinirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: `Masraf silinirken hata: ${error.response?.data?.message || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setExpenseToDelete(null);
    }
  };

  const handlePayExpense = async (expense) => {
    const userId = getUserId();
    if (!userId) {
      setToast({
        message: "Geçerli bir kullanıcı oturumu bulunamadı.",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("Id", expense.id.toString());
      formData.append("HesapId", expense.hesapId);
      formData.append("OdemeDurumu", "1");
      formData.append("OdemeTuru", expense.odemeTuru || "Nakit");
      formData.append("Tutar", expense.tutar);
      formData.append(
        "GuncellenmeTarihi",
        new Date().toISOString().split("T")[0],
      );
      formData.append("EklenmeTarihi", expense.eklenmeTarihi);
      formData.append("Aciklama", expense.aciklama || "");
      formData.append("OdemeTarihi", new Date().toISOString().split("T")[0]);
      formData.append("IslemTarihi", expense.islemTarihi);
      formData.append("MasrafAltKategoriId", expense.masrafAltKategoriId);
      formData.append("MasrafAnaKategoriId", expense.masrafAnaKategoriId);
      formData.append("KDVOrani", expense.kdvOrani);
      formData.append("kullaniciId", userId.toString());
      formData.append("Arsiv", expense.Arsiv || "");
      if (expense.arsiv) {
        const dummyFile = new File([""], "dummy.png", { type: "image/png" });
        formData.append("arsiv", dummyFile);
      }

      const response = await api.put(`${API_BASE_URL}/masraf/masraf-update`, formData, {
        headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
      });
      console.log("Masraf ödeme API response (masraf-update):", response.data);
      
      await fetchExpenses();
      setToast({
        message: "Masraf başarıyla ödendi.",
        color: "success",
      });
    } catch (error) {
      console.error(
        "Masraf ödenirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: `Masraf ödenirken hata: ${error.response?.data?.message || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    navigate("/app/new-expense", { state: { expense } });
  };

  useEffect(() => {
    fetchExpenses();
    fetchMainCategories();
    fetchSubCategories();
  }, []);

  const handleFilterChange = (type, value) => {
    if (type === "search") {
      console.log("Search filter updated:", value); // Hata ayıklama için
      setFilter((prev) => ({ ...prev, search: value }));
    } else {
      setFilter((prev) => ({ ...prev, type, value }));
    }
  };

  const handleViewDocument = (arsiv, Arsiv) => {
    if (!arsiv) {
      setToast({
        message: "Belge bulunamadı.",
        color: "danger",
      });
      return;
    }
    try {
      const fileName = arsiv.replace(/\\/g, "/").split("/").pop();
      const baseUrl = "https://speedsofttest.com"; // Sunucu adresiniz
      const fileUrl = `${baseUrl}/arsiv/${fileName}`; // Doğru klasör: /arsiv/

      console.log("Arsiv:", arsiv);
      console.log("FileName:", fileName);
      console.log("FileUrl:", fileUrl);

      // Dosyayı yeni sekmede aç (tüm dosya türleri için)
      window.open(
        fileUrl,
        "_blank",
        `noopener,noreferrer,title=${encodeURIComponent(Arsiv || "Belge")}`,
      );
    } catch (error) {
      console.error("Belge görüntülenirken hata:", error.message);
      setToast({
        message: "Belge görüntülenirken hata oluştu.",
        color: "danger",
      });
    }
  };

  const getFilteredExpenses = () => {
    const today = new Date();
    console.log("Filter applied:", filter); // Hata ayıklama için
    const filteredExpenses = expenses.filter((expense) => {
      const odemeDate = new Date(expense.odemeTarihi);
      const mainCategory = mainCategories.find(
        (cat) => cat.id === expense.masrafAnaKategoriId,
      );
      const subCategory = subCategories.find(
        (sub) => sub.id === expense.masrafAltKategoriId,
      );
      const searchTerm = filter.search?.toLowerCase() || "";

      // Arama filtresi
      const matchesSearch = searchTerm
        ? (expense.aciklama?.toLowerCase() || "").includes(searchTerm) ||
          (mainCategory?.adi?.toLowerCase() || "").includes(searchTerm) ||
          (subCategory?.adi?.toLowerCase() || "").includes(searchTerm)
        : true;

      // Hata ayıklama için
      console.log(
        "Expense:",
        expense.aciklama,
        "Matches search:",
        matchesSearch,
      );

      // Durum ve vade filtresi
      if (filter.type === "status") {
        if (filter.value === "all") return matchesSearch;
        if (filter.value === "Ödenmiş")
          return expense.odemeDurumu === 1 && matchesSearch;
        if (filter.value === "Ödenmemiş")
          return expense.odemeDurumu === 0 && matchesSearch;
      } else if (filter.type === "vade") {
        if (filter.value === "all") return matchesSearch;
        if (filter.value === "Vadesi Geçmiş")
          return odemeDate < today && matchesSearch;
        if (filter.value === "Bugün")
          return (
            odemeDate.toDateString() === today.toDateString() && matchesSearch
          );
        if (filter.value === "Bu Hafta") {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return (
            odemeDate >= weekStart && odemeDate <= weekEnd && matchesSearch
          );
        }
        if (filter.value === "Bu Ay") {
          return (
            odemeDate.getMonth() === today.getMonth() &&
            odemeDate.getFullYear() === today.getFullYear() &&
            matchesSearch
          );
        }
      }
      return matchesSearch;
    });

    console.log("Filtered expenses:", filteredExpenses); // Hata ayıklama için
    return filteredExpenses;
  };

  const listDropdown = {
    "--cui-dropdown-link-hover-color": "#ffffff",
    "--cui-dropdown-link-hover-bg": "#504fb0",
    "--cui-dropdown-link-active-color": "#ffffff",
    "--cui-dropdown-link-active-bg": "#5e5cd0",
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toast && (
          <CToast
            autohide={5000}
            visible={!!toast}
            color={toast.color}
            className="text-white shadow-lg"
            onClose={() => setToast(null)}
          >
            <CToastHeader closeButton={{ label: "Kapat" }}>
              <strong className="me-auto">Bildirim</strong>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        )}
      </CToaster>
      {isLoading && <CSpinner color="primary" />}
      <div className="mb-3">
        <CButton
          color="danger"
          className="text-light"
          onClick={() => navigate("/app/new-expense")}
        >
          <CIcon icon={cilPlus} /> Yeni Masraf Gir
        </CButton>
        <CButton
          color="success"
          className="text-light mx-2"
          onClick={() => navigate("/app/expenses-item")}
        >
          <CIcon icon={cilColorBorder} /> Masraf Kalemleri
        </CButton>
      </div>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="mb-3">
                <CButtonGroup
                  role="group"
                  aria-label="Filter buttons"
                  className="me-2"
                >
                  <CFormCheck
                    type="radio"
                    button={{ color: "primary", variant: "outline" }}
                    name="statusFilter"
                    id="filterAll"
                    autoComplete="off"
                    label="Tümü"
                    checked={filter.type === "status" && filter.value === "all"}
                    onChange={() => handleFilterChange("status", "all")}
                  />
                  <CFormCheck
                    type="radio"
                    button={{ color: "success", variant: "outline" }}
                    name="statusFilter"
                    id="filterPaid"
                    autoComplete="off"
                    label="Ödenmiş"
                    checked={
                      filter.type === "status" && filter.value === "Ödenmiş"
                    }
                    onChange={() => handleFilterChange("status", "Ödenmiş")}
                  />
                  <CFormCheck
                    type="radio"
                    button={{ color: "danger", variant: "outline" }}
                    name="statusFilter"
                    id="filterUnpaid"
                    autoComplete="off"
                    label="Ödenmemiş"
                    checked={
                      filter.type === "status" && filter.value === "Ödenmemiş"
                    }
                    onChange={() => handleFilterChange("status", "Ödenmemiş")}
                  />
                </CButtonGroup>
                <CDropdown>
                  <CDropdownToggle className="mx-2" size="sm" color="primary">
                    <CIcon icon={cilListFilter} /> Vade Tarihine Göre Listele
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem
                      style={listDropdown}
                      onClick={() => handleFilterChange("vade", "all")}
                    >
                      Tümü
                    </CDropdownItem>
                    <CDropdownItem
                      style={listDropdown}
                      onClick={() =>
                        handleFilterChange("vade", "Vadesi Geçmiş")
                      }
                    >
                      Vadesi Geçmiş
                    </CDropdownItem>
                    <CDropdownItem
                      style={listDropdown}
                      onClick={() => handleFilterChange("vade", "Bugün")}
                    >
                      Bugün
                    </CDropdownItem>
                    <CDropdownItem
                      style={listDropdown}
                      onClick={() => handleFilterChange("vade", "Bu Hafta")}
                    >
                      Bu Hafta
                    </CDropdownItem>
                    <CDropdownItem
                      style={listDropdown}
                      onClick={() => handleFilterChange("vade", "Bu Ay")}
                    >
                      Bu Ay
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
                <CFormInput
                  type="text"
                  style={{
                    margin: "5px",
                    width: "200px",
                    display: "inline-block",
                  }}
                  size="sm"
                  placeholder="Masraf ara..."
                  className="my-2 ms-5"
                  value={filter.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
              {getFilteredExpenses().length > 0 ? (
                <CTable align="middle" hover responsive bordered>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>İşlem Tarihi</CTableHeaderCell>
                      <CTableHeaderCell>Belge</CTableHeaderCell>
                      <CTableHeaderCell>Vadesi</CTableHeaderCell>
                      <CTableHeaderCell>Masraf</CTableHeaderCell>
                      <CTableHeaderCell>Hesap</CTableHeaderCell>
                      <CTableHeaderCell>Tutar</CTableHeaderCell>
                      <CTableHeaderCell>Ödeme</CTableHeaderCell>
                      <CTableHeaderCell>Durumu</CTableHeaderCell>
                      <CTableHeaderCell>Not</CTableHeaderCell>
                      <CTableHeaderCell>İşlemler</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {getFilteredExpenses().map((expense) => {
                      const mainCategory = mainCategories.find(
                        (cat) => cat.id === expense.masrafAnaKategoriId,
                      );
                      const subCategory = subCategories.find(
                        (sub) => sub.id === expense.masrafAltKategoriId,
                      );
                      const account = users.find(
                        (user) => user.id === expense.hesapId,
                      );

                      return (
                        <CTableRow key={expense.id}>
                          <CTableDataCell>
                            {expense.islemTarihi?.split("T")[0]}
                          </CTableDataCell>
                          <CTableDataCell>
                            {expense.arsiv ? (
                              <CButton
                                color="primary"
                                size="sm"
                                onClick={() =>
                                  handleViewDocument(
                                    expense.arsiv,
                                    expense.Arsiv,
                                  )
                                }
                              >
                                Görüntüle
                              </CButton>
                            ) : (
                              <CButton
                                color="warning"
                                size="sm"
                                onClick={() => setUploadModal(expense)}
                              >
                                Belge Yükle
                              </CButton>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            {expense.odemeTarihi?.split("T")[0]}
                          </CTableDataCell>
                          <CTableDataCell>
                            {mainCategory?.adi && subCategory?.adi
                              ? `${mainCategory.adi} / ${subCategory.adi}`
                              : "Bilinmeyen Kategori"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {account?.userName || expense.hesapId}
                          </CTableDataCell>
                          <CTableDataCell>{expense.tutar} ₺</CTableDataCell>
                          <CTableDataCell>
                            {expense.odemeTuru || "-"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {expense.odemeDurumu === 1
                              ? "Ödenmiş"
                              : "Ödenmemiş"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {expense.aciklama || "-"}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="warning"
                              size="sm"
                              style={{ color: "white", marginBottom: "3px" }}
                              onClick={() => handleEditExpense(expense)}
                              className="me-2"
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            {expense.odemeDurumu === 0 && (
                              <CButton
                                color="success"
                                size="sm"
                                style={{ color: "white", marginBottom: "3px" }}
                                onClick={() => handlePayExpense(expense)}
                                className="me-2"
                              >
                                Öde
                              </CButton>
                            )}
                            <CButton
                              color="danger"
                              size="sm"
                              style={{ color: "white" }}
                              onClick={() => handleDeleteExpense(expense.id)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })}
                  </CTableBody>
                </CTable>
              ) : (
                <p>Henüz masraf yok.</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CModal
        visible={!!uploadModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setUploadModal(null)}
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}>
          <CModalTitle>Belge Yükle</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleUploadSubmit}>
          <CModalBody>
            <CFormLabel htmlFor="Arsiv">Belge İsmi</CFormLabel>
            <CFormInput
              id="Arsiv"
              name="Arsiv"
              value={uploadData.Arsiv}
              onChange={(e) =>
                setUploadData((prev) => ({ ...prev, Arsiv: e.target.value }))
              }
              placeholder="Belge ismi girin"
            />
            <CFormLabel htmlFor="arsiv" className="mt-3">
              Belge Yükle
            </CFormLabel>
            <CFormInput
              type="file"
              id="arsiv"
              name="arsiv"
              onChange={(e) =>
                setUploadData((prev) => ({ ...prev, arsiv: e.target.files[0] }))
              }
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              required
            />
          </CModalBody>
          <CModalFooter>
            <CButton type="submit" color="primary" disabled={isLoading}>
              {isLoading ? <CSpinner size="sm" /> : "Yükle"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => setUploadModal(null)}
              disabled={isLoading}
            >
              İptal
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
      <CModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setExpenseToDelete(null);
        }}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#dc3545", color: "#FFFFFF" }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Masraf "
            <strong>{expenseToDelete?.aciklama || "Bilinmeyen Masraf"}</strong>"
            silinecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setExpenseToDelete(null);
            }}
          >
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDeleteExpense}
            className="text-white"
            disabled={isLoading}
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Expenses;