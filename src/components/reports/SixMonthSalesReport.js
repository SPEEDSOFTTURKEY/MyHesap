
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

const API_BASE_URL = "https://speedsofttest.com/api";

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const registerRobotoFont = async (doc, fontType = 'normal') => {
  try {
    let fontPath, fontName, fontStyle;
    
    switch (fontType) {
      case 'bold':
        fontPath = '/fonts/Roboto-Bold.ttf';
        fontName = 'Roboto';
        fontStyle = 'bold';
        break;
      case 'italic':
        fontPath = '/fonts/Roboto-Italic.ttf';
        fontName = 'Roboto';
        fontStyle = 'italic';
        break;
      default:
        fontPath = '/fonts/Roboto-Regular.ttf';
        fontName = 'Roboto';
        fontStyle = 'normal';
    }

    console.log(`Attempting to fetch ${fontPath}...`);
    const response = await fetch(fontPath);
    
    if (!response.ok) {
      throw new Error(`Font file could not be loaded: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const fontData = new Uint8Array(buffer);
    
    // Base64 encoding
    let binary = '';
    for (let i = 0; i < fontData.byteLength; i++) {
      binary += String.fromCharCode(fontData[i]);
    }
    
    const base64 = btoa(binary);
    const fileName = fontPath.split('/').pop();
    
    console.log(`Registering ${fontName} ${fontStyle} font...`);
    
    // Fontu kaydet
    doc.addFileToVFS(fileName, base64);
    doc.addFont(fileName, fontName, fontStyle);
    
    console.log(`${fontName} ${fontStyle} font registered successfully`);
    return true;
    
  } catch (error) {
    console.error("Font loading error:", error);
    console.warn("Falling back to Times font");
    
    // Fallback to Times font for better Turkish character support
    doc.setFont("times", fontType === 'bold' ? 'bold' : 'normal');
    return false;
  }
};

const registerAllFonts = async (doc) => {
  try {
    // Tüm font stillerini kaydet
    await registerRobotoFont(doc, 'normal');
    await registerRobotoFont(doc, 'bold');
    await registerRobotoFont(doc, 'italic');
    
    // Varsayılan fontu ayarla
    doc.setFont('Roboto', 'normal');
    return true;
    
  } catch (error) {
    console.error('Error registering all fonts:', error);
    doc.setFont('times', 'normal');
    return false;
  }
};

// Fiyatları formatlayan yardımcı fonksiyon
const formatCurrency = (value) => {
  if (!value && value !== 0) return "0,00 ₺";
  return value.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₺';
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
        const response = await axios.get(`${API_BASE_URL}/musteriSatis/musteriSatis-last-six-months`, {
          headers: { "Cache-Control": "no-cache" }
        });
        
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

  // Prepare data for the chart
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
        label: 'Toplam Satış (₺)',
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
        text: 'Son 6 Ayın Aylık Satışları',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Toplam Satış (₺)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Ay'
        }
      }
    },
  };

  const generatePDFReport = async () => {
    if (!Array.isArray(salesData) || salesData.length === 0) {
      setError("PDF oluşturmak için veri yok.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Tüm fontları kaydet
      await registerAllFonts(doc);

      // Başlık
      doc.setFontSize(18);
      doc.setFont('Roboto', 'bold');
      const title = "6 Aylık Satış Raporu";
      doc.text(title, 148.5, 15, { align: "center" });

      // Oluşturulma tarihi
      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
      doc.text(`Oluşturulma Tarihi: ${currentDateTime}`, 148.5, 25, { align: "center" });

      // Satış verileri tablosu
      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text("Satış Verileri", 14, 35);
      doc.setFont('Roboto', 'normal');

      const tableData = salesData.map(item => [
        item.id || "N/A",
        item.satisId || "N/A",
        item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A",
        item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri",
        formatCurrency(item.toplamFiyat)
      ]);

      doc.autoTable({
        startY: 40,
        head: [["ID", "Satış ID", "Tarih", "Müşteri", "Tutar"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 101, 168],
          fontStyle: "bold",
          textColor: [255, 255, 255],
          font: "Roboto",
          valign: 'middle'
        },
        styles: {
          font: "Roboto",
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
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // Özet tablosu
      const totalAmount = salesData.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0);
      const averageAmount = salesData.length ? totalAmount / salesData.length : 0;
      const documentCount = salesData.length;

      const summaryData = [
        ["Toplam Satış", formatCurrency(totalAmount)],
        ["Ortalama Satış", formatCurrency(averageAmount)],
        ["Belge Sayısı", `${documentCount} adet`],
      ];

      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text("Özet", 14, doc.autoTable.previous.finalY + 15);
      doc.setFont('Roboto', 'normal');

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 20,
        body: summaryData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 101, 168],
          fontStyle: "bold",
          textColor: [255, 255, 255],
          font: "Roboto",
          valign: 'middle'
        },
        styles: {
          font: "Roboto",
          fontStyle: "normal",
          cellPadding: 3,
          fontSize: 10,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: "bold" },
          1: { cellWidth: 70 },
        },
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // PDF'i yeni sekmede aç
      const pdfOutput = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfOutput);
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      setError("PDF oluşturulamadı! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!Array.isArray(salesData) || salesData.length === 0) {
      setError("PDF indirmek için veri yok.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Tüm fontları kaydet
      await registerAllFonts(doc);

      // Başlık
      doc.setFontSize(18);
      doc.setFont('Roboto', 'bold');
      const title = "6 Aylık Satış Raporu";
      doc.text(title, 148.5, 15, { align: "center" });

      // Oluşturulma tarihi
      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      const currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
      doc.text(`Oluşturulma Tarihi: ${currentDateTime}`, 148.5, 25, { align: "center" });

      // Satış verileri tablosu
      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text("Satış Verileri", 14, 35);
      doc.setFont('Roboto', 'normal');

      const tableData = salesData.map(item => [
        item.id || "N/A",
        item.satisId || "N/A",
        item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A",
        item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri",
        formatCurrency(item.toplamFiyat)
      ]);

      doc.autoTable({
        startY: 40,
        head: [["ID", "Satış ID", "Tarih", "Müşteri", "Tutar"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 101, 168],
          fontStyle: "bold",
          textColor: [255, 255, 255],
          font: "Roboto",
          valign: 'middle'
        },
        styles: {
          font: "Roboto",
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
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // Özet tablosu
      const totalAmount = salesData.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0);
      const averageAmount = salesData.length ? totalAmount / salesData.length : 0;
      const documentCount = salesData.length;

      const summaryData = [
        ["Toplam Satış", formatCurrency(totalAmount)],
        ["Ortalama Satış", formatCurrency(averageAmount)],
        ["Belge Sayısı", `${documentCount} adet`],
      ];

      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text("Özet", 14, doc.autoTable.previous.finalY + 15);
      doc.setFont('Roboto', 'normal');

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 20,
        body: summaryData,
        theme: "grid",
        headStyles: {
          fillColor: [41, 101, 168],
          fontStyle: "bold",
          textColor: [255, 255, 255],
          font: "Roboto",
          valign: 'middle'
        },
        styles: {
          font: "Roboto",
          fontStyle: "normal",
          cellPadding: 3,
          fontSize: 10,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: 70, fontStyle: "bold" },
          1: { cellWidth: 70 },
        },
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // PDF'i indir
      doc.save(`6_Aylık_Satış_Raporu_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`);
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      setError("PDF indirilemedi! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateExcelReport = () => {
    if (!Array.isArray(salesData) || salesData.length === 0) {
      setError("Excel oluşturmak için veri yok.");
      return;
    }

    const tableData = salesData.map(item => ({
      ID: item.id || "N/A",
      "Satış ID": item.satisId || "N/A",
      Tarih: item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A",
      Müşteri: item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri",
      Tutar: formatCurrency(item.toplamFiyat)
    }));

    const totalAmount = salesData.reduce((sum, item) => sum + (item.toplamFiyat || 0), 0);
    const averageAmount = salesData.length ? totalAmount / salesData.length : 0;
    const documentCount = salesData.length;

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
    const fileName = `6_Aylık_Satış_Raporu_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        6 Aylık Satış Raporu
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol md={6}>
            <CFormInput
              placeholder="Tabloda Ara..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </CCol>
          <CCol md={6} className="text-end">
            <CButton color="info" onClick={generatePDFReport} className="me-2" disabled={loading}>
              Raporla
            </CButton>
            <CButton color="success" onClick={handleDownloadPDF} className="me-2" disabled={loading}>
              PDF İndir
            </CButton>
            <CButton color="warning" onClick={generateExcelReport} disabled={loading}>
              Excel İndir
            </CButton>
          </CCol>
        </CRow>

        {/* Sales Data Table */}
        <h4 className="mt-4">Son 6 Ayın Satış Verileri</h4>
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        {loading ? (
          <p>Yükleniyor...</p>
        ) : (
          <>
            {Array.isArray(filteredData) && filteredData.length > 0 ? (
              <CTable striped hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Satış ID</CTableHeaderCell>
                    <CTableHeaderCell>Tarih</CTableHeaderCell>
                    <CTableHeaderCell>Müşteri</CTableHeaderCell>
                    <CTableHeaderCell>Tutar</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredData.map((item) => (
                    <CTableRow key={item.id || Math.random()}>
                      <CTableDataCell>{item.id || "N/A"}</CTableDataCell>
                      <CTableDataCell>{item.satisId || "N/A"}</CTableDataCell>
                      <CTableDataCell>{item.eklenmeTarihi ? dayjs(item.eklenmeTarihi).format("DD/MM/YYYY") : "N/A"}</CTableDataCell>
                      <CTableDataCell>{item.musteris?.unvani || item.musteriUnvani || "Bilinmeyen Müşteri"}</CTableDataCell>
                      <CTableDataCell>{formatCurrency(item.toplamFiyat)}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            ) : (
              <p>Satış verisi bulunamadı.</p>
            )}
          </>
        )}

        {/* Monthly Sales Chart */}
        <h4 className="mt-4">Aylık Satış İstatistikleri</h4>
        <div style={{ height: '400px', marginBottom: '20px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </CCardBody>
    </CCard>
  );
};

export default SixMonthSalesReport;
