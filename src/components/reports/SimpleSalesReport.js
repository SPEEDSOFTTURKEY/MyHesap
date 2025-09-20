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
  CSpinner,
  CAlert,
} from "@coreui/react";
import ReportForm from "./ReportForm";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import api from "../../api/api";

// API Base URL
const API_BASE_URL = "https://speedsofttest.com/api";

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

// Sabit satış kanalları (API yerine genel kullanılan değerler)
const SALES_CHANNELS = [
  { id: 1, adi: "Online" },
  { id: 2, adi: "Fiziksel Mağaza" },
  { id: 3, adi: "Bayi" },
  { id: 4, adi: "Telefon Satışı" },
  { id: 5, adi: "Diğer" },
];

const SimpleSalesReport = () => {
  const [formData, setFormData] = useState({
    dateRangeStart: dayjs(),
    dateRangeEnd: dayjs(),
    customer: "",
    productService: "",
    salesChannel: "", // Satış kanalı filtresi
    comparePeriod: "", // Karşılaştırma dönemi
  });

  const [salesData, setSalesData] = useState([]);
  const [previousPeriodData, setPreviousPeriodData] = useState([]); // Karşılaştırma verileri
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`Form data updated: ${name} = ${value}`);
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`Date updated: ${name} = ${value.format("YYYY-MM-DD")}`);
  };

  // Satış verilerini çekmek için API
  const fetchSalesData = async (isPreviousPeriod = false) => {
    try {
      setLoading(true);
      setError(null);

      // Tüm satış verilerini çek
      const response = await api.get(
        `${API_BASE_URL}/musteriSatis/musteriSatis-get-all`,
        { headers: { "Cache-Control": "no-cache" } },
      );

      let filteredData = response.data;

      // Tarih filtrelemesi
      if (formData.dateRangeStart && formData.dateRangeEnd) {
        const start = isPreviousPeriod
          ? formData.dateRangeStart.subtract(1, formData.comparePeriod || "month")
          : formData.dateRangeStart;
        const end = isPreviousPeriod
          ? formData.dateRangeEnd.subtract(1, formData.comparePeriod || "month")
          : formData.dateRangeEnd;

        filteredData = filteredData.filter((item) => {
          const saleDate = dayjs(item.eklenmeTarihi);
          return (
            saleDate.isAfter(start.subtract(1, "day")) &&
            saleDate.isBefore(end.add(1, "day"))
          );
        });
      }

      // Müşteri, ürün ve satış kanalı filtrelemesi (kanal alanı yoksa, varsayılan olarak ekle veya filtrelemeyi atla)
      filteredData = filteredData.filter((item) => {
        return (
          (!formData.customer || item.musteri?.unvani === formData.customer) &&
          (!formData.productService || item.urunAdi === formData.productService) &&
          (!formData.salesChannel || (item.kanal || "Diğer") === formData.salesChannel) // Kanal eksikse "Diğer" varsay
        );
      });

      console.log(`Filtered sales data (${isPreviousPeriod ? "previous" : "current"}):`, filteredData);

      if (isPreviousPeriod) {
        setPreviousPeriodData(filteredData);
      } else {
        setSalesData(filteredData);
      }
      return filteredData;
    } catch (err) {
      setError("Satış verileri yüklenirken bir hata oluştu.");
      console.error("Error fetching sales data:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Müşteri listesini çekmek için API
  const fetchCustomers = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/musteri/musteri-get-all`);
      setCustomers(response.data);
      console.log("Customers fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Müşteriler yüklenirken hata:", error);
      return [];
    }
  };

  // Ürün listesini çekmek için API
  const fetchProducts = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/urun/urun-get-all`);
      setProducts(response.data);
      console.log("Products fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Ürünler yüklenirken hata:", error);
      return [];
    }
  };

  useEffect(() => {
    // Sayfa yüklendiğinde veri çek (satış kanalları sabit olduğu için fetch kaldırıldı)
    const initializeData = async () => {
      try {
        await Promise.all([fetchCustomers(), fetchProducts()]);
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
      }
    };

    initializeData();
  }, []);

  const generatePDFReport = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      registerTurkishFont(doc);

      // Gerçek verileri çek
      const salesData = await fetchSalesData();
      const previousData = formData.comparePeriod ? await fetchSalesData(true) : [];

      // Başlık
      doc.setFontSize(18);
      const title = convertTurkishChars("Basit Satış Raporu");
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

      // Rapor aralığı
      doc.text(
        convertTurkishChars(
          `Rapor Aralığı: ${formData.dateRangeStart.format("DD/MM/YYYY")} - ${formData.dateRangeEnd.format("DD/MM/YYYY")}`,
        ),
        doc.internal.pageSize.width / 2,
        35,
        { align: "center" },
      );

      // Satış verileri başlığı
      doc.setFontSize(14);
      doc.text(convertTurkishChars("Detaylı Satış Verileri"), 14, 45);

      // Satış verileri tablosu (daha detaylı: ekstra sütunlar ekle, örneğin kategori varsa)
      const tableData = salesData.map((item) => [
        item.id,
        convertTurkishChars(item.musteri?.unvani || "Bilinmeyen Müşteri"),
        convertTurkishChars(item.urunAdi),
        convertTurkishChars(item.kategori || "Bilinmeyen Kategori"), // Yeni: Ürün kategorisi (eksikse varsayılan)
        item.miktar,
        item.birim,
        `${item.fiyat.toLocaleString("tr-TR")} ₺`,
        `${item.toplamFiyat.toLocaleString("tr-TR")} ₺`,
        convertTurkishChars(item.kanal || "Diğer"), // Satış kanalı
        dayjs(item.eklenmeTarihi).format("DD/MM/YYYY HH:mm"),
      ]);

      doc.autoTable({
        startY: 50,
        head: [
          [
            convertTurkishChars("ID"),
            convertTurkishChars("Müşteri"),
            convertTurkishChars("Ürün"),
            convertTurkishChars("Kategori"), // Yeni: Kategori sütunu
            convertTurkishChars("Miktar"),
            convertTurkishChars("Birim"),
            convertTurkishChars("Birim Fiyat"),
            convertTurkishChars("Toplam Fiyat"),
            convertTurkishChars("Satış Kanalı"),
            convertTurkishChars("Tarih"),
          ],
        ],
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
          fontSize: 8,
          overflow: "linebreak",
        },
        margin: { top: 50, right: 14, bottom: 30, left: 14 },
        tableWidth: "auto",
      });

      // Yeni sayfa ekle (daha detaylı rapor için)
      let finalY = doc.autoTable.previous.finalY + 15;
      if (finalY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        finalY = 20;
      }

      // Ürün/Kategori bazında özet tablosu
      doc.setFontSize(14);
      doc.text(convertTurkishChars("Ürün/Kategori Bazında Satış Özeti"), 14, finalY);

      // Ürün bazında grup hesapla
      const productSummary = salesData.reduce((acc, item) => {
        const key = item.urunAdi;
        if (!acc[key]) {
          acc[key] = { miktar: 0, toplamFiyat: 0, kategori: item.kategori || "Bilinmeyen" };
        }
        acc[key].miktar += item.miktar;
        acc[key].toplamFiyat += item.toplamFiyat;
        return acc;
      }, {});

      const productTableData = Object.entries(productSummary).map(([urun, data]) => [
        convertTurkishChars(urun),
        convertTurkishChars(data.kategori),
        data.miktar,
        `${data.toplamFiyat.toLocaleString("tr-TR")} ₺`,
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [
          [
            convertTurkishChars("Ürün"),
            convertTurkishChars("Kategori"),
            convertTurkishChars("Toplam Miktar"),
            convertTurkishChars("Toplam Fiyat"),
          ],
        ],
        body: productTableData,
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
        margin: { left: 14 },
        tableWidth: "auto",
      });

      // Yeni sayfa için kontrol
      finalY = doc.autoTable.previous.finalY + 15;
      if (finalY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        finalY = 20;
      }

      // Satış kanalı bazında özet tablosu
      doc.setFontSize(14);
      doc.text(convertTurkishChars("Satış Kanalı Bazında Özet"), 14, finalY);

      const channelSummary = salesData.reduce((acc, item) => {
        const key = item.kanal || "Diğer";
        if (!acc[key]) {
          acc[key] = { miktar: 0, toplamFiyat: 0 };
        }
        acc[key].miktar += item.miktar;
        acc[key].toplamFiyat += item.toplamFiyat;
        return acc;
      }, {});

      const channelTableData = Object.entries(channelSummary).map(([kanal, data]) => [
        convertTurkishChars(kanal),
        data.miktar,
        `${data.toplamFiyat.toLocaleString("tr-TR")} ₺`,
      ]);

      doc.autoTable({
        startY: finalY + 5,
        head: [
          [
            convertTurkishChars("Satış Kanalı"),
            convertTurkishChars("Toplam Miktar"),
            convertTurkishChars("Toplam Fiyat"),
          ],
        ],
        body: channelTableData,
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
        margin: { left: 14 },
        tableWidth: "auto",
      });

      // Yeni sayfa için kontrol
      finalY = doc.autoTable.previous.finalY + 15;
      if (finalY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        finalY = 20;
      }

      // Özet ve KPI'lar (daha detaylı)
      doc.setFontSize(14);
      doc.text(convertTurkishChars("Genel Özet ve Performans Göstergeleri"), 14, finalY);

      // Özet verileri
      const totalAmount = salesData.reduce((sum, item) => sum + item.toplamFiyat, 0);
      const totalQuantity = salesData.reduce((sum, item) => sum + item.miktar, 0);
      const averageAmount = salesData.length > 0 ? totalAmount / salesData.length : 0;
      const totalOrders = salesData.length;
      const averageBasket = totalOrders > 0 ? totalAmount / totalOrders : 0;
      const uniqueCustomers = new Set(salesData.map(item => item.musteri?.unvani)).size;
      const uniqueProducts = new Set(salesData.map(item => item.urunAdi)).size;

      // Karşılaştırmalı veriler
      const previousTotalAmount = previousData.reduce((sum, item) => sum + item.toplamFiyat, 0);
      const salesChange = previousTotalAmount > 0 ? ((totalAmount - previousTotalAmount) / previousTotalAmount) * 100 : 0;

      const formatCurrency = (value) => {
        return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
      };

      const summaryData = [
        [convertTurkishChars("Toplam Satış Tutarı"), formatCurrency(totalAmount)],
        [convertTurkishChars("Toplam Satış Miktarı"), `${totalQuantity} adet`],
        [convertTurkishChars("Ortalama Satış Tutarı"), formatCurrency(averageAmount)],
        [convertTurkishChars("Toplam Satış Sayısı"), `${totalOrders} adet`],
        [convertTurkishChars("Ortalama Sepet Tutarı"), formatCurrency(averageBasket)],
        [convertTurkishChars("Eşsiz Müşteri Sayısı"), `${uniqueCustomers} adet`],
        [convertTurkishChars("Eşsiz Ürün Sayısı"), `${uniqueProducts} adet`],
        formData.comparePeriod && [
          convertTurkishChars("Değişim (Önceki Dönem)"),
          `${salesChange.toFixed(2)}%`,
        ],
      ].filter(Boolean);

      doc.autoTable({
        startY: finalY + 5,
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
          0: { fontStyle: "bold", cellWidth: 80 },
          1: { cellWidth: 60 },
        },
        margin: { left: 14 },
        tableWidth: 140,
      });

      // Öneriler (daha detaylı)
      finalY = doc.autoTable.previous.finalY + 15;
      if (finalY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFontSize(14);
      doc.text(convertTurkishChars("Değerlendirme ve Öneriler"), 14, finalY);

      const recommendations = [
        salesChange > 0
          ? "Satışlar önceki döneme göre % " + salesChange.toFixed(2) + " arttı. Başarılı stratejilere devam edin, yeni fırsatlar araştırın."
          : "Satışlar önceki döneme göre % " + Math.abs(salesChange).toFixed(2) + " düştü. Nedenleri analiz edin ve pazarlama kampanyalarını güçlendirin.",
        totalQuantity > previousData.reduce((sum, item) => sum + item.miktar, 0)
          ? "Satış miktarı artmış. Stok yönetimini optimize edin."
          : "Satış miktarı azalmış. Ürün çeşitliliğini gözden geçirin.",
        formData.salesChannel
          ? `Seçilen satış kanalı (${formData.salesChannel}) toplam satışların %${((channelSummary[formData.salesChannel]?.toplamFiyat || 0) / totalAmount * 100).toFixed(2)}'ini oluşturuyor. Bu kanala odaklanın.`
          : "Tüm satış kanallarında dengeli bir dağılım var. En zayıf kanalı güçlendirin.",
        uniqueCustomers < 10 ? "Müşteri sayısı düşük. Yeni müşteri kazanma stratejileri uygulayın." : "Müşteri tabanı geniş. Sadakat programları geliştirin.",
        "Genel öneri: Dijital pazarlama ve veri analizi araçlarını kullanarak trendleri takip edin."
      ];

      doc.autoTable({
        startY: finalY + 5,
        body: recommendations.map((text, index) => [index + 1, convertTurkishChars(text)]),
        theme: "grid",
        head: [[convertTurkishChars("No"), convertTurkishChars("Öneri / Değerlendirme")]],
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
          0: { cellWidth: 20 },
          1: { cellWidth: "auto" },
        },
        margin: { left: 14 },
        tableWidth: "auto",
      });

      // PDF'i yeni sekmede aç
      const pdfOutput = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfOutput);
      window.open(pdfUrl, "_blank");
    } catch (err) {
      setError("PDF oluşturulurken bir hata oluştu.");
      console.error("Error generating PDF:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log("Form submitted with data:", formData);
    await generatePDFReport();
  };

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        {convertTurkishChars("Satış Raporu")}
      </CCardHeader>
      <CCardBody>
        <ReportForm onSubmit={handleSubmit} pdfLoading={pdfLoading}>
          <CRow>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Başlangıç Tarihi")}</CFormLabel>
              <CFormInput
                type="date"
                value={formData.dateRangeStart.format("YYYY-MM-DD")}
                onChange={(e) => handleDateChange("dateRangeStart", dayjs(e.target.value))}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Bitiş Tarihi")}</CFormLabel>
              <CFormInput
                type="date"
                value={formData.dateRangeEnd.format("YYYY-MM-DD")}
                onChange={(e) => handleDateChange("dateRangeEnd", dayjs(e.target.value))}
                className="mb-3"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Müşteri")}</CFormLabel>
              <CFormSelect
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.unvani}>
                    {convertTurkishChars(customer.unvani)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Ürün / Hizmet")}</CFormLabel>
              <CFormSelect
                name="productService"
                value={formData.productService}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.adi}>
                    {convertTurkishChars(product.adi)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Satış Kanalı")}</CFormLabel>
              <CFormSelect
                name="salesChannel"
                value={formData.salesChannel}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                {SALES_CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.adi}>
                    {convertTurkishChars(channel.adi)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormLabel>{convertTurkishChars("Karşılaştırma Dönemi")}</CFormLabel>
              <CFormSelect
                name="comparePeriod"
                value={formData.comparePeriod}
                onChange={handleChange}
                className="mb-3"
              >
                <option value="">{convertTurkishChars("Seçiniz")}</option>
                <option value="month">{convertTurkishChars("Geçen Ay")}</option>
                <option value="year">{convertTurkishChars("Geçen Yıl")}</option>
              </CFormSelect>
            </CCol>
          </CRow>

          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}
        </ReportForm>
      </CCardBody>
    </CCard>
  );
};

export default SimpleSalesReport;