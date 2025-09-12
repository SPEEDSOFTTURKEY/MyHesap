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
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CForm,
} from "@coreui/react";
import DatePickerField from "./DatePickerField";
import dayjs from "dayjs";
import * as XLSX from "xlsx"; // Excel export
import axios from "axios";
import jsPDF from "jspdf"; // PDF generation
import "jspdf-autotable"; // For table support in PDF

// API base URL
const API_BASE_URL = "https://speedsofttest.com/api";

const CustomerTurnoversReport = () => {
  const [formData, setFormData] = useState({
    dateRangeStart: dayjs().subtract(30, "day"),
    dateRangeEnd: dayjs(),
    documentStatus: "",
    customer: "",
  });
  const [customers, setCustomers] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [averageAmount, setAverageAmount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  // Fetch customers and sales data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all active customers
        const customersResponse = await axios.get(`${API_BASE_URL}/musteri/musteri-get-allaktif`);
        setCustomers(customersResponse.data);

        // Fetch sales data with initial filters
        await fetchSalesData();
        setError(null);
      } catch (err) {
        console.error("API hatası:", err);
        setError("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to fetch sales data based on filters
  const fetchSalesData = async () => {
    try {
      const params = {
        startDate: formData.dateRangeStart.format("YYYY-MM-DD"),
        endDate: formData.dateRangeEnd.format("YYYY-MM-DD"),
        documentStatus: formData.documentStatus || undefined,
        customerId: formData.customer || undefined,
      };

      const response = await axios.get(`${API_BASE_URL}/musteriSatis/musteriSatis-get-filtered`, { params });
      setSalesData(response.data);

      // Statistical calculations
      const total = response.data.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0);
      const avg = response.data.length ? total / response.data.length : 0;
      const count = response.data.length;

      setTotalAmount(total);
      setAverageAmount(avg);
      setDocumentCount(count);
    } catch (err) {
      console.error("Satış verileri yüklenemedi:", err);
      setError("Satış verileri yüklenemedi.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateExcelReport = () => {
    // Ensure salesData is populated before generating Excel
    if (!salesData.length) {
      setError("Excel oluşturmak için veri yok.");
      return;
    }

    const wsData = [
      [
        "Tarih",
        "Müşteri",
        "Telefon",
        "Adres",
        "Ürün Adı",
        "Birim",
        "Miktar",
        "Fiyat",
        "Toplam Tutar",
      ],
      ...salesData.map((item) => [
        item.eklenmeTarihi ? new Date(item.eklenmeTarihi).toLocaleDateString("tr-TR") : "-",
        item.musteri?.unvani || "-",
        item.musteri?.telefon || "-",
        item.musteri?.adres || "-",
        item.urunAdi || "-",
        item.birim || "-",
        item.miktar || 0,
        item.fiyat ? `${item.fiyat.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL` : "-",
        item.toplamFiyat
          ? `${item.toplamFiyat.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`
          : "-",
      ]),
      [], // Empty row
      ["Özet"],
      ["Toplam Satış", `${totalAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`],
      ["Ortalama Satış", `${averageAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`],
      ["Belge Sayısı", documentCount],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Müşteri Ciroları");

    // Generate and download Excel file
    XLSX.writeFile(wb, `MusteriCirolariRaporu_${formData.customer ? customers.find(c => c.id === formData.customer)?.unvani || 'Tumu' : 'Tumu'}.xlsx`);
  };

  const generatePDFReport = () => {
    // Ensure salesData is populated before generating PDF
    if (!salesData.length) {
      setError("PDF oluşturmak için veri yok.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    
    // Get customer name for title
    const customerName = formData.customer 
      ? customers.find(c => c.id === formData.customer)?.unvani 
      : "Tüm Müşteriler";
    doc.text(`Müşteri Ciroları Raporu `, 14, 20);

    // Define table columns and data
    const tableColumn = [
      "Tarih",
      "Müşteri",
      "Telefon",
      "Adres",
      "Ürün Adı",
      "Birim",
      "Miktar",
      "Fiyat",
      "Toplam Tutar",
    ];
    const tableRows = salesData.map((item) => [
      item.eklenmeTarihi ? new Date(item.eklenmeTarihi).toLocaleDateString("tr-TR") : "-",
      item.musteri?.unvani || "-",
      item.musteri?.telefon || "-",
      item.musteri?.adres || "-",
      item.urunAdi || "-",
      item.birim || "-",
      item.miktar || 0,
      item.fiyat ? `${item.fiyat.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL` : "-",
      item.toplamFiyat
        ? `${item.toplamFiyat.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`
        : "-",
    ]);

    // Add table to PDF
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: "grid",
      headStyles: { fillColor: [41, 101, 168], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    // Add summary statistics
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Özet İstatistikler", 14, finalY);
    doc.text(
      `Toplam Satış: ${totalAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`,
      14,
      finalY + 10
    );
    doc.text(
      `Ortalama Satış: ${averageAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`,
      14,
      finalY + 20
    );
    doc.text(
      `Belge Sayısı: ${documentCount}`,
      14,
      finalY + 30
    );

    // Open PDF in a new tab
    const pdfOutput = doc.output("blob");
    const url = URL.createObjectURL(pdfOutput);
    window.open(url, "_blank");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    await fetchSalesData();
    setLoading(false);
  };

  const handleGenerateExcel = async () => {
    setLoading(true);
    await fetchSalesData();
    generateExcelReport();
    setLoading(false);
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    await fetchSalesData();
    generatePDFReport();
    setLoading(false);
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Müşteri Ciroları Raporu
      </CCardHeader>
      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow>
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
            <CCol md={3}>
              <CFormLabel>Müşteri</CFormLabel>
              <CFormSelect
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">Seçiniz</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.unvani}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
         <CRow className="mt-3">
  <CCol className="d-flex justify-content-start gap-3">
              <CButton color="primary" type="submit" disabled={loading}>
                Getir
              </CButton>
              <CButton color="success" onClick={handleGenerateExcel} disabled={loading}>
                Excel İndir
              </CButton>
              <CButton color="info" onClick={handleGeneratePDF} disabled={loading}>
                Raporla
              </CButton>
            </CCol>
          </CRow>
        </CForm>

        {/* Sales Data Table */}
        {loading ? (
          <p>Yükleniyor...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : salesData.length === 0 ? (
          <p>Seçilen kriterlere uygun satış verisi bulunamadı.</p>
        ) : (
          <>
            <h4 className="mt-4">
              {formData.customer 
                ? customers.find(c => c.id === formData.customer)?.unvani || "Seçili Müşteri"
                : "Tüm Müşteriler"}
            </h4>
            <CTable striped hover className="mt-2" style={{ fontSize: "14px" }}>
              <CTableHead style={{ backgroundColor: "#f8f9fa" }}>
                <CTableRow>
                  <CTableHeaderCell style={{ padding: "13px" }}>Tarih</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Müşteri</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Telefon</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Adres</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Ürün Adı</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Birim</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Miktar</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px" }}>Fiyat</CTableHeaderCell>
                  <CTableHeaderCell style={{ padding: "13px", textAlign: "right" }}>
                    Toplam Tutar
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {salesData.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell style={{ padding: "13px" }}>
                      {item.eklenmeTarihi
                        ? new Date(item.eklenmeTarihi).toLocaleDateString("tr-TR")
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>
                      {item.musteri?.unvani || "-"}
                    </CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>
                      {item.musteri?.telefon || "-"}
                    </CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>
                      {item.musteri?.adres || "-"}
                    </CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>{item.urunAdi || "-"}</CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>{item.birim || "-"}</CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>{item.miktar || 0}</CTableDataCell>
                    <CTableDataCell style={{ padding: "13px" }}>
                      {item.fiyat
                        ? `${item.fiyat.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell style={{ padding: "13px", textAlign: "right" }}>
                      {item.toplamFiyat
                        ? `${item.toplamFiyat
                            .toFixed(2)
                            .replace(".", ",")
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`
                        : "-"}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
            {/* Summary Statistics */}
            <div className="mt-4">
              <h5>Özet İstatistikler</h5>
              <p>
                Toplam Satış:{" "}
                {totalAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL
              </p>
              <p>
                Ortalama Satış:{" "}
                {averageAmount.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL
              </p>
              <p>Belge Sayısı: {documentCount}</p>
            </div>
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default CustomerTurnoversReport;