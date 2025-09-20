
import { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CRow,
  CCol,
} from "@coreui/react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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

const API_BASE_URL = "https://speedsofttest.com/api";

const NonSalesCustomersReport = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNonSalesCustomers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/musteriSatis/satisolmayanmusteri-get-all`, {
          headers: { "Cache-Control": "no-cache" }
        });
        setCustomers(response.data);
        setError(null);
      } catch (err) {
        console.error("API hatası:", err);
        setError("Müşteri verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchNonSalesCustomers();
  }, []);

  const generatePDFReport = async () => {
    if (!customers.length) {
      setError("PDF oluşturmak için veri yok.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Tüm fontları kaydet
      await registerAllFonts(doc);

      // Başlık
      doc.setFontSize(16);
      doc.setFont('Roboto', 'bold');
      doc.text("Satış Olmayan Müşteriler Raporu", 14, 20);
      doc.setFont('Roboto', 'normal');

      // Tablo başlıkları
      const tableColumn = [
        "Müşteri Ünvanı",
        "Telefon",
        "Adres",
        "Eklenme Tarihi"
      ];

      // Tablo verileri - Türkçe karakterler korunuyor
      const tableRows = customers.map((customer) => [
        customer.unvani || "-",
        customer.telefon || "-",
        customer.adres || "-",
        customer.eklenmeDurumu
          ? new Date(customer.eklenmeDurumu).toLocaleDateString("tr-TR")
          : "-"
      ]);

      // Tabloyu PDF'e ekle
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: "grid",
        styles: {
          font: "Roboto",
          fontSize: 8,
          cellPadding: 3,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [41, 101, 168],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          font: "Roboto",
          valign: 'middle'
        },
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // PDF'i yeni sekmede aç
      const pdfOutput = doc.output("blob");
      const url = URL.createObjectURL(pdfOutput);
      window.open(url, "_blank");
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      setError("PDF oluşturulamadı! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!customers.length) {
      setError("PDF indirmek için veri yok.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Tüm fontları kaydet
      await registerAllFonts(doc);

      // Başlık
      doc.setFontSize(16);
      doc.setFont('Roboto', 'bold');
      doc.text("Satış Olmayan Müşteriler Raporu", 14, 20);
      doc.setFont('Roboto', 'normal');

      // Tablo başlıkları
      const tableColumn = [
        "Müşteri Ünvanı",
        "Telefon",
        "Adres",
        "Eklenme Tarihi"
      ];

      // Tablo verileri - Türkçe karakterler korunuyor
      const tableRows = customers.map((customer) => [
        customer.unvani || "-",
        customer.telefon || "-",
        customer.adres || "-",
        customer.eklenmeDurumu
          ? new Date(customer.eklenmeDurumu).toLocaleDateString("tr-TR")
          : "-"
      ]);

      // Tabloyu PDF'e ekle
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: "grid",
        styles: {
          font: "Roboto",
          fontSize: 8,
          cellPadding: 3,
          valign: 'middle'
        },
        headStyles: {
          fillColor: [41, 101, 168],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          font: "Roboto",
          valign: 'middle'
        },
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      // PDF'i indir
      doc.save(`SatışOlmayanMüşterilerRaporu_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF indirme hatası:", err);
      setError("PDF indirilemedi! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateExcelReport = () => {
    if (!customers.length) {
      setError("Excel oluşturmak için veri yok.");
      return;
    }

    const wsData = [
      [
        "Müşteri Ünvanı",
        "Telefon",
        "Adres",
        "Eklenme Tarihi"
      ],
      ...customers.map((customer) => [
        customer.unvani || "-",
        customer.telefon || "-",
        customer.adres || "-",
        customer.eklenmeDurumu
          ? new Date(customer.eklenmeDurumu).toLocaleDateString("tr-TR")
          : "-"
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Satış Olmayan Müşteriler");

    // Excel dosyasını indir
    XLSX.writeFile(wb, `SatışOlmayanMüşterilerRaporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Satış Olmayan Müşteriler
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol className="d-flex justify-content-start gap-3">
            <CButton
              color="info"
              onClick={generatePDFReport}
              disabled={loading}
            >
              {loading ? "Yükleniyor..." : "Raporla"}
            </CButton>
            <CButton
              color="success"
              onClick={handleDownloadPDF}
              disabled={loading}
            >
              PDF İndir
            </CButton>
            <CButton
              color="warning"
              onClick={generateExcelReport}
              disabled={loading}
            >
              Excel İndir
            </CButton>
          </CCol>
        </CRow>
        {loading ? (
          <p>Yükleniyor...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : customers.length === 0 ? (
          <p>Satış olmayan müşteri bulunamadı.</p>
        ) : (
          <CTable striped hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Müşteri Ünvanı</CTableHeaderCell>
                <CTableHeaderCell>Telefon</CTableHeaderCell>
                <CTableHeaderCell>Adres</CTableHeaderCell>
                <CTableHeaderCell>Eklenme Tarihi</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {customers.map((customer) => (
                <CTableRow key={customer.id}>
                  <CTableDataCell>{customer.unvani || "-"}</CTableDataCell>
                  <CTableDataCell>{customer.telefon || "-"}</CTableDataCell>
                  <CTableDataCell>{customer.adres || "-"}</CTableDataCell>
                  <CTableDataCell>
                    {customer.eklenmeDurumu
                      ? new Date(customer.eklenmeDurumu).toLocaleDateString("tr-TR")
                      : "-"}
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  );
};

export default NonSalesCustomersReport;
