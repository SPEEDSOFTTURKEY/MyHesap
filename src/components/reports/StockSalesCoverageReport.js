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

const StockSalesCoverageReport = () => {
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
    const title = convertTurkishChars("Stok-Satış Karşılama Raporu");
    doc.text(title, 105, 15, { align: "center" });

    // Tarih bilgisi
    const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
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

    // Örnek stok-satış verileri (gerçek uygulamada API'den çekilecek)
    const sampleData = [
      { id: 1, product: convertTurkishChars("Ürün 1"), stock: 50, sales: 20, coverage: "2.5 ay" },
      { id: 2, product: convertTurkishChars("Ürün 2"), stock: 30, sales: 15, coverage: "2 ay" },
      { id: 3, product: convertTurkishChars("Ürün 3"), stock: 100, sales: 40, coverage: "2.5 ay" },
    ];

    // Stok-Satış verileri başlığı
    doc.setFontSize(14);
    doc.text(convertTurkishChars("Stok-Satış Verileri"), 14, doc.autoTable.previous.finalY + 15);

    // Stok-Satış verileri tablosu
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [[
        convertTurkishChars("ID"),
        convertTurkishChars("Ürün"),
        convertTurkishChars("Stok Miktarı"),
        convertTurkishChars("Satış Miktarı"),
        convertTurkishChars("Karşılama Süresi")
      ]],
      body: sampleData.map(item => [
        item.id,
        item.product,
        item.stock,
        item.sales,
        item.coverage
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
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 40 },
      },
    });

    // Özet başlığı
    doc.setFontSize(14);
    doc.text(convertTurkishChars("Özet"), 14, doc.autoTable.previous.finalY + 15);

    // Özet verileri
    const totalStock = sampleData.reduce((sum, item) => sum + item.stock, 0);
    const totalSales = sampleData.reduce((sum, item) => sum + item.sales, 0);
    const avgCoverage = sampleData.reduce((sum, item) => sum + parseFloat(item.coverage.split(" ")[0]), 0) / sampleData.length;

    const summaryData = [
      [convertTurkishChars("Toplam Stok Miktarı"), totalStock.toString()],
      [convertTurkishChars("Toplam Satış Miktarı"), totalSales.toString()],
      [convertTurkishChars("Ortalama Karşılama Süresi"), `${avgCoverage.toFixed(1)} ay`],
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
        {convertTurkishChars("Stok-Satış Karşılama")}
      </CCardHeader>
      <CCardBody>
        <ReportForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Arama")}</CFormLabel>
              <CFormSelect
                name="searchType"
                value={formData.searchType}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                <option value="document">{convertTurkishChars("Belge Tarihine Göre")}</option>
                <option value="stock">{convertTurkishChars("Stok Hareketine Göre")}</option>
              </CFormSelect>
            </CCol>
            <CCol md={6} className="d-flex gap-5 align-items-center">
              <DatePickerField
                label={convertTurkishChars("Başlangıç Tarihi")}
                value={formData.dateRangeStart}
                onChange={(value) => handleDateChange("dateRangeStart", value)}
              />
              <DatePickerField
                label={convertTurkishChars("Bitiş Tarihi")}
                value={formData.dateRangeEnd}
                onChange={(value) => handleDateChange("dateRangeEnd", value)}
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Belge Durumu")}</CFormLabel>
              <div className="mb-3">
                <CFormCheck
                  label={convertTurkishChars("Hepsini Seç")}
                  name="documentStatus"
                  value="all"
                  onChange={handleChange}
                />
                <CFormCheck
                  label={convertTurkishChars("Faturalar")}
                  name="documentStatus"
                  value="invoices"
                  onChange={handleChange}
                />
                <CFormCheck
                  label={convertTurkishChars("Açık İrsaliyeler")}
                  name="documentStatus"
                  value="openDeliveries"
                  onChange={handleChange}
                />
                <CFormCheck
                  label={convertTurkishChars("Faturalaşmış İrsaliyeler")}
                  name="documentStatus"
                  value="invoicedDeliveries"
                  onChange={handleChange}
                />
              </div>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Rapor Türü")}</CFormLabel>
              <CFormInput
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Belge Tipi")}</CFormLabel>
              <CFormSelect
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                <option value="invoice">{convertTurkishChars("Fatura")}</option>
                <option value="stock">{convertTurkishChars("Stok Belgesi")}</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Kolonlar")}</CFormLabel>
              <CFormInput
                name="columns"
                value={formData.columns}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Belge Numarası")}</CFormLabel>
              <CFormInput
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Sınıf 1")}</CFormLabel>
              <CFormInput
                name="class1"
                value={formData.class1}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Sınıf 2")}</CFormLabel>
              <CFormInput
                name="class2"
                value={formData.class2}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Müşteri Tipi")}</CFormLabel>
              <CFormSelect
                name="customerType"
                value={formData.customerType}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                <option value="individual">{convertTurkishChars("Bireysel")}</option>
                <option value="corporate">{convertTurkishChars("Kurumsal")}</option>
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Müşteri")}</CFormLabel>
              <CFormInput
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Ürün / Hizmet")}</CFormLabel>
              <CFormInput
                name="productService"
                value={formData.productService}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Kategori")}</CFormLabel>
              <CFormInput
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Marka")}</CFormLabel>
              <CFormInput
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Depo")}</CFormLabel>
              <CFormSelect
                name="warehouse"
                value={formData.warehouse}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                <option value="warehouse1">{convertTurkishChars("Depo 1")}</option>
                <option value="warehouse2">{convertTurkishChars("Depo 2")}</option>
              </CFormSelect>
            </CCol>

          </CRow>
        </ReportForm>
      </CCardBody>
    </CCard>
  );
};

export default StockSalesCoverageReport;