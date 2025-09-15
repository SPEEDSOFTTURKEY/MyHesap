import { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormInput,
  CRow,
  CCol,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';
import axios from "axios";

const API_BASE_URL = "https://localhost:44375/api";

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

// Türkçe font ayarları (PDF için)
const registerTurkishFont = (doc) => {
  try {
    doc.setFont("times", "normal");
    console.log("Times fontu kullanılıyor (Türkçe karakter desteği ile)");
  } catch (error) {
    console.error("Font ayarlama hatası:", error);
    doc.setFont("helvetica", "normal");
  }
};

const SixMonthSalesReport = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch sales data for the last 6 months
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/musteriSatis/musteriSatis-last-six-months`);
        
        // API yanıtının formatını kontrol et ve uygun şekilde işle
        let data = [];
        if (Array.isArray(response.data)) {
          data = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          data = response.data.data;
        } else if (response.data && response.data.items) {
          data = response.data.items;
        } else {
          console.warn("Beklenmeyen API yanıt formatı:", response.data);
        }
        setSalesData(data);
        setFilteredData(data);
      } catch (error) {
        console.error("Satış verileri alınırken hata oluştu:", error);
        setError("Veriler yüklenirken hata oluştu.");
        setSalesData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === "") {
      setFilteredData(salesData);
    } else {
      const filtered = salesData.filter((item) => {
        return Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") {
            return Object.values(val).some((subVal) =>
              subVal && subVal.toString().toLowerCase().includes(term)
            );
          }
          return val.toString().toLowerCase().includes(term);
        });
      });
      setFilteredData(filtered);
    }
  };

  // Prepare data for the chart - HATA KONTROLLÜ
  const monthlySales = Array(6).fill(0).map((_, index) => {
    const month = dayjs().subtract(5 - index, "month");
    
    // salesData'nın dizi olduğundan emin ol
    let monthSales = 0;
    if (Array.isArray(salesData)) {
      monthSales = salesData
        .filter(item => item && dayjs(item.eklenmeTarihi).isSame(month, "month"))
        .reduce((sum, item) => sum + (item.toplamFiyat || 0), 0);
    }
    
    return {
      month: month.format("MMM YYYY"),
      total: monthSales,
    };
  });

  // Chart.js veri yapısı
  const chartData = {
    labels: monthlySales.map(item => item.month),
    datasets: [
      {
        label: convertTurkishChars('Toplam Satış (₺)'),
        data: monthlySales.map(item => item.total),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: convertTurkishChars('Son 6 Ayın Aylık Satışları'),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: convertTurkishChars('Toplam Satış (₺)')
        }
      },
      x: {
        title: {
          display: true,
          text: convertTurkishChars('Ay')
        }
      }
    },
  };

  const generatePDFReport = () => {
    const doc = new jsPDF({ orientation: "landscape" }); // Yatay format
    registerTurkishFont(doc);

    doc.setFontSize(18);
    const title = convertTurkishChars("6 Aylık Satış Raporu");
    doc.text(title, 148.5, 15, { align: "center" }); // Ortalamak için 297mm/2

    const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
    doc.setFontSize(10);
    doc.text(convertTurkishChars(`Oluşturulma Tarihi: ${currentDateTime}`), 148.5, 25, { align: "center" });

    doc.setFontSize(14);
    doc.text(convertTurkishChars("Satış Verileri"), 14, 35);

    // salesData'nın dizi olduğundan emin ol
    const tableData = Array.isArray(salesData) ? salesData.map(item => [
      item.id || "N/A",
      item.satisId || "N/A",
      item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A",
      convertTurkishChars(item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri"),
      item.toplamFiyat ? `${item.toplamFiyat.toFixed(2).replace('.', ',')} ₺` : "0,00 ₺"
    ]) : [];

    doc.autoTable({
      startY: 40,
      head: [[
        convertTurkishChars("ID"),
        convertTurkishChars("Satış ID"),
        convertTurkishChars("Tarih"),
        convertTurkishChars("Müşteri"),
        convertTurkishChars("Tutar")
      ]],
      body: tableData,
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
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 100 },
        4: { cellWidth: 50 },
      },
    });

    const totalAmount = Array.isArray(salesData) ? salesData.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0) : 0;
    const averageAmount = Array.isArray(salesData) && salesData.length ? totalAmount / salesData.length : 0;
    const documentCount = Array.isArray(salesData) ? salesData.length : 0;

    const formatCurrency = (value) => {
      return value.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
    };

    const summaryData = [
      [convertTurkishChars("Toplam Satış"), formatCurrency(totalAmount)],
      [convertTurkishChars("Ortalama Satış"), formatCurrency(averageAmount)],
      [convertTurkishChars("Belge Sayısı"), `${documentCount} adet`],
    ];

    doc.setFontSize(14);
    doc.text(convertTurkishChars("Özet"), 14, doc.autoTable.previous.finalY + 15);

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
        0: { cellWidth: 70, fontStyle: "bold" },
        1: { cellWidth: 70 },
      },
    });

    const pdfOutput = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfOutput);
    window.open(pdfUrl, "_blank");
  };

  const generateExcelReport = () => {
    // Excel için veri hazırlama
    const tableData = Array.isArray(salesData) ? salesData.map(item => ({
      ID: item.id || "N/A",
      "Satış ID": item.satisId || "N/A",
      Tarih: item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A",
      Müşteri: convertTurkishChars(item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri"),
      Tutar: item.toplamFiyat ? `${item.toplamFiyat.toFixed(2).replace('.', ',')} ₺` : "0,00 ₺"
    })) : [];

    const totalAmount = Array.isArray(salesData) ? salesData.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0) : 0;
    const averageAmount = Array.isArray(salesData) && salesData.length ? totalAmount / salesData.length : 0;
    const documentCount = Array.isArray(salesData) ? salesData.length : 0;

    const formatCurrency = (value) => {
      return value.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
    };

    const summaryData = [
      { Kriter: "Toplam Satış", Değer: formatCurrency(totalAmount) },
      { Kriter: "Ortalama Satış", Değer: formatCurrency(averageAmount) },
      { Kriter: "Belge Sayısı", Değer: `${documentCount} adet` },
    ];

    // Excel çalışma kitabı oluştur
    const wb = XLSX.utils.book_new();

    // Satış verileri için çalışma sayfası
    const wsData = XLSX.utils.json_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, wsData, "Satış Verileri");

    // Özet için çalışma sayfası
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Özet");

    // Excel dosyasını oluştur ve indir
    const fileName = `6_Aylik_Satis_Raporu_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        {convertTurkishChars("6 Aylık Satış Raporu")}
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol md={6}>
            <CFormInput
              placeholder={convertTurkishChars("Tabloda Ara...")}
              value={searchTerm}
              onChange={handleSearch}
            />
          </CCol>
          <CCol md={6} className="text-end">
            <CButton color="primary" onClick={generatePDFReport} className="me-2">
              {convertTurkishChars("PDF Oluştur")}
            </CButton>
            <CButton color="success" onClick={generateExcelReport}>
              {convertTurkishChars("Excel Oluştur")}
            </CButton>
          </CCol>
        </CRow>

        {/* Sales Data Table */}
        <h4 className="mt-4">{convertTurkishChars("Son 6 Ayın Satış Verileri")}</h4>
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        {loading ? (
          <p>{convertTurkishChars("Yükleniyor...")}</p>
        ) : (
          <>
            {Array.isArray(filteredData) && filteredData.length > 0 ? (
              <CTable striped hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>{convertTurkishChars("ID")}</CTableHeaderCell>
                    <CTableHeaderCell>{convertTurkishChars("Satış ID")}</CTableHeaderCell>
                    <CTableHeaderCell>{convertTurkishChars("Tarih")}</CTableHeaderCell>
                    <CTableHeaderCell>{convertTurkishChars("Müşteri")}</CTableHeaderCell>
                    <CTableHeaderCell>{convertTurkishChars("Tutar")}</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredData.map((item) => (
                    <CTableRow key={item.id || Math.random()}>
                      <CTableDataCell>{item.id || "N/A"}</CTableDataCell>
                      <CTableDataCell>{item.satisId || "N/A"}</CTableDataCell>
                      <CTableDataCell>{item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A"}</CTableDataCell>
                      <CTableDataCell>{convertTurkishChars(item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri")}</CTableDataCell>
                      <CTableDataCell>{item.toplamFiyat ? `${item.toplamFiyat.toFixed(2).replace('.', ',')} ₺` : "0,00 ₺"}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            ) : (
              <p>{convertTurkishChars("Satış verisi bulunamadı.")}</p>
            )}
          </>
        )}

        {/* Monthly Sales Chart */}
        <h4 className="mt-4">{convertTurkishChars("Aylık Satış İstatistikleri")}</h4>
        <div style={{ height: '400px', marginBottom: '20px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CCardBody>
    </CCard>
  );
};

export default SixMonthSalesReport;