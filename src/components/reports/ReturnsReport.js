import { useState } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormLabel,
  CFormSelect,
  CFormInput,
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

// Türkçe font ayarları
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

const ReturnsReport = () => {
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

    // Başlık - Türkçe karakterler için dönüştürme
    doc.setFontSize(18);
    const title = convertTurkishChars("İadeler Raporu");
    doc.text(title, 105, 15, { align: "center" });

    // Tarih bilgisi
    const currentDateTime = dayjs().hour(15).minute(27).format("DD/MM/YYYY HH:mm:ss");
    doc.setFontSize(10);
    doc.text(convertTurkishChars(`Oluşturulma Tarihi: ${currentDateTime}`), 105, 25, { align: "center" });

    // Kriterler başlığı
    doc.setFontSize(14);
    doc.text(convertTurkishChars("Rapor Kriterleri"), 14, 35);

    // Verileri hazırla - Türkçe karakterler için dönüştürme
    const criteriaData = [
      [convertTurkishChars("Arama"), convertTurkishChars(formData.searchType || "Seçiniz")],
      [convertTurkishChars("Başlangıç Tarihi"), formData.dateRangeStart.format("DD/MM/YYYY")],
      [convertTurkishChars("Bitiş Tarihi"), formData.dateRangeEnd.format("DD/MM/YYYY")],
      [convertTurkishChars("Belge Durumu"), formData.documentStatus.length ? convertTurkishChars(formData.documentStatus.join(", ")) : convertTurkishChars("Hepsini Seç")],
      [convertTurkishChars("Rapor Türü"), convertTurkishChars(formData.reportType || "Belirtilmedi")],
      [convertTurkishChars("Belge Tipi"), convertTurkishChars(formData.documentType || "Seçiniz")],
      [convertTurkishChars("Kolonlar"), formData.columns.length ? convertTurkishChars(formData.columns.join(", ")) : convertTurkishChars("Belirtilmedi")],
      [convertTurkishChars("Belge Numarası"), convertTurkishChars(formData.documentNumber || "Belirtilmedi")],
      [convertTurkishChars("Sınıf 1"), convertTurkishChars(formData.class1 || "Belirtilmedi")],
      [convertTurkishChars("Sınıf 2"), convertTurkishChars(formData.class2 || "Belirtilmedi")],
      [convertTurkishChars("Müşteri Tipi"), convertTurkishChars(formData.customerType || "Seçiniz")],
      [convertTurkishChars("Müşteri"), convertTurkishChars(formData.customer || "Belirtilmedi")],
      [convertTurkishChars("Ürün/Hizmet"), convertTurkishChars(formData.productService || "Belirtilmedi")],
      [convertTurkishChars("Kategori"), convertTurkishChars(formData.category || "Belirtilmedi")],
      [convertTurkishChars("Marka"), convertTurkishChars(formData.brand || "Belirtilmedi")],
      [convertTurkishChars("Depo"), convertTurkishChars(formData.warehouse || "Seçiniz")],
    ];

    // Kriterler tablosu
    doc.autoTable({
      startY: 40,
      head: [[convertTurkishChars("Kriter"), convertTurkishChars("Değer")]],
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

    // Örnek iade verileri (gerçek uygulamada API'den çekilecek)
    const sampleData = [
      { id: 1, documentNo: "IAD-2023-001", date: "01/01/2023", customer: convertTurkishChars("Müşteri A Şişli"), amount: "1.200,00 ₺" },
      { id: 2, documentNo: "IAD-2023-002", date: "02/01/2023", customer: convertTurkishChars("Müşteri B Çankaya"), amount: "2.300,50 ₺" },
      { id: 3, documentNo: "IAD-2023-003", date: "03/01/2023", customer: convertTurkishChars("Müşteri C Üsküdar"), amount: "500,75 ₺" },
    ];

    // İade verileri başlığı
    doc.setFontSize(14);
    doc.text(convertTurkishChars("İade Verileri"), 14, doc.autoTable.previous.finalY + 15);

    // İade verileri tablosu
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [[
        convertTurkishChars("ID"),
        convertTurkishChars("Belge No"),
        convertTurkishChars("Tarih"),
        convertTurkishChars("Müşteri"),
        convertTurkishChars("Tutar")
      ]],
      body: sampleData.map(item => [
        item.id,
        item.documentNo,
        item.date,
        item.customer,
        item.amount
      ]),
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
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 60 },
        4: { cellWidth: 30 },
      },
    });

    // Özet başlığı
    doc.setFontSize(14);
    doc.text(convertTurkishChars("Özet"), 14, doc.autoTable.previous.finalY + 15);

    // Özet verileri
    const totalAmount = sampleData.reduce((sum, item) => sum + parseFloat(item.amount.replace(/[.,\s₺]/g, '')), 0);
    const averageAmount = totalAmount / sampleData.length;
    const documentCount = sampleData.length;

    const summaryData = [
      [convertTurkishChars("Toplam İade"), `${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00 ₺`],
      [convertTurkishChars("Ortalama İade"), `${averageAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")},00 ₺`],
      [convertTurkishChars("Belge Sayısı"), `${documentCount} adet`],
    ];

    // Özet tablosu
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
        overflow: 'linebreak',
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
        İadeler
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
                <option value="return">İade Tarihine Göre</option>
              </CFormSelect>
            </CCol>
            <CCol md={6} className="d-flex gap-2 justify-content-center align-items-center">
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
                  onChange={handleChange}
                />
                <CFormCheck
                  label="İade Faturaları"
                  name="documentStatus"
                  value="returnInvoices"
                  onChange={handleChange}
                />
                <CFormCheck
                  label="Açık İadeler"
                  name="documentStatus"
                  value="openReturns"
                  onChange={handleChange}
                />
                <CFormCheck
                  label="Tamamlanmış İadeler"
                  name="documentStatus"
                  value="completedReturns"
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
                <option value="returnInvoice">İade Faturası</option>
                <option value="returnDelivery">İade İrsaliyesi</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>Kolonlar</CFormLabel>
              <CFormInput
                name="columns"
                value={formData.columns}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Belge Numarası</CFormLabel>
              <CFormInput
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Sınıf 1</CFormLabel>
              <CFormInput
                name="class1"
                value={formData.class1}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Sınıf 2</CFormLabel>
              <CFormInput
                name="class2"
                value={formData.class2}
                onChange={handleChange}
                className="mb-3"
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
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Ürün / Hizmet</CFormLabel>
              <CFormInput
                name="productService"
                value={formData.productService}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Kategori</CFormLabel>
              <CFormInput
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Marka</CFormLabel>
              <CFormInput
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mb-3"
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
                <option value="warehouse1">Depo 1</option>
                <option value="warehouse2">Depo 2</option>
              </CFormSelect>
            </CCol>

          </CRow>
        </ReportForm>
      </CCardBody>
    </CCard>
  );
};

export default ReturnsReport;