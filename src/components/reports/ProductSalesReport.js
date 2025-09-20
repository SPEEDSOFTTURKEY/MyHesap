
import { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormLabel,
  CFormSelect,
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
  CFormCheck,
} from "@coreui/react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

// API base URL
const API_BASE_URL = "https://speedsofttest.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Fiyatları formatlayan yardımcı fonksiyon
const formatPrice = (value) => {
  if (!value && value !== 0) return "-";
  return `${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")} TL`;
};

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

const ProductSalesReport = () => {
  const [formData, setFormData] = useState({
    transactionType: "",
    dateRangeStart: dayjs(),
    dateRangeEnd: dayjs(),
    documentStatus: "",
    customer: "",
    supplier: "",
    warehouse: "",
  });

  const [warehouses, setWarehouses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [warehouseRes, customerRes, supplierRes] = await Promise.all([
          api.get("/depo/get-all", { headers: { "Cache-Control": "no-cache" } }),
          api.get("/musteri/musteri-get-all", { headers: { "Cache-Control": "no-cache" } }),
          api.get("/tedarikci/tedarikci-get-all", { headers: { "Cache-Control": "no-cache" } }),
        ]);
        setWarehouses(warehouseRes.data);
        setCustomers(customerRes.data);
        setSuppliers(supplierRes.data);
      } catch (err) {
        console.error("API hatası:", err);
        alert("Veriler yüklenemedi!");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Table verisi çek
  useEffect(() => {
    const fetchTableData = async () => {
      if (!formData.transactionType || (formData.transactionType === "purchases" && !formData.supplier)) {
        setTableData([]);
        setSelected([]);
        return;
      }
      setLoading(true);
      try {
        let res;
        if (formData.transactionType === "purchases") {
          const selectedSupplier = suppliers.find((supplier) => supplier.unvan === formData.supplier);
          if (!selectedSupplier) {
            alert("Seçilen tedarikçi bulunamadı!");
            setTableData([]);
            setSelected([]);
            setLoading(false);
            return;
          }
          res = await api.get(`/alis/alis-get-by-tedarikci-id/${selectedSupplier.id}`, {
            headers: { "Cache-Control": "no-cache" },
          });
        } else {
          if (formData.customer) {
            const selectedCustomer = customers.find((customer) => customer.unvani === formData.customer);
            if (!selectedCustomer) {
              alert("Seçilen müşteri bulunamadı!");
              setTableData([]);
              setSelected([]);
              setLoading(false);
              return;
            }
            res = await api.get(`/musteriSatis/musteriSatis-get-by-musteri/${selectedCustomer.id}`, {
              headers: { "Cache-Control": "no-cache" },
            });
          } else {
            res = await api.get("/musteriSatis/musteriSatis-get-all", {
              headers: { "Cache-Control": "no-cache" },
            });
          }
        }

        const filtered = res.data.filter((item) => {
          const itemDate = dayjs(item.tarih || item.eklenmeTarihi);
          const start = dayjs(formData.dateRangeStart).startOf("day");
          const end = dayjs(formData.dateRangeEnd).endOf("day");
          const matchDocumentStatus = !formData.documentStatus || item.durumu.toString() === formData.documentStatus;
          const matchWarehouse = !formData.warehouse || item.depo?.adi === formData.warehouse;
          const matchUser = formData.transactionType === "sales"
            ? !formData.customer || item.musteris?.unvani === formData.customer
            : true;

          return (
            itemDate.isAfter(start.subtract(1, "day")) &&
            itemDate.isBefore(end.add(1, "day")) &&
            matchDocumentStatus &&
            matchWarehouse &&
            matchUser
          );
        });

        setTableData(filtered);
        setSelected([]);
      } catch (err) {
        console.error("API hatası:", err);
        alert("Veriler yüklenemedi!");
        setTableData([]);
        setSelected([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTableData();
  }, [
    formData.transactionType,
    formData.supplier,
    formData.customer,
    formData.dateRangeStart,
    formData.dateRangeEnd,
    formData.documentStatus,
    formData.warehouse,
    suppliers,
    customers,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(displayedData.length === selected.length ? [] : displayedData.map((item) => item.id));
  };

  const handleGeneratePDF = async () => {
    if (tableData.length === 0) {
      alert("Rapor için veri bulunamadı!");
      return;
    }
    
    const selectedData = selected.length > 0 
      ? tableData.filter((item) => selected.includes(item.id))
      : tableData;
    
    if (selectedData.length === 0) {
      alert("Lütfen en az bir satır seçiniz!");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Starting PDF generation...");
      
      const doc = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: "a4" 
      });
      
      // Tüm fontları kaydet
      await registerAllFonts(doc);
      
      // Başlık - Kalın font kullan
      doc.setFontSize(18);
      doc.setFont('Roboto', 'bold');
      doc.text(
        formData.transactionType === "sales" ? "Ürün Satış Raporu" : "Ürün Alış Raporu", 
        doc.internal.pageSize.getWidth() / 2, 
        15, 
        { align: "center" }
      );
      
      // Normal fonta geri dön
      doc.setFont('Roboto', 'normal');
      
      // Tablo başlıkları
      const head = formData.transactionType === "purchases"
        ? [["ID", "Ürün", "Barkod", "Tarih", "Tedarikçi", "Miktar", "Birim Fiyat", "İndirim (%)", "Toplam", "KDV (%)", "Para Birimi", "Belge No", "Vade Tarih", "Depo"]]
        : [["ID", "Ürün", "Barkod", "Tarih", "Müşteri", "Miktar", "Birim Fiyat", "Toplam"]];
      
      // Tablo verileri - Türkçe karakterler korunuyor
      const body = selectedData.map((item, index) =>
        formData.transactionType === "purchases"
          ? [
              index + 1,
              item.urun?.adi || "-",
              item.urun?.barkod || "-",
              dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY"),
              item.tedarikci?.unvan || "-",
              item.miktar || 0,
              formatPrice(item.fiyat),
              item.indirim || 0,
              formatPrice(item.toplam),
              item.kDV || 0,
              item.paraBirimi || "TRY",
              item.belgeNo || "-",
              item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-",
              item.depo?.adi || "-",
            ]
          : [
              index + 1,
              item.urunAdi || "-",
              item.barkod || "-",
              dayjs(item.eklenmeTarihi).format("DD/MM/YYYY"),
              item.musteris?.unvani || "-",
              item.miktar || 0,
              formatPrice(item.fiyat),
              formatPrice(item.toplamFiyat),
            ]
      );

      console.log("Generating autoTable...");
      
      doc.autoTable({
        startY: 25,
        head,
        body,
        theme: "grid",
        styles: { 
          font: "Roboto",
          fontSize: 9, 
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
        // Font bulunamazsa fallback
        didDrawPage: (data) => {
          if (!doc.getFontList().Roboto) {
            doc.setFont('times');
          }
        }
      });

      console.log("Table generated, opening in new tab...");
      
      // PDF'i blob olarak al ve yeni sekmede aç
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      console.log("PDF opened in new tab successfully");
      
    } catch (err) {
      console.error("PDF creation error:", err);
      alert("PDF oluşturulamadı! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (tableData.length === 0) {
      alert("Rapor için veri bulunamadı!");
      return;
    }
    
    const selectedData = selected.length > 0 
      ? tableData.filter((item) => selected.includes(item.id))
      : tableData;
    
    if (selectedData.length === 0) {
      alert("Lütfen en az bir satır seçiniz!");
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
      doc.setFontSize(18);
      doc.setFont('Roboto', 'bold');
      doc.text(
        formData.transactionType === "sales" ? "Ürün Satış Raporu" : "Ürün Alış Raporu", 
        doc.internal.pageSize.getWidth() / 2, 
        15, 
        { align: "center" }
      );
      
      doc.setFont('Roboto', 'normal');
      
      // Tablo başlıkları
      const head = formData.transactionType === "purchases"
        ? [["ID", "Ürün", "Barkod", "Tarih", "Tedarikçi", "Miktar", "Birim Fiyat", "İndirim (%)", "Toplam", "KDV (%)", "Para Birimi", "Belge No", "Vade Tarih", "Depo"]]
        : [["ID", "Ürün", "Barkod", "Tarih", "Müşteri", "Miktar", "Birim Fiyat", "Toplam"]];
      
      // Tablo verileri - Türkçe karakterler korunuyor
      const body = selectedData.map((item, index) =>
        formData.transactionType === "purchases"
          ? [
              index + 1,
              item.urun?.adi || "-",
              item.urun?.barkod || "-",
              dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY"),
              item.tedarikci?.unvan || "-",
              item.miktar || 0,
              formatPrice(item.fiyat),
              item.indirim || 0,
              formatPrice(item.toplam),
              item.kDV || 0,
              item.paraBirimi || "TRY",
              item.belgeNo || "-",
              item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-",
              item.depo?.adi || "-",
            ]
          : [
              index + 1,
              item.urunAdi || "-",
              item.barkod || "-",
              dayjs(item.eklenmeTarihi).format("DD/MM/YYYY"),
              item.musteris?.unvani || "-",
              item.miktar || 0,
              formatPrice(item.fiyat),
              formatPrice(item.toplamFiyat),
            ]
      );

      doc.autoTable({
        startY: 25,
        head,
        body,
        theme: "grid",
        styles: { 
          font: "Roboto",
          fontSize: 9, 
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

      doc.save(`${formData.transactionType === "sales" ? "Satış_Raporu" : "Alış_Raporu"}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`);
      
    } catch (err) {
      console.error("PDF download error:", err);
      alert("PDF indirilemedi! Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) {
      alert("Rapor için veri bulunamadı!");
      return;
    }
    
    const selectedData = selected.length > 0 
      ? tableData.filter((item) => selected.includes(item.id))
      : tableData;
    
    if (selectedData.length === 0) {
      alert("Lütfen en az bir satır seçiniz!");
      return;
    }
    
    const data = selectedData.map((item, index) =>
      formData.transactionType === "purchases"
        ? {
            ID: index + 1,
            Ürün: item.urun?.adi || "-",
            Barkod: item.urun?.barkod || "-",
            Tarih: dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY"),
            Tedarikçi: item.tedarikci?.unvan || "-",
            Miktar: item.miktar || 0,
            "Birim Fiyat": formatPrice(item.fiyat),
            "İndirim (%)": item.indirim || 0,
            Toplam: formatPrice(item.toplam),
            "KDV (%)": item.kDV || 0,
            "Para Birimi": item.paraBirimi || "TRY",
            "Belge No": item.belgeNo || "-",
            "Vade Tarih": item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-",
            Depo: item.depo?.adi || "-",
          }
        : {
            ID: index + 1,
            Ürün: item.urunAdi || "-",
            Barkod: item.barkod || "-",
            Tarih: dayjs(item.eklenmeTarihi).format("DD/MM/YYYY"),
            Müşteri: item.musteris?.unvani || "-",
            Miktar: item.miktar || 0,
            "Birim Fiyat": formatPrice(item.fiyat),
            Toplam: formatPrice(item.toplamFiyat),
          }
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
    XLSX.writeFile(workbook, `${formData.transactionType === "sales" ? "Satış_Raporu" : "Alış_Raporu"}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  };

  const displayedData = tableData.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <CCard className="shadow-lg rounded-lg">
        <CCardHeader className="bg-blue-600 text-white text-lg font-semibold p-4">
          Ürün Alış-Satış Raporu
        </CCardHeader>
        <CCardBody className="p-6">
          <div className="mb-6">
            <CRow className="g-4">
              <CCol md={4}>
                <CFormLabel className="text-sm font-medium text-gray-700">İşlem Tipi</CFormLabel>
                <CFormSelect
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Seçiniz</option>
                  <option value="sales">Satışlar</option>
                  <option value="purchases">Alışlar</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel className="text-sm font-medium text-gray-700">Başlangıç Tarihi</CFormLabel>
                <CFormInput
                  type="date"
                  value={formData.dateRangeStart.format("YYYY-MM-DD")}
                  onChange={(e) => handleDateChange("dateRangeStart", dayjs(e.target.value))}
                  className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="text-sm font-medium text-gray-700">Bitiş Tarihi</CFormLabel>
                <CFormInput
                  type="date"
                  value={formData.dateRangeEnd.format("YYYY-MM-DD")}
                  onChange={(e) => handleDateChange("dateRangeEnd", dayjs(e.target.value))}
                  className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="text-sm font-medium text-gray-700">
                  {formData.transactionType === "sales" ? "Müşteri" : formData.transactionType === "purchases" ? "Tedarikçi" : "Müşteri/Tedarikçi"}
                </CFormLabel>
                <CFormSelect
                  name={formData.transactionType === "sales" ? "customer" : "supplier"}
                  value={formData.transactionType === "sales" ? formData.customer : formData.supplier}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || !formData.transactionType}
                >
                  <option value="">Seçiniz</option>
                  {(formData.transactionType === "sales" ? customers : suppliers).map((user) => (
                    <option key={user.id} value={formData.transactionType === "sales" ? user.unvani : user.unvan}>
                      {formData.transactionType === "sales" ? user.unvani : user.unvan}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              {/* Depo seçimi şu anda yorum satırında, gerekirse açılabilir */}
              {/* <CCol md={4}>
                <CFormLabel className="text-sm font-medium text-gray-700">Depo</CFormLabel>
                <CFormSelect
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleChange}
                  className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Seçiniz</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.adi}>
                      {warehouse.adi}
                    </option>
                  ))}
                </CFormSelect>
              </CCol> */}
            </CRow>
            <div className="mt-4 flex space-x-4">
              <CButton
                color="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
                disabled={loading}
                onClick={handleGeneratePDF}
              >
                {loading ? "Yükleniyor..." : "Rapor Hazırla"}
              </CButton>
              <CButton
                color="success"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                disabled={loading}
                onClick={handleDownloadPDF}
              >
                PDF İndir
              </CButton>
              <CButton
                color="warning"
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-md"
                disabled={loading}
                onClick={handleExportExcel}
              >
                Excel Oluştur
              </CButton>
            </div>
          </div>

          {tableData.length > 0 && (
            <div className="mt-6">
              <CFormInput
                placeholder="Tablo içinde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <CTable striped hover responsive className="border rounded-lg">
                <CTableHead className="bg-blue-100">
                  <CTableRow>
                    <CTableHeaderCell className="p-3">
                      <CFormCheck
                        checked={selected.length === displayedData.length && displayedData.length > 0}
                        onChange={toggleAll}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Sıra</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Ürün</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Barkod</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Tarih</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">{formData.transactionType === "sales" ? "Müşteri" : "Tedarikçi"}</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Miktar</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Birim Fiyat</CTableHeaderCell>
                    <CTableHeaderCell className="p-3">Toplam</CTableHeaderCell>
                    {formData.transactionType === "purchases" && (
                      <>
                        <CTableHeaderCell className="p-3">İndirim (%)</CTableHeaderCell>
                        <CTableHeaderCell className="p-3">KDV (%)</CTableHeaderCell>
                        <CTableHeaderCell className="p-3">Para Birimi</CTableHeaderCell>
                        <CTableHeaderCell className="p-3">Belge No</CTableHeaderCell>
                        <CTableHeaderCell className="p-3">Vade Tarih</CTableHeaderCell>
                        <CTableHeaderCell className="p-3">Depo</CTableHeaderCell>
                      </>
                    )}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {displayedData.map((item, index) => (
                    <CTableRow key={item.id} className="hover:bg-gray-50">
                      <CTableDataCell className="p-3">
                        <CFormCheck
                          checked={selected.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="p-3">{index + 1}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "purchases" ? item.urun?.adi || "-" : item.urunAdi || "-"}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "purchases" ? item.urun?.barkod || "-" : item.barkod || "-"}</CTableDataCell>
                      <CTableDataCell className="p-3">{dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY")}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "sales" ? item.musteris?.unvani || "-" : item.tedarikci?.unvan || "-"}</CTableDataCell>
                      <CTableDataCell className="p-3">{item.miktar || 0}</CTableDataCell>
                      <CTableDataCell className="p-3">{formatPrice(item.fiyat)}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "purchases" ? formatPrice(item.toplam) : formatPrice(item.toplamFiyat)}</CTableDataCell>
                      {formData.transactionType === "purchases" && (
                        <>
                          <CTableDataCell className="p-3">{item.indirim || 0}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.kDV || 0}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.paraBirimi || "TRY"}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.belgeNo || "-"}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-"}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.depo?.adi || "-"}</CTableDataCell>
                        </>
                      )}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ProductSalesReport;
