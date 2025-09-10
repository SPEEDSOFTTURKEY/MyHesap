import { useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
  CButton,
} from "@coreui/react";
import ReportForm from "./ReportForm";
import DatePickerField from "./DatePickerField";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Türkçe karakter haritası
const turkishCharMap = {
  'Ç': 'C', 'ç': 'c',
  'Ğ': 'G', 'ğ': 'g',
  'İ': 'I', 'ı': 'i',
  'Ö': 'O', 'ö': 'o',
  'Ş': 'S', 'ş': 's',
  'Ü': 'U', 'ü': 'u'
};

// Türkçe karakterleri dönüştürme fonksiyonu
const convertTurkishChars = (text) => {
  if (!text) return text;
  return text.replace(/[ÇçĞğİıÖöŞşÜü]/g, (char) => turkishCharMap[char] || char);
};

const registerTurkishFont = (doc) => {
  try {
    // Times fontu Türkçe karakterleri daha iyi destekler
    doc.setFont("times", "normal");
    console.log("Times fontu kullanılıyor (Türkçe karakter desteği ile)");
  } catch (error) {
    console.error("Font ayarlama hatası:", error);
    // Fallback olarak helvetica kullan
    doc.setFont("helvetica", "normal");
  }
};

const OffersReport = () => {
  const [formData, setFormData] = useState({
    searchType: "",
    dateRangeStart: dayjs(),
    dateRangeEnd: dayjs(),
    documentStatus: [],
    reportType: "",
    documentType: "",
    columns: [],
    documentNumber: "",
    class1: "",
    class2: "",
    customerType: "",
    customer: "",
    productService: "",
    category: "",
    brand: "",
    warehouse: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item) => item !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();

    // Türkçe font ayarları
    registerTurkishFont(doc);

    // Başlık - Türkçe karaktersiz
    doc.setFontSize(18);
    doc.text("Teklifler Raporu", 105, 15, { align: "center" });

    // Tarih bilgisi
    const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
    doc.setFontSize(10);
    doc.text(`Olusturulma Tarihi: ${currentDateTime}`, 105, 25, { align: "center" });

    // Kriterler başlığı
    doc.setFontSize(14);
    doc.text("Rapor Kriterleri", 14, 35);

    // Belge durumu metinleri
    const getDocumentStatusText = () => {
      if (formData.documentStatus.length === 0) return "Secilmedi";
      const statusMap = {
        all: "Hepsini Sec",
        openOffers: "Acik Teklifler",
        closedOffers: "Kapanmis Teklifler",
        acceptedOffers: "Kabul Edilen Teklifler"
      };
      return formData.documentStatus.map(status => statusMap[status] || status).join(", ");
    };

    const getSearchTypeText = () => {
      const searchMap = {
        document: "Belge Tarihine Gore",
        offer: "Teklif Tarihine Gore"
      };
      return searchMap[formData.searchType] || "Seciniz";
    };

    const getDocumentTypeText = () => {
      const docTypeMap = {
        offer: "Teklif",
        proforma: "Proforma"
      };
      return docTypeMap[formData.documentType] || "Seciniz";
    };

    const getCustomerTypeText = () => {
      const custTypeMap = {
        individual: "Bireysel",
        corporate: "Kurumsal"
      };
      return custTypeMap[formData.customerType] || "Seciniz";
    };

    // Verileri hazırla - Türkçe karaktersiz
    const criteriaData = [
      ["Arama Tipi", getSearchTypeText()],
      ["Baslangic Tarihi", formData.dateRangeStart.format("DD/MM/YYYY")],
      ["Bitis Tarihi", formData.dateRangeEnd.format("DD/MM/YYYY")],
      ["Belge Durumu", getDocumentStatusText()],
      ["Rapor Turu", formData.reportType || "Belirtilmedi"],
      ["Belge Tipi", getDocumentTypeText()],
      ["Belge Numarasi", formData.documentNumber || "Belirtilmedi"],
      ["Sinif 1", formData.class1 || "Belirtilmedi"],
      ["Sinif 2", formData.class2 || "Belirtilmedi"],
      ["Musteri Tipi", getCustomerTypeText()],
      ["Musteri", formData.customer || "Belirtilmedi"],
      ["Urun/Hizmet", formData.productService || "Belirtilmedi"],
      ["Kategori", formData.category || "Belirtilmedi"],
      ["Marka", formData.brand || "Belirtilmedi"],
      ["Depo", formData.warehouse || "Seciniz"],
    ];

    // Kriterler tablosu
    doc.autoTable({
      startY: 40,
      head: [["Kriter", "Deger"]],
      body: criteriaData,
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
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 100 },
      },
    });

    // Örnek teklif verileri - Türkçe karaktersiz
    const sampleData = [
      { id: 1, offerNo: "TKF-2023-001", date: "01/01/2023", customer: "Musteri A Sisli", amount: "15.250,00 TL", status: "Acik" },
      { id: 2, offerNo: "TKF-2023-002", date: "02/01/2023", customer: "Musteri B Cankaya", amount: "28.450,50 TL", status: "Kabul" },
      { id: 3, offerNo: "TKF-2023-003", date: "03/01/2023", customer: "Musteri C Uskudar", amount: "33.750,75 TL", status: "Kapali" },
      { id: 4, offerNo: "TKF-2023-004", date: "04/01/2023", customer: "Musteri D Kadikoy", amount: "42.850,25 TL", status: "Acik" },
      { id: 5, offerNo: "TKF-2023-005", date: "05/01/2023", customer: "Musteri E Besiktas", amount: "55.950,00 TL", status: "Kabul" },
    ];

    // Teklif verileri başlığı
    doc.setFontSize(14);
    doc.text("Teklif Verileri", 14, doc.autoTable.previous.finalY + 15);

    // Teklif verileri tablosu
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [["ID", "Teklif No", "Tarih", "Musteri", "Tutar", "Durum"]],
      body: sampleData.map(item => [item.id, item.offerNo, item.date, item.customer, item.amount, item.status]),
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
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 25 },
      },
    });

    // Özet başlığı
    doc.setFontSize(14);
    doc.text("Ozet", 14, doc.autoTable.previous.finalY + 15);

    // Özet verileri
    const totalAmount = sampleData.reduce((sum, item) => {
      const amount = parseFloat(item.amount.replace(/\./g, '').replace(',', '.').replace(' TL', ''));
      return sum + amount;
    }, 0);

    const averageAmount = totalAmount / sampleData.length;
    const offerCount = sampleData.length;
    const acceptedCount = sampleData.filter(item => item.status === "Kabul").length;
    const openCount = sampleData.filter(item => item.status === "Acik").length;

    const formatCurrency = (value) => {
      return value.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TL';
    };

    const summaryData = [
      ["Toplam Teklif Tutari", formatCurrency(totalAmount)],
      ["Ortalama Teklif Tutari", formatCurrency(averageAmount)],
      ["Toplam Teklif Sayisi", `${offerCount} adet`],
      ["Kabul Edilen Teklifler", `${acceptedCount} adet`],
      ["Acik Teklifler", `${openCount} adet`],
      ["Rapor Donemi", `${formData.dateRangeStart.format("DD/MM/YYYY")} - ${formData.dateRangeEnd.format("DD/MM/YYYY")}`],
    ];

    // Özet tablosu
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      body: summaryData,
      theme: "grid",
      styles: {
        font: "times",
        fontStyle: "normal",
        cellPadding: 3,
        fontSize: 10,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "bold" },
        1: { cellWidth: 50, halign: 'right' },
      },
    });

    // PDF'i yeni sekmede aç
    const pdfOutput = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, "_blank");
  };

  const handleSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    generatePDFReport();
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Teklifler
      </CCardHeader>
      <CCardBody>
        <ReportForm onSubmit={handleSubmit}>
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
                <option value="offer">Teklif Tarihine Göre</option>
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
              <CFormLabel>Belge Durumu</CFormLabel>
              <div className="mb-3">
                <CFormCheck
                  label="Hepsini Seç"
                  name="documentStatus"
                  value="all"
                  checked={formData.documentStatus.includes("all")}
                  onChange={handleChange}
                />
                <CFormCheck
                  label="Açık Teklifler"
                  name="documentStatus"
                  value="openOffers"
                  checked={formData.documentStatus.includes("openOffers")}
                  onChange={handleChange}
                />
                <CFormCheck
                  label="Kapanmış Teklifler"
                  name="documentStatus"
                  value="closedOffers"
                  checked={formData.documentStatus.includes("closedOffers")}
                  onChange={handleChange}
                />
                <CFormCheck
                  label="Kabul Edilen Teklifler"
                  name="documentStatus"
                  value="acceptedOffers"
                  checked={formData.documentStatus.includes("acceptedOffers")}
                  onChange={handleChange}
                />
              </div>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Rapor Türü</CFormLabel>
              <CFormInput
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                className="mb-3"
                placeholder="Örn: Detaylı, Özet"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Belge Tipi</CFormLabel>
              <CFormSelect
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">Seçiniz</option>
                <option value="offer">Teklif</option>
                <option value="proforma">Proforma</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Kolonlar</CFormLabel>
              <CFormInput
                name="columns"
                value={formData.columns}
                onChange={handleChange}
                className="mb-3"
                placeholder="Görüntülenecek kolonları belirtin"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Belge Numarası</CFormLabel>
              <CFormInput
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="mb-3"
                placeholder="Örn: TKF-2023-001"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Sınıf 1</CFormLabel>
              <CFormInput
                name="class1"
                value={formData.class1}
                onChange={handleChange}
                className="mb-3"
                placeholder="Örn: Bölge, Sektör"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Sınıf 2</CFormLabel>
              <CFormInput
                name="class2"
                value={formData.class2}
                onChange={handleChange}
                className="mb-3"
                placeholder="Örn: Özel Kod, Grup"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Müşteri Tipi</CFormLabel>
              <CFormSelect
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">Seçiniz</option>
                <option value="individual">Bireysel</option>
                <option value="corporate">Kurumsal</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Müşteri</CFormLabel>
              <CFormInput
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="mb-3"
                placeholder="Müşteri adını giriniz"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Ürün / Hizmet</CFormLabel>
              <CFormInput
                name="productService"
                value={formData.productService}
                onChange={handleChange}
                className="mb-3"
                placeholder="Ürün veya hizmet adı"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Kategori</CFormLabel>
              <CFormInput
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mb-3"
                placeholder="Kategori adını giriniz"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Marka</CFormLabel>
              <CFormInput
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mb-3"
                placeholder="Marka adını giriniz"
              />
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
                <option value="warehouse1">Ana Depo</option>
                <option value="warehouse2">Yedek Depo</option>
                <option value="warehouse3">Şube Depo</option>
              </CFormSelect>
            </CCol>

          </CRow>
        </ReportForm>
      </CCardBody>
    </CCard>
  );
};

export default OffersReport;