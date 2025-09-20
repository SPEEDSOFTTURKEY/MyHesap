import { useEffect, useState } from "react";
import {
  CButton,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import WidgetsDropdown from "../../components/WidgetsDropdown";
import { useAccounts } from "../../context/AccountsContext"; // AccountsContext kullanıyoruz
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom"; // Tıklama sonrası navigasyon için ekledim
import { cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import api from "../../api/api";

const Dashboard = () => {
  const [showCashForm, setShowCashForm] = useState(false);
  const [formType, setFormType] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { users, setUsers, createAccount, fetchAccount } = useAccounts(); // fetchAccount'ı da import ettik (tıklama için)
  const { user, logout } = useUser();
  const navigate = useNavigate(); // Navigasyon için
  const API_BASE_URL = "https://localhost:44375/api";

  const typeToCategoryId = {
    bank: 1,
    cash: 2,
    creditCard: 3,
    pos: 4,
    partner: 5,
    debt: 6,
  };

  // İlk yüklemede hesapları çek
  useEffect(() => {
    if (users.length === 0) {
      fetchAccounts();
    }
  }, [users.length]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/Hesap/hesap-get-all`);
      const fetchedAccounts = Array.isArray(response.data)
        ? response.data
        : [response.data];

      console.log("📦 Gelen API verisi:", fetchedAccounts);

      // Tanımı boş olanları ve pasifleri (opsiyonel) listeleme
      const filteredAccounts = fetchedAccounts.filter(
        (acc) =>
          acc?.tanim &&
          acc.tanim.trim() !== "" &&
          (Number(acc.aktif) === 1 || Number(acc.durumu) === 1)
      );

      const formattedUsers = filteredAccounts.map((account) => ({
        id: account.id,
        userName: account.tanim.trim(),
        accountNumber: account.hesapNo || "",
        balance: parseFloat(account.guncelBakiye) || 0,
        currency: account.paraBirimi || "TRY",
        labelColor: account.etiketRengi || "#ccc",
        type:
          Object.keys(typeToCategoryId).find(
            (key) => typeToCategoryId[key] === account.hesapKategoriId
          ) || "cash",
        transactions: account.transactions || [],
        spendingLimit: parseFloat(account.harcamaLimiti) || 0,
        hesapKategoriId: account.hesapKategoriId || 1,
        // İstersen UI filtrelerinde kullanmak için:
        aktif: account.aktif,
        durumu: account.durumu,
        tanim: account.tanim,
      }));

      console.log("🛠️ Formatlanmış hesaplar:", formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Hesaplar alınamadı:", error);
      setToast({
        message: `Hesaplar yüklenirken hata oluştu: ${error.message || "Bilinmeyen hata"}`,
        color: "danger",
      });
    }
  };

  // Yeni: Hesaba tıklandığında bu fonksiyonu çağır – ID'yi API'ye gönder
  const handleAccountClick = async (accountId) => {
    console.log("Tıklanan hesap ID:", accountId); // Debug için
    try {
      // AccountsContext'teki fetchAccount'ı çağır – bu, /Hesap-get-by-Id/{accountId} endpoint'ini tetikleyecek
      await fetchAccount(accountId); // Context'teki fonksiyon, ID'yi route'a koyar
      // Opsiyonel: Detay sayfasına yönlendir
      navigate(`/app/account/${accountId}`); // Eğer böyle bir route'un varsa, yoksa kaldır
    } catch (error) {
      console.error("Hesap detayları yüklenemedi:", error);
      setToast({
        message: `Hesap detayları yüklenirken hata: ${error.message}`,
        color: "danger",
      });
    }
  };

  const handleCashSubmit = async (formData) => {
    setIsSaving(true);

    // Tanım boşsa engelle
    if (!formData.description || !formData.description.trim()) {
      setToast({
        message: "Tanım alanı boş bırakılamaz.",
        color: "danger",
      });
      setIsSaving(false);
      return;
    }

    try {
      // Balance'ı string olarak ele al ve formatı temizle
      const cleanBalance =
        typeof formData.balance === "string"
          ? parseFloat(formData.balance.replace(/\./g, "").replace(",", ".")) ||
          0
          : formData.balance || 0;

      const newAccountData = {
        userName: formData.description.trim(),
        accountNumber: formData.accountNumber,
        balance: cleanBalance,
        currency: formData.currency || "TRY",
        labelColor: formData.tagColor || "#0d6efd",
        spendingLimit: formData.spendingLimit
          ? parseFloat(
            formData.spendingLimit.replace(/\./g, "").replace(",", ".")
          )
          : 0,
        type: formType,
        description: formData.description.trim(),
        hesapKategoriId: typeToCategoryId[formType] || 2, // Varsayılan: cash
      };

      if (!newAccountData.accountNumber) {
        setToast({
          message: "Hesap No zorunlu alandır.",
          color: "danger",
        });
        setIsSaving(false);
        return;
      }

      if (users.some((u) => u.accountNumber === newAccountData.accountNumber)) {
        setToast({
          message: "Bu hesap numarası zaten kullanımda.",
          color: "danger",
        });
        setIsSaving(false);
        return;
      }

      await createAccount(newAccountData); // AccountsContext'teki createAccount fonksiyonunu kullanıyoruz
      await fetchAccounts(); // Yeni hesapları tekrar çek
      setShowCashForm(false);
      setToast({ message: "Hesap başarıyla oluşturuldu.", color: "success" });
    } catch (error) {
      console.error("Hesap oluşturulamadı:", error);
      setToast({
        message:
          "Hesap oluşturulurken hata oluştu: " +
          (error.response?.data?.message || error.message),
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const CashForm = ({ onSubmit, visible, onClose, type }) => {
    const [formData, setFormData] = useState({
      description: "",
      tagColor: "#0d6efd",
      currency: "TRY",
      accountNumber: "",
      balance: "",
      spendingLimit: "",
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormattedNumberChange = (e) => {
      const { name, value } = e.target;
      const numericOnly = value.replace(/[^\d]/g, "");
      if (!numericOnly) {
        setFormData((prev) => ({ ...prev, [name]: "" }));
        return;
      }
      const formatted = formatWithSeparators(numericOnly);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    };

    const formatWithSeparators = (value) => {
      if (!value) return "";
      const cleanedValue = value.replace(/[^\d]/g, "");
      let intPart = cleanedValue.slice(0, -2) || "0";
      let decimalPart = cleanedValue.slice(-2).padStart(2, "0");
      const formattedInt = parseInt(intPart, 10).toLocaleString("tr-TR");
      return `${formattedInt},${decimalPart}`;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const dataToSubmit = {
        description: formData.description,
        tagColor: formData.tagColor,
        currency: formData.currency,
        accountNumber: formData.accountNumber,
        balance: formData.balance
          ? parseFloat(formData.balance.replace(/\./g, "").replace(",", "."))
          : 0,
        spendingLimit: formData.spendingLimit
          ? parseFloat(
            formData.spendingLimit.replace(/\./g, "").replace(",", ".")
          )
          : 0,
      };
      onSubmit(dataToSubmit);
      setFormData({
        description: "",
        tagColor: "#0d6efd",
        currency: "TRY",
        accountNumber: "",
        balance: "",
        spendingLimit: "",
      });
    };

    return (
      <CModal
        visible={visible}
        onClose={onClose}
        backdrop="static"
        keyboard={false}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            {type === "creditCard"
              ? "Kredi Kartı Ekle"
              : `Yeni ${typeToLabel[type]} Ekle`}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CCol className="mb-3">
              <CFormLabel htmlFor="description">Tanım</CFormLabel>
              <CFormInput
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol className="mb-3">
              <CFormLabel htmlFor="currency">Para Birimi</CFormLabel>
              <CFormSelect
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <option value="TRY">₺ Türk Lirası (TRY)</option>
                <option value="USD">$ Amerikan Doları (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ İngiliz Sterlini (GBP)</option>
              </CFormSelect>
            </CCol>
            <CCol className="mb-3">
              <CFormLabel htmlFor="accountNumber">Hesap numarası</CFormLabel>
              <CFormInput
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
              />
            </CCol>
            <CCol className="mb-3">
              <CFormLabel htmlFor="tagColor">Etiket Rengi</CFormLabel>
              <CFormInput
                type="color"
                id="tagColor"
                name="tagColor"
                value={formData.tagColor}
                onChange={handleChange}
              />
            </CCol>
            <CCol className="mb-3">
              <CFormLabel htmlFor="balance">Güncel Bakiye</CFormLabel>
              <CFormInput
                type="text"
                id="balance"
                name="balance"
                value={formData.balance}
                onChange={handleFormattedNumberChange}
                placeholder="0,00"
              />
            </CCol>
            {type === "creditCard" && (
              <CCol className="mb-3">
                <CFormLabel htmlFor="spendingLimit">Harcama Limiti</CFormLabel>
                <CFormInput
                  type="text"
                  id="spendingLimit"
                  name="spendingLimit"
                  value={formData.spendingLimit}
                  onChange={handleFormattedNumberChange}
                  placeholder="0,00"
                />
                <div className="form-text">
                  Bu limitin üzerinde borç varsa hata raporu gönderilir.
                </div>
              </CCol>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="primary" type="submit" disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </CButton>
            <CButton color="secondary" onClick={onClose} disabled={isSaving}>
              İptal
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    );
  };

  const typeToLabel = {
    bank: "Banka Hesabı",
    cash: "Kasa Hesabı",
    creditCard: "Kredi Kartı",
    pos: "POS Hesabı",
    partner: "Ortaklar Hesabı",
    debt: "Veresiye Hesabı",
  };

  return (
    <>
      <div className="d-flex flex-column align-items-start mb-4">
        <CDropdown variant="btn-group" className="me-2">
          <CDropdownToggle color="success" size="m" className="text-light">
            <CIcon icon={cilPlus} size="m" /> Yeni Hesap Ekle
          </CDropdownToggle>
          <CDropdownMenu>
            {Object.entries(typeToLabel).map(([key, label]) => (
              <CDropdownItem
                key={key}
                onClick={() => {
                  setFormType(key);
                  setShowCashForm(true);
                }}
              >
                {label}
              </CDropdownItem>
            ))}
          </CDropdownMenu>
        </CDropdown>
        <CashForm
          visible={showCashForm}
          onClose={() => setShowCashForm(false)}
          onSubmit={handleCashSubmit}
          type={formType}
        />
      </div>
      {/* WidgetsDropdown'a handleAccountClick prop'u geçir – içindeki her hesap item'ına onClick ekle */}
      <WidgetsDropdown accounts={users} onAccountClick={handleAccountClick} />
    </>
  );
};

export default Dashboard;