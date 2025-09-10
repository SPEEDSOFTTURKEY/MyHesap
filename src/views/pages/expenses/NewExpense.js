import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CSpinner,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import { useState, useEffect, useRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsers } from "../../../context/UsersContext";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

// Hesap kategorileri
const accountCategories = [
  { categoryId: 1, accountName: "Banka Hesapları", type: "bank" },
  { categoryId: 2, accountName: "Kasa Tanımları", type: "cash" },
  { categoryId: 3, accountName: "Kredi Kartları", type: "creditCard" },
  { categoryId: 4, accountName: "Pos Hesapları", type: "pos" },
  { categoryId: 5, accountName: "Şirket Ortakları Hesapları", type: "partner" },
  { categoryId: 6, accountName: "Veresiye Hesapları", type: "debt" },
];

const NewExpense = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { users } = useUsers();
  const [accounts, setAccounts] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [expenseData, setExpenseData] = useState(() => {
    const editData = location.state?.expense;
    return editData
      ? {
          id: editData.id || 0,
          HesapId: editData.hesapId?.toString() || "",
          OdemeDurumu: editData.odemeDurumu?.toString() || "0",
          OdemeTuru: editData.odemeTuru || "",
          Tutar: editData.tutar?.toString() || "",
          Aciklama: editData.aciklama || "",
          OdemeTarihi: editData.odemeTarihi
            ? dayjs(editData.odemeTarihi)
            : dayjs(),
          IslemTarihi: editData.islemTarihi
            ? dayjs(editData.islemTarihi)
            : dayjs(),
          KDVOrani: editData.kdvOrani?.toString() || "1",
          MasrafAltKategoriId: editData.masrafAltKategoriId?.toString() || "",
          MasrafAnaKategoriId: editData.masrafAnaKategoriId?.toString() || "",
          arsiv: null,
          Arsiv: editData.Arsiv || "",
        }
      : {
          id: 0,
          HesapId: "",
          OdemeDurumu: "0",
          OdemeTuru: "",
          Tutar: "",
          Aciklama: "",
          OdemeTarihi: dayjs(),
          IslemTarihi: dayjs(),
          KDVOrani: "1",
          MasrafAltKategoriId: "",
          MasrafAnaKategoriId: "",
          arsiv: null,
          Arsiv: "",
        };
  });
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toaster = useRef();

  // Net tutarı hesapla
  const calculateNetAmount = () => {
    const tutar = parseFloat(expenseData.Tutar) || 0;
    const kdvOrani = parseFloat(expenseData.KDVOrani) || 0;
    return (tutar / (1 + kdvOrani / 100)).toFixed(2);
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get( `${API_BASE_URL}/Hesap/hesap-get-all`, {
        headers: { accept: "*/*" },
      });

      // API'den gelen veriyi kontrol et
      console.log("API'den gelen hesaplar:", response.data);

      // Hesapları formatla
      const formattedAccounts = response.data.map((account) => ({
        id: account.id,
        userName: account.tanim,
        currency: account.paraBirimi || "TRY",
        balance: account.guncelBakiye || 0,
        accountNumber: account.hesapNo || "",
        labelColor: account.etiketRengi || "",
        spendingLimit: account.harcamaLimiti || 0,
        type: account.hesapKategoriId, // Bu değer direkt number olarak kullanılacak
      }));

      console.log("Formatlanmış hesaplar:", formattedAccounts);
      setAccounts(formattedAccounts);
    } catch (error) {
      console.error(
        "Hesaplar çekilirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Hesaplar yüklenirken hata oluştu.",
        color: "danger",
      });
    }
  };

  const fetchMainCategories = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
        {
          headers: { accept: "*/*" },
        },
      );
      setMainCategories(response.data);
    } catch (error) {
      console.error(
        "Ana kategoriler çekilirken hata:",
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
      const response = await api.get(
        `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-get-all`,
        {
          headers: { accept: "*/*" },
        },
      );
      setSubCategories(response.data);
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

  // Component mount olduğunda tüm verileri çek
  useEffect(() => {
    fetchAccounts();
    fetchMainCategories();
    fetchSubCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "OdemeDurumu" && value === "1" && !prev.OdemeTuru
        ? { OdemeTuru: "Nakit" }
        : {}),
      ...(name === "OdemeDurumu" && value === "0" ? { OdemeTuru: "" } : {}),
      ...(name === "MasrafAnaKategoriId" && value !== prev.MasrafAnaKategoriId
        ? { MasrafAltKategoriId: "" }
        : {}),
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setExpenseData((prev) => ({ ...prev, arsiv: file }));
    if (file) {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setExpenseData((prev) => ({ ...prev, arsiv: null }));
    setPreviewUrl(null);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "bi-file-earmark-pdf";
      case "docx":
        return "bi-file-earmark-word";
      default:
        return "bi-file-earmark";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!expenseData.HesapId) {
      setToast({
        message: "Lütfen bir hesap seçin.",
        color: "danger",
      });
      setIsLoading(false);
      return;
    }
    if (!expenseData.MasrafAnaKategoriId || !expenseData.MasrafAltKategoriId) {
      setToast({
        message: "Lütfen masraf kategorilerini seçin.",
        color: "danger",
      });
      setIsLoading(false);
      return;
    }
    if (!expenseData.Tutar || parseFloat(expenseData.Tutar) <= 0) {
      setToast({
        message: "Lütfen geçerli bir tutar girin.",
        color: "danger",
      });
      setIsLoading(false);
      return;
    }
    if (expenseData.OdemeDurumu === "1" && !expenseData.OdemeTuru) {
      setToast({
        message: "Ödenmiş masraflar için ödeme türü seçmelisiniz.",
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("Id", expenseData.id.toString());
    formData.append("HesapId", expenseData.HesapId);
    formData.append("OdemeDurumu", expenseData.OdemeDurumu);
    formData.append(
      "OdemeTuru",
      expenseData.OdemeDurumu === "1" ? expenseData.OdemeTuru : "",
    );
    formData.append("Tutar", expenseData.Tutar);
    formData.append(
      "GuncellenmeTarihi",
      expenseData.IslemTarihi.format("DD.MM.YYYY"),
    );
    formData.append(
      "EklenmeTarihi",
      expenseData.IslemTarihi.format("DD.MM.YYYY"),
    );
    formData.append("Aciklama", expenseData.Aciklama || "");
    formData.append(
      "OdemeTarihi",
      expenseData.OdemeTarihi.format("DD.MM.YYYY"),
    );
    formData.append(
      "IslemTarihi",
      expenseData.IslemTarihi.format("DD.MM.YYYY"),
    );
    formData.append("Arsiv", expenseData.Arsiv || "");
    if (expenseData.arsiv) {
      formData.append("arsiv", expenseData.arsiv);
    } else {
      const dummyFile = new File([""], "dummy.png", { type: "image/png" });
      formData.append("arsiv", dummyFile);
    }
    formData.append("MasrafAltKategoriId", expenseData.MasrafAltKategoriId);
    formData.append("MasrafAnaKategoriId", expenseData.MasrafAnaKategoriId);
    formData.append("KDVOrani", expenseData.KDVOrani);

    try {
      if (expenseData.id) {
        await api.put(`${API_BASE_URL}/masraf/masraf-update`, formData, {
          headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
        });
      } else {
        await api.post(`${API_BASE_URL}/masraf/masraf-create`, formData, {
          headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
        });
      }

      // Hesap bakiyesini güncelle (eğer ödenmiş ise)
      const selectedAccount = accounts.find(
        (acc) => acc.id === parseInt(expenseData.HesapId),
      );

      if (selectedAccount && expenseData.OdemeDurumu === "1") {
        const newBalance =
          selectedAccount.balance - parseFloat(expenseData.Tutar);

        await api.put(
          `${API_BASE_URL}/Hesap/hesap-update`,
          {
            id: selectedAccount.id,
            tanim: selectedAccount.userName,
            hesapNo: selectedAccount.accountNumber,
            guncelBakiye: newBalance,
            paraBirimi: selectedAccount.currency,
            etiketRengi: selectedAccount.labelColor,
            harcamaLimiti: selectedAccount.spendingLimit || 0,
            guncellenmeTarihi: new Date().toISOString(),
            hesapKategoriId: selectedAccount.type, // Direkt type değerini kullan
          },
          {
            headers: { "Content-Type": "application/json", accept: "*/*" },
          },
        );
      }

      setToast({
        message: "Masraf başarıyla kaydedildi!",
        color: "success",
      });
      navigate("/app/expenses");
    } catch (error) {
      console.error("Masraf kaydedilirken hata oluştu:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setToast({
        message: `Masraf kaydedilirken bir hata oluştu: ${error.response?.data?.title || error.response?.data || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
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
      <div className="p-4">
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CButton type="submit" color="primary" disabled={isLoading}>
              {isLoading ? <CSpinner size="sm" /> : "Masrafı Kaydet"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => navigate("/app/expenses")}
              disabled={isLoading}
              className="ms-2"
            >
              İptal
            </CButton>
          </div>
          <CRow>
            <CCol md={6}>
              <CCard>
                <CCardHeader
                  style={{
                    backgroundColor: " #2965A8",
                    color: "white",
                    fontSize: "large",
                  }}
                >
                  HESAP KALEMİ
                </CCardHeader>
                <CCardBody>
                  <CFormLabel htmlFor="HesapId">Hesap Seç</CFormLabel>
                  <CFormSelect
                    id="HesapId"
                    name="HesapId"
                    value={expenseData.HesapId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {accountCategories.map((category) => {
                      // Her kategori için hesapları filtrele
                      const categoryAccounts = accounts.filter(
                        (account) => account.type === category.categoryId,
                      );

                      // Eğer bu kategoride hesap varsa göster
                      if (categoryAccounts.length > 0) {
                        return (
                          <optgroup
                            key={category.categoryId}
                            label={category.accountName}
                          >
                            {categoryAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.userName} ({account.currency})
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                      return null;
                    })}
                  </CFormSelect>

                  <CFormLabel htmlFor="MasrafAnaKategoriId" className="mt-3">
                    Masraf Ana Kategorisi
                  </CFormLabel>
                  <CFormSelect
                    id="MasrafAnaKategoriId"
                    name="MasrafAnaKategoriId"
                    value={expenseData.MasrafAnaKategoriId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {mainCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.adi}
                      </option>
                    ))}
                  </CFormSelect>

                  <CFormLabel htmlFor="MasrafAltKategoriId" className="mt-3">
                    Masraf Alt Kategorisi
                  </CFormLabel>
                  <CFormSelect
                    id="MasrafAltKategoriId"
                    name="MasrafAltKategoriId"
                    value={expenseData.MasrafAltKategoriId}
                    onChange={handleInputChange}
                    required
                    disabled={!expenseData.MasrafAnaKategoriId}
                  >
                    <option value="">Seçiniz</option>
                    {subCategories
                      .filter(
                        (sub) =>
                          sub.masrafAnaKategoriId?.toString() ===
                          expenseData.MasrafAnaKategoriId,
                      )
                      .map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.adi}
                        </option>
                      ))}
                  </CFormSelect>

                  <CFormLabel htmlFor="Aciklama" className="mt-3">
                    Açıklama
                  </CFormLabel>
                  <CFormTextarea
                    name="Aciklama"
                    rows={3}
                    value={expenseData.Aciklama}
                    onChange={handleInputChange}
                  />

                  <CFormLabel htmlFor="Arsiv" className="mt-3">
                    Belge İsmi
                  </CFormLabel>
                  <CFormInput
                    name="Arsiv"
                    value={expenseData.Arsiv}
                    onChange={handleInputChange}
                  />

                  <CFormLabel htmlFor="arsiv" className="mt-3">
                    Belge Yükle
                  </CFormLabel>
                  {!expenseData.arsiv ? (
                    <div
                      className="d-flex align-items-center justify-content-center border border-2 border-dashed border-secondary rounded"
                      style={{
                        width: "150px",
                        height: "150px",
                        position: "relative",
                      }}
                    >
                      <input
                        type="file"
                        id="arsiv"
                        name="arsiv"
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.docx"
                        className="position-absolute w-100 h-100 opacity-0 cursor-pointer"
                      />
                      <span className="text-secondary fw-semibold">
                        Dosya Seç
                      </span>
                    </div>
                  ) : (
                    <div className="border border-secondary rounded p-2">
                      {previewUrl &&
                      expenseData.arsiv.type.startsWith("image/") ? (
                        <img
                          src={previewUrl}
                          alt="Önizleme"
                          className="img-fluid rounded"
                          style={{ maxWidth: "150px", maxHeight: "150px" }}
                        />
                      ) : (
                        <div className="d-flex align-items-center">
                          <i
                            className={`bi ${getFileIcon(
                              expenseData.arsiv.name,
                            )} me-2 fs-4 text-secondary`}
                          ></i>
                          <span
                            className="text-secondary text-truncate"
                            style={{ maxWidth: "150px" }}
                          >
                            {expenseData.arsiv.name}
                          </span>
                        </div>
                      )}
                      <div className="mt-2">
                        <CButton
                          color="danger"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={handleRemoveFile}
                          className="me-2"
                        >
                          Kaldır
                        </CButton>
                        <label
                          htmlFor="arsiv"
                          color="info"
                          className="btn btn-outline-secondary btn-sm"
                        >
                          Değiştir
                          <input
                            type="file"
                            id="arsiv"
                            name="arsiv"
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg,.docx"
                            className="d-none"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
            <CCol md={6}>
              <CCard>
                <CCardHeader
                  style={{
                    backgroundColor: " #4DAD4A",
                    color: "white",
                    fontSize: "large",
                  }}
                >
                  TUTAR
                </CCardHeader>
                <CCardBody>
                  <CFormLabel htmlFor="OdemeDurumu">Ödeme Durumu</CFormLabel>
                  <CFormSelect
                    name="OdemeDurumu"
                    value={expenseData.OdemeDurumu}
                    onChange={handleInputChange}
                  >
                    <option value="0">Ödenmemiş</option>
                    <option value="1">Ödenmiş</option>
                  </CFormSelect>

                  <CFormLabel htmlFor="OdemeTuru" className="mt-3">
                    Ödeme Türü
                  </CFormLabel>
                  <CFormSelect
                    name="OdemeTuru"
                    value={expenseData.OdemeTuru}
                    onChange={handleInputChange}
                    disabled={expenseData.OdemeDurumu === "0"}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Nakit">Nakit</option>
                    <option value="Kart">Kart</option>
                    <option value="Kredi">Kredi</option>
                  </CFormSelect>

                  <CFormLabel htmlFor="IslemTarihi" className="mt-3">
                    İşlem Tarihi
                  </CFormLabel>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD.MM.YYYY"
                      value={expenseData.IslemTarihi}
                      onChange={(date) =>
                        setExpenseData((prev) => ({
                          ...prev,
                          IslemTarihi: date,
                        }))
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          id: "IslemTarihi",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <CFormLabel htmlFor="OdemeTarihi" className="mt-3">
                    Ödeme Tarihi
                  </CFormLabel>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="DD.MM.YYYY"
                      value={expenseData.OdemeTarihi}
                      onChange={(date) =>
                        setExpenseData((prev) => ({
                          ...prev,
                          OdemeTarihi: date,
                        }))
                      }
                      slotProps={{
                        textField: {
                          size: "small",
                          id: "OdemeTarihi",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <CFormLabel htmlFor="Tutar" className="mt-3">
                    Tutar (KDV Dahil)
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    name="Tutar"
                    value={expenseData.Tutar}
                    onChange={handleInputChange}
                    required
                  />

                  <CFormLabel htmlFor="KDVOrani" className="mt-3">
                    KDV Oranı (%)
                  </CFormLabel>
                  <CFormSelect
                    name="KDVOrani"
                    value={expenseData.KDVOrani}
                    onChange={handleInputChange}
                  >
                    {[1, 8, 10, 18, 20].map((rate) => (
                      <option key={rate} value={rate}>
                        %{rate}
                      </option>
                    ))}
                  </CFormSelect>

                  <CFormLabel htmlFor="NetTutar" className="mt-3">
                    Net Tutar (KDV Hariç)
                  </CFormLabel>
                  <CFormInput
                    type="text"
                    name="NetTutar"
                    value={calculateNetAmount()}
                    readOnly
                  />
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CForm>
      </div>
    </>
  );
};

export default NewExpense;
