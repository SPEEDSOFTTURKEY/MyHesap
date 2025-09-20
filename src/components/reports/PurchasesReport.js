import { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormLabel,
  CFormSelect,
  CRow,
  CCol,
  CButton,
} from "@coreui/react";
import ReportForm from "./ReportForm";
import DatePickerField from "./DatePickerField";
import axios from "axios";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Türkçe karakter haritası
const turkishCharMap = {
  Ç: "C",
  ç: "c",
  Ğ: "G",
  ğ: "g",
  İ: "I",
  ı: "i",
  Ö: "O",
  ö: "o",
  Ş: "S",
  ş: "s",
  Ü: "U",
  ü: "u",
};

// Türkçe karakterleri dönüştürme fonksiyonu
const convertTurkishChars = (text) => {
  if (!text) return text;
  return text.replace(
    /[ÇçĞğİıÖöŞşÜü]/g,
    (char) => turkishCharMap[char] || char,
  );
};

// Türkçe font ayarları
const registerTurkishFont = (doc) => {
  try {
    doc.setFont("times", "normal");
  } catch (error) {
    console.error("Font ayarlama hatası:", error);
    doc.setFont("helvetica", "normal");
  }
};

const API_BASE_URL = "https://speedsofttest.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const PurchasesReport = () => {
  const [formData, setFormData] = useState({
    searchType: "",
    dateRangeStart: dayjs().subtract(1, "month"),
    dateRangeEnd: dayjs(),
    supplier: "",
    productService: "",
    category: "",
    brand: "",
    warehouse: "",
  });

  const [purchasesData, setPurchasesData] = useState([]);
  const [suppliersData, setSuppliersData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [brandsData, setBrandsData] = useState([]);
  const [warehousesData, setWarehousesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    // Sayfa yüklendiğinde tüm verileri çek
    fetchPurchasesData();
    fetchSuppliersData();
    fetchCategoriesData();
    fetchBrandsData();
    fetchWarehousesData();
    fetchProductsData();
  }, []);

  const fetchPurchasesData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(
        `${API_BASE_URL}/alis/alis-get-all`,
        {
          headers: { "Cache-Control": "no-cache" },
        },
      );
      setPurchasesData(response.data);
    } catch (error) {
      console.error("Alış verileri çekme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliersData = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/tedarikci/tedarikci-get-all`,
      );
      setSuppliersData(response.data);
    } catch (error) {
      console.error("Tedarikçi verileri çekme hatası:", error);
    }
  };

  const fetchCategoriesData = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/urunKategori/get-all`,
      );
      setCategoriesData(response.data);
    } catch (error) {
      console.error("Kategori verileri çekme hatası:", error);
    }
  };

  const fetchBrandsData = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/urunMarka/get-all`,
      );
      setBrandsData(response.data);
    } catch (error) {
      console.error("Marka verileri çekme hatası:", error);
    }
  };

  const fetchWarehousesData = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/depo/get-all`,
      );
      setWarehousesData(response.data);
    } catch (error) {
      console.error("Depo verileri çekme hatası:", error);
    }
  };

  const fetchProductsData = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/urun/urun-get-all`,
      );
      setProductsData(response.data);
    } catch (error) {
      console.error("Ürün verileri çekme hatası:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Verileri belge numarasına göre gruplama fonksiyonu
  const groupDataByDocument = (data) => {
    const grouped = {};

    data.forEach((item) => {
      const belgeNo = item.belgeNo || "BELİRTİLMEMİŞ";
      const key = `${belgeNo}_${item.tedarikciId}_${item.depoId}`;

      if (!grouped[key]) {
        grouped[key] = {
          belgeNo: belgeNo,
          tarih: item.tarih,
          tedarikci: item.tedarikci,
          depo: item.depo,
          paraBirimi: item.paraBirimi,
          toplamMiktar: 0,
          toplamTutar: 0,
          itemCount: 0,
        };
      }

      grouped[key].toplamMiktar += parseFloat(item.miktar || 0);
      grouped[key].toplamTutar += parseFloat(item.toplam || 0);
      grouped[key].itemCount += 1;
    });

    return Object.values(grouped);
  };

  const generatePDFReport = () => {
    setIsGeneratingReport(true);

    // Yatay (landscape) PDF oluştur
    const doc = new jsPDF("landscape");

    // Türkçe font ayarları
    registerTurkishFont(doc);

    // Başlık - Türkçe karakterler için dönüştürme
    doc.setFontSize(18);
    const title = convertTurkishChars("Alışlar Raporu (Belge Bazlı)");
    doc.text(title, doc.internal.pageSize.width / 2, 15, { align: "center" });

    // Tarih bilgisi
    const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
    doc.setFontSize(10);
    doc.text(
      convertTurkishChars(`Oluşturulma Tarihi: ${currentDateTime}`),
      doc.internal.pageSize.width / 2,
      25,
      { align: "center" },
    );

    // Filtre bilgileri
    doc.setFontSize(12);
    let filterInfo = `Tarih Aralığı: ${formData.dateRangeStart.format("DD/MM/YYYY")} - ${formData.dateRangeEnd.format("DD/MM/YYYY")}`;

    // Seçilen filtreleri ekle
    if (formData.supplier) {
      const selectedSupplier = suppliersData.find(
        (s) => s.id.toString() === formData.supplier,
      );
      filterInfo += ` | Tedarikçi: ${selectedSupplier ? convertTurkishChars(selectedSupplier.unvan) : formData.supplier}`;
    }

    if (formData.productService) {
      const selectedProduct = productsData.find(
        (p) => p.id.toString() === formData.productService,
      );
      filterInfo += ` | Ürün: ${selectedProduct ? convertTurkishChars(selectedProduct.adi) : formData.productService}`;
    }

    if (formData.category) {
      const selectedCategory = categoriesData.find(
        (c) => c.id.toString() === formData.category,
      );
      filterInfo += ` | Kategori: ${selectedCategory ? convertTurkishChars(selectedCategory.adi) : formData.category}`;
    }

    if (formData.brand) {
      const selectedBrand = brandsData.find(
        (b) => b.id.toString() === formData.brand,
      );
      filterInfo += ` | Marka: ${selectedBrand ? convertTurkishChars(selectedBrand.adi) : formData.brand}`;
    }

    if (formData.warehouse) {
      const selectedWarehouse = warehousesData.find(
        (w) => w.id.toString() === formData.warehouse,
      );
      filterInfo += ` | Depo: ${selectedWarehouse ? convertTurkishChars(selectedWarehouse.adi) : formData.warehouse}`;
    }

    doc.text(convertTurkishChars(filterInfo), 14, 35);

    // API'den gelen verileri filtrele
    const filteredData = purchasesData.filter((item) => {
      const purchaseDate = dayjs(item.tarih);

      // Tarih filtresi
      const isDateInRange =
        purchaseDate.isAfter(formData.dateRangeStart.subtract(1, "day")) &&
        purchaseDate.isBefore(formData.dateRangeEnd.add(1, "day"));

      if (!isDateInRange) return false;

      // Tedarikçi filtresi
      if (
        formData.supplier &&
        item.tedarikciId !== parseInt(formData.supplier)
      ) {
        return false;
      }

      // Ürün filtresi
      if (
        formData.productService &&
        item.urunId !== parseInt(formData.productService)
      ) {
        return false;
      }

      // Kategori filtresi (ürünün kategori ID'si ile karşılaştırma)
      if (
        formData.category &&
        item.urun &&
        item.urun.urunKategoriId !== parseInt(formData.category)
      ) {
        return false;
      }

      // Marka filtresi (ürünün marka ID'si ile karşılaştırma)
      if (
        formData.brand &&
        item.urun &&
        item.urun.urunMarkaId !== parseInt(formData.brand)
      ) {
        return false;
      }

      // Depo filtresi
      if (formData.warehouse && item.depoId !== parseInt(formData.warehouse)) {
        return false;
      }

      return true;
    });

    // Verileri belge numarasına göre grupla
    const groupedData = groupDataByDocument(filteredData);

    const formattedData = groupedData.map((group) => [
      convertTurkishChars(group.belgeNo),
      dayjs(group.tarih).format("DD/MM/YYYY"),
      convertTurkishChars(group.tedarikci?.unvan || "-"),
      convertTurkishChars(group.depo?.adi || "-"),
      group.itemCount, // Kalem sayısı
      group.toplamMiktar.toFixed(2),
      `${group.toplamTutar.toFixed(2)} ${group.paraBirimi || "TRY"}`,
    ]);

    // Para birimlerine göre toplamları hesapla
    const currencyTotals = {};
    groupedData.forEach((group) => {
      const currency = group.paraBirimi || "TRY";
      if (!currencyTotals[currency]) {
        currencyTotals[currency] = 0;
      }
      currencyTotals[currency] += group.toplamTutar;
    });

    // Tabloyu daha üstte başlat
    doc.autoTable({
      startY: 45,
      head: [
        [
          convertTurkishChars("Belge No"),
          convertTurkishChars("Tarih"),
          convertTurkishChars("Tedarikçi"),
          convertTurkishChars("Depo"),
          convertTurkishChars("Ürün Sayısı"),
          convertTurkishChars("Toplam Miktar"),
          convertTurkishChars("Toplam Tutar"),
        ],
      ],
      body: formattedData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 101, 168],
        fontStyle: "bold",
        textColor: [255, 255, 255],
      },
      styles: {
        font: "times",
        fontStyle: "normal",
        cellPadding: 3,
        fontSize: 9,
        overflow: "linebreak",
      },
      margin: { top: 45 },
    });

    // Özet başlığı
    doc.setFontSize(14);
    doc.text(
      convertTurkishChars("Özet"),
      14,
      doc.autoTable.previous.finalY + 15,
    );

    // Genel özet verileri
    const totalDocuments = groupedData.length;
    const totalItems = groupedData.reduce(
      (sum, group) => sum + group.itemCount,
      0,
    );
    const totalQuantity = groupedData.reduce(
      (sum, group) => sum + group.toplamMiktar,
      0,
    );

    const summaryData = [
      [convertTurkishChars("Toplam Belge Sayısı"), `${totalDocuments} adet`],
      [convertTurkishChars("Toplam Ürün Kalem Sayısı"), `${totalItems} adet`],
      [convertTurkishChars("Toplam Miktar"), `${totalQuantity.toFixed(2)}`],
    ];

    // Para birimi bazlı toplamlar
    const currencySummaryData = Object.entries(currencyTotals).map(
      ([currency, total]) => [
        convertTurkishChars(`${currency} Toplam`),
        `${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} ${currency}`,
      ],
    );

    // Özet tablosu - Genel bilgiler
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      body: summaryData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 101, 168],
        fontStyle: "bold",
        textColor: [255, 255, 255],
      },
      styles: {
        font: "times",
        fontStyle: "normal",
        cellPadding: 3,
        fontSize: 10,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "bold" },
        1: { cellWidth: 50 },
      },
    });

    // Para birimi bazlı toplamlar tablosu
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 10,
      head: [
        [convertTurkishChars("Para Birimi"), convertTurkishChars("Toplam")],
      ],
      body: currencySummaryData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 101, 168],
        fontStyle: "bold",
        textColor: [255, 255, 255],
      },
      styles: {
        font: "times",
        fontStyle: "normal",
        cellPadding: 3,
        fontSize: 10,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 50 },
      },
    });

    // PDF'i yeni sekmede aç
    const pdfOutput = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, "_blank");

    setIsGeneratingReport(false);
  };

  const handleGenerateReport = () => {
    // Rapor oluştur butonuna tıklandığında raporu oluştur
    generatePDFReport();
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Alışlar (Belge Bazlı Gruplama)
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md={6}>
            <CFormLabel>Arama</CFormLabel>
            <CFormSelect
              name="searchType"
              value={formData.searchType}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              <option value="document">Belge Tarihine Göre</option>
            </CFormSelect>
          </CCol>
          <CCol md={6} className="d-flex gap-5 align-items-center">
            <DatePickerField
              label="Başlangıç Tarihi"
              value={formData.dateRangeStart}
              onChange={(value) => handleDateChange("dateRangeStart", value)}
            />
            <DatePickerField
              label="Bitiş Tarihi"
              value={formData.dateRangeEnd}
              onChange={(value) => handleDateChange("dateRangeEnd", value)}
            />
          </CCol>
          <CCol md={6}>
            <CFormLabel>Tedarikçi</CFormLabel>
            <CFormSelect
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              {suppliersData.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {convertTurkishChars(supplier.unvan)}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormLabel>Ürün/Hizmet</CFormLabel>
            <CFormSelect
              name="productService"
              value={formData.productService}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              {productsData.map((product) => (
                <option key={product.id} value={product.id}>
                  {convertTurkishChars(product.adi)}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormLabel>Kategori</CFormLabel>
            <CFormSelect
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              {categoriesData.map((category) => (
                <option key={category.id} value={category.id}>
                  {convertTurkishChars(category.adi)}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormLabel>Marka</CFormLabel>
            <CFormSelect
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              {brandsData.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {convertTurkishChars(brand.adi)}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={6}>
            <CFormLabel>Depo</CFormLabel>
            <CFormSelect
              name="warehouse"
              value={formData.warehouse}
              onChange={handleChange}
              className="mb-3"
            >
              <option value="">Seçiniz</option>
              {warehousesData.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {convertTurkishChars(warehouse.adi)}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={12} className="mt-3">
            <CButton
              color="primary"
              disabled={isLoading || isGeneratingReport}
              onClick={handleGenerateReport}
            >
              {isGeneratingReport
                ? "Rapor Hazırlanıyor..."
                : "Gruplu Rapor Hazırla"}
            </CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  );
};

export default PurchasesReport;
