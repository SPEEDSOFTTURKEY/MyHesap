import { useState, useEffect } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
} from "@coreui/react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";

const API_BASE_URL = "https://localhost:44375/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const StockMovementModal = ({
  visible,
  onClose,
  onSubmit,
  product,
  addToast,
}) => {
  const [formData, setFormData] = useState({
    transactionDate: dayjs(),
    transactionType: "1",
    quantity: "",
    unitCost: product?.purchasePrice || "",
    warehouseId: "",
    description: "",
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Depoları API'den çek
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${API_BASE_URL}/depo/get-all`);
      console.log("Raw depo data from API (depo/get-all):", data); // API verisini logla
      setWarehouses(data.filter((item) => item.durumu === 1));
    } catch (err) {
      addToast(err.response?.data?.message || "Depolar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ürün ve depo için mevcut stoğu çek
  const fetchCurrentStock = async (urunId, depoId) => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/urun/urun-depolardaki-stoklar/${urunId}`
      );
      console.log("Raw stock data from API (urun-depolardaki-stoklar):", data); // API verisini logla
      const depotStock = data.find(
        (stock) => stock.depoId === parseInt(depoId)
      );
      return depotStock ? depotStock.miktar : 0;
    } catch (err) {
      addToast(
        err.response?.data?.message || "Depo stoğu yüklenemedi.",
        "error"
      );
      return 0;
    }
  };

  // Modal açıldığında form verilerini başlat
  useEffect(() => {
    if (visible) {
      fetchWarehouses();
      setFormData({
        transactionDate: dayjs(),
        transactionType: "1",
        quantity: "",
        unitCost: product?.purchasePrice || "",
        warehouseId: "",
        description: "",
      });
    }
  }, [visible, product]);

  // Form input değişikliklerini işle
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Tarih seçici değişikliklerini işle
  const handleDateChange = (newValue) => {
    setFormData((prev) => ({
      ...prev,
      transactionDate: newValue,
    }));
  };

  // Form gönderimini işle
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gerekli alanları doğrula
      if (!formData.quantity || !formData.warehouseId || !formData.unitCost) {
        throw new Error("Miktar, Birim Maliyet ve Depo alanları zorunludur.");
      }
      if (parseFloat(formData.quantity) <= 0) {
        throw new Error("Miktar sıfırdan büyük olmalıdır.");
      }
      if (parseFloat(formData.unitCost) < 0) {
        throw new Error("Birim Maliyet negatif olamaz.");
      }
      if (!product?.id) {
        throw new Error("Ürün ID'si bulunamadı.");
      }

      // Kullanıcı ID'sini al
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };

      // Depo ID'sinin geçerli olduğunu doğrula
      const selectedWarehouse = warehouses.find(
        (w) => w.id === parseInt(formData.warehouseId)
      );
      if (!selectedWarehouse) {
        throw new Error("Geçersiz depo seçimi.");
      }

      // Birim maliyet değiştiyse yeni ürün oluştur
      const isNewProduct =
        parseFloat(formData.unitCost) !== parseFloat(product.purchasePrice);
      let newProductId = product.id;

      if (isNewProduct) {
        const newProductData = {
          adi: `${product.name} (Yeni Maliyet)`,
          urunTipi: product.type === "Stoklu",
          birimAdi: product.unit === "Adet" ? 0 : product.unit,
          satisFiyat: product.salePrice,
          alisFiyat: parseFloat(formData.unitCost),
          satisKDV: product.saleVatRate,
          alisKDV: product.purchaseVatRate,
          satisKdvDahilmi: product.saleVatIncluded,
          alisKdvDahilmi: product.purchaseVatIncluded,
          alisIskontosu: product.purchaseDiscount,
          oivOrani: product.otvRate,
          otvTipi: product.otvType,
          urunKategoriId: product.categoryId || 0,
          urunMarkaId: product.brandId || 0,
          urunKodu: product.productCode,
          gtipKodu: product.gtip,
          ulkeId: parseInt(product.countryCode) || 0,
          stokMiktari:
            formData.transactionType === "1"
              ? parseFloat(formData.quantity)
              : 0,
          faturaBasligi: product.invoiceTitle,
          aciklama: product.description,
          barkod: product.barcode,
          urunRafId: product.shelfId || 0,
          depoId:product.depoId || 0,
          stokTakip: product.trackStock ? "Evet" : "Hayır",
          kritikStok: product.criticalStock,
          etiketler: product.tags.join(","),
          fotograf: product.images[0] || "",
          kullaniciId: user.id, // Kullanıcı ID'sini ekle
        };
        console.log("Creating new product with payload:", newProductData);
        const { data } = await api.post(
          `${API_BASE_URL}/urun/urun-create`,
          newProductData
        );
        console.log("Response from API (urun-create):", data); // API verisini logla
        newProductId = data.id;
        addToast("Yeni ürün oluşturuldu.", "success");
      }

      // Çıkış işlemi için stok kontrolü yap
      if (formData.transactionType === "0") {
        const currentStock = await fetchCurrentStock(
          newProductId,
          formData.warehouseId
        );
        if (currentStock < parseFloat(formData.quantity)) {
          throw new Error("Çıkış miktarı mevcut stoktan fazla olamaz.");
        }
      }

      // Stok hareketi için FormData oluştur (multipart/form-data için)
      const stockMovementData = new FormData();
      stockMovementData.append("Id", "0"); // Yeni kayıt için Id=0
      stockMovementData.append("UrunId", newProductId);
      stockMovementData.append("IslemTipi", parseInt(formData.transactionType));
      stockMovementData.append("Miktar", parseFloat(formData.quantity));
      stockMovementData.append("Maliyet", parseFloat(formData.unitCost));
      stockMovementData.append("DepoId", parseInt(formData.warehouseId));
      stockMovementData.append(
        "Aciklama",
        formData.description || "Manuel Giriş"
      );
      stockMovementData.append(
        "IslemTarihi",
        formData.transactionDate.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
      );
      stockMovementData.append("KullaniciId", user.id); // Kullanıcı ID'sini ekle

      // Stok hareketi payload'unu logla
      console.log(
        "Sending stock movement payload to /api/urun/urun-manuelstokgiris:"
      );
      for (let [key, value] of stockMovementData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Stok hareketi isteğini gönder
      const { data: stockResponse } = await api.post(
        `${API_BASE_URL}/urun/urun-manuelstokgiris`,
        stockMovementData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Response from API (urun-manuelstokgiris):", stockResponse); // API verisini logla

      // Depo stoğunu al
      const currentStock = await fetchCurrentStock(
        newProductId,
        formData.warehouseId
      );

      // Yeni stok değerini hesapla
      const stockChange =
        parseFloat(formData.quantity) *
        (formData.transactionType === "1" ? 1 : -1);
      const newStockValue = currentStock + stockChange;

      // Yeni stok değerini doğrula
      if (newStockValue < 0) {
        throw new Error("Stok miktarı negatif olamaz.");
      }

      // Depo stok güncelleme için JSON payload oluştur
      const stockUpdateData = {
        urunId: newProductId,
        kullaniciId: user.id, // Kullanıcı ID'sini ekle
        depoMiktarlari: [
          {
            depoId: parseInt(formData.warehouseId),
            miktar: newStockValue,
          },
        ],
      };

      // Depo stok güncelleme payload'unu logla
      console.log(
        "Sending depot stock update payload to /api/urun/urun-toplu-depostok-guncelle:",
        stockUpdateData
      );

      // Depo stok güncelleme isteğini gönder
      const { data: stockUpdateResponse } = await api.post(
        `${API_BASE_URL}/urun/urun-toplu-depostok-guncelle`,
        stockUpdateData
      );
      console.log("Response from API (urun-toplu-depostok-guncelle):", stockUpdateResponse); // API verisini logla

      // Tablo için hareket verisini hazırla
      const newMovement = {
        id: stockResponse?.id || Date.now(), // API'den ID dönmezse geçici ID
        date: formData.transactionDate.format("YYYY-MM-DD HH:mm:ss"),
        description: formData.description || "Manuel Giriş",
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.unitCost),
      };

      // Tabloya eklenen hareketi logla
      console.log("Adding new movement to table:", newMovement);

      addToast("Stok hareketi kaydedildi.", "success");
      onSubmit(newMovement);
    } catch (err) {
      // Hata detaylarını logla
      console.error(
        "Error during submission:",
        err.response?.data || err.message
      );
      addToast(
        err.response?.data?.message ||
          err.message ||
          "Stok hareketi kaydedilemedi.",
        "error"
      );
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" size="lg">
      <CModalHeader>
        <CModalTitle>Manuel Giriş-Çıkış İşlemleri</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CCard className="mb-3">
            <CCardBody className="bg-danger text-white">
              <h4>
                Dikkat <CIcon icon={cilWarning} size="lg" />
              </h4>
              <p>
                Alış, satış, iade ya da üretim dışında bu ürünün stok giriş
                çıkış işlemi varsa buradan yapabilirsiniz. Buradan yapacağınız
                işlem, müşterileri ya da tedarikçi bakiyelerinizi etkilemeyecek,
                sadece depo stoklarınızı güncelleyecektir.
              </p>
            </CCardBody>
          </CCard>
          <CFormLabel>İşlem Tarihi</CFormLabel>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={formData.transactionDate}
              onChange={handleDateChange}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true, className: "mb-3" } }}
            />
          </LocalizationProvider>
          <CFormLabel>İşlem Tipi</CFormLabel>
          <CFormSelect
            name="transactionType"
            value={formData.transactionType}
            onChange={handleChange}
            className="mb-3"
          >
            <option value="1">Stoklara Giriş Yap</option>
            <option value="0">Stoklardan Çıkış Yap</option>
          </CFormSelect>
          <CFormLabel>Miktar (Adet)</CFormLabel>
          <CFormInput
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            className="mb-3"
            step="0.01"
            min="0.01"
          />
          <CFormLabel>Birim Maliyet</CFormLabel>
          <CFormInput
            type="number"
            name="unitCost"
            value={formData.unitCost}
            onChange={handleChange}
            required
            className="mb-3"
            step="0.01"
            min="0"
          />
          <CFormLabel>İlgili Depo</CFormLabel>
          <CFormSelect
            name="warehouseId"
            value={formData.warehouseId}
            onChange={handleChange}
            className="mb-3"
            disabled={loading}
            required
          >
            <option value="">Depo Seç</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.adi}
              </option>
            ))}
          </CFormSelect>
          <CFormLabel>Açıklama</CFormLabel>
          <CFormTextarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mb-3"
          />
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" type="submit" onClick={handleSubmit}>
          Kaydet
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          Vazgeç
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default StockMovementModal;