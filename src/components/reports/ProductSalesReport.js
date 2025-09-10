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

const convertTurkishChars = (text) => {
  if (!text) return text;
  return text.replace(
    /[ÇçĞğİıÖöŞşÜü]/g,
    (char) => turkishCharMap[char] || char
  );
};

const registerTurkishFont = (doc) => {
  try {
    doc.setFont("times", "normal");
  } catch (error) {
    doc.setFont("helvetica", "normal");
  }
};

const API_BASE_URL = "https://localhost:44375/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

  // Fetch data for dropdowns
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

  // Fetch table data
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
            ? !formData.customer || item.musteri?.unvani === formData.customer
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

  const handleExportPDF = () => {
    if (tableData.length === 0) {
      alert("Rapor için veri bulunamadı!");
      return;
    }
    const selectedData = tableData.filter((item) => selected.includes(item.id));
    if (selectedData.length === 0) {
      alert("Lütfen en az bir satır seçiniz!");
      return;
    }
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      registerTurkishFont(doc);

      doc.setFontSize(18);
      doc.text(
        formData.transactionType === "sales" ? "Ürün Satış Raporu" : "Ürün Alış Raporu",
        doc.internal.pageSize.getWidth() / 2,
        15,
        { align: "center" }
      );

      const head = formData.transactionType === "purchases"
        ? [["ID", "Ürün", "Barkod", "Tarih", "Tedarikçi", "Miktar", "Birim Fiyat", "İndirim (%)", "Toplam", "KDV (%)", "Para Birimi", "Belge No", "Vade Tarih", "Depo"]]
        : [["ID", "Ürün", "Barkod", "Tarih", "Müşteri", "Miktar", "Birim Fiyat", "Toplam"]];

      const body = selectedData.map((item, index) =>
        formData.transactionType === "purchases"
          ? [
              index + 1,
              convertTurkishChars(item.urun?.adi || "-"),
              item.urun?.barkod || "-",
              dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY"),
              convertTurkishChars(item.tedarikci?.unvan || "-"),
              item.miktar || 0,
              item.fiyat || 0,
              item.indirim || 0,
              item.toplam || 0,
              item.kDV || 0,
              item.paraBirimi || "TRY",
              item.belgeNo || "-",
              item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-",
              convertTurkishChars(item.depo?.adi || "-"),
            ]
          : [
              index + 1,
              convertTurkishChars(item.urunAdi || "-"),
              item.barkod || "-",
              dayjs(item.eklenmeTarihi).format("DD/MM/YYYY"),
              convertTurkishChars(item.musteri?.unvani || "-"),
              item.miktar || 0,
              item.fiyat || 0,
              item.toplamFiyat || 0,
            ]
      );

      doc.autoTable({
        startY: 25,
        head,
        body,
        theme: "grid",
        styles: { font: "times", fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 101, 168], textColor: [255, 255, 255], fontStyle: "bold" },
      });

      const pdfOutput = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfOutput);
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("PDF oluşturulamadı!");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) {
      alert("Rapor için veri bulunamadı!");
      return;
    }
    const selectedData = tableData.filter((item) => selected.includes(item.id));
    if (selectedData.length === 0) {
      alert("Lütfen en az bir satır seçiniz!");
      return;
    }
    const data = selectedData.map((item, index) =>
      formData.transactionType === "purchases"
        ? {
            ID: index + 1,
            Ürün: convertTurkishChars(item.urun?.adi || "-"),
            Barkod: item.urun?.barkod || "-",
            Tarih: dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY"),
            Tedarikçi: convertTurkishChars(item.tedarikci?.unvan || "-"),
            Miktar: item.miktar || 0,
            "Birim Fiyat": item.fiyat || 0,
            "İndirim (%)": item.indirim || 0,
            Toplam: item.toplam || 0,
            "KDV (%)": item.kDV || 0,
            "Para Birimi": item.paraBirimi || "TRY",
            "Belge No": item.belgeNo || "-",
            "Vade Tarih": item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-",
            Depo: convertTurkishChars(item.depo?.adi || "-"),
          }
        : {
            ID: index + 1,
            Ürün: convertTurkishChars(item.urunAdi || "-"),
            Barkod: item.barkod || "-",
            Tarih: dayjs(item.eklenmeTarihi).format("DD/MM/YYYY"),
            Müşteri: convertTurkishChars(item.musteri?.unvani || "-"),
            Miktar: item.miktar || 0,
            "Birim Fiyat": item.fiyat || 0,
            Toplam: item.toplamFiyat || 0,
          }
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");
    XLSX.writeFile(workbook, `${formData.transactionType === "sales" ? "Satis_Raporu" : "Alis_Raporu"}.xlsx`);
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
  <option key={user.id} value={formData.transactionType === "sales" ? user.Unvani : user.Unvan}>
    {formData.transactionType === "sales" ? user.unvani : user.unvan}
  </option>
))}

                </CFormSelect>
              </CCol>
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
                onClick={handleExportPDF}
              >
                {loading ? "Yükleniyor..." : "Rapor Hazırla"}
              </CButton>
              <CButton
                color="success"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                disabled={loading}
                onClick={handleExportExcel}
              >
                {loading ? "Yükleniyor..." : "Excel Oluştur"}
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
                      <CTableDataCell className="p-3">{convertTurkishChars(formData.transactionType === "purchases" ? item.urun?.adi || "-" : item.urunAdi || "-")}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "purchases" ? item.urun?.barkod || "-" : item.barkod || "-"}</CTableDataCell>
                      <CTableDataCell className="p-3">{dayjs(item.tarih || item.eklenmeTarihi).format("DD/MM/YYYY")}</CTableDataCell>
                      <CTableDataCell className="p-3">{convertTurkishChars(formData.transactionType === "sales" ? item.musteri?.unvani || "-" : item.tedarikci?.unvan || "-")}</CTableDataCell>
                      <CTableDataCell className="p-3">{item.miktar || 0}</CTableDataCell>
                      <CTableDataCell className="p-3">{item.fiyat || 0}</CTableDataCell>
                      <CTableDataCell className="p-3">{formData.transactionType === "purchases" ? item.toplam || 0 : item.toplamFiyat || 0}</CTableDataCell>
                      {formData.transactionType === "purchases" && (
                        <>
                          <CTableDataCell className="p-3">{item.indirim || 0}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.kDV || 0}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.paraBirimi || "TRY"}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.belgeNo || "-"}</CTableDataCell>
                          <CTableDataCell className="p-3">{item.vadeTarih ? dayjs(item.vadeTarih).format("DD/MM/YYYY") : "-"}</CTableDataCell>
                          <CTableDataCell className="p-3">{convertTurkishChars(item.depo?.adi || "-")}</CTableDataCell>
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