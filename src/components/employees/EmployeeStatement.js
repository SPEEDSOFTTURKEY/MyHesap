import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CRow,
  CCol,
  CFormLabel,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilArrowLeft } from "@coreui/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "../../api/api";
import DatePickerField from "./DatePickerField";
import { useEmployees } from "../../context/EmployeesContext";

const API_BASE_URL = "https://speedsofttest.com/api";

const EmployeeStatement = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { fetchEmployeeBalance, selectedEmployee, employees } = useEmployees();
  const employee = state?.employee || {};
  const employeeId = employee?.id;
  const currency = employee?.paraBirimi || "TRY";

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [totals, setTotals] = useState({
    totalDebt: 0,
    totalCredit: 0,
    totalBalance: 0,
  });
  const [employeeName, setEmployeeName] = useState(
    selectedEmployee?.adiSoyadi || employee?.adiSoyadi || "Bilinmeyen Çalışan"
  );

  const getMainCategoryName = (transaction) => {
    return transaction?.masrafAltKategori?.masrafAnaKategori?.adi || "-";
  };

  const getSubCategoryName = (transaction) => {
    return transaction?.masrafAltKategori?.adi || "-";
  };

  const getEmployeeName = (id) => {
    if (!id) return "-";
    const emp = employees.find((e) => e.id === id);
    return emp?.adiSoyadi || "-";
  };

  const fetchTransactions = async (id) => {
    if (!id) {
      setError("Çalışan ID'si eksik.");
      setTransactions([]);
      setFilteredTransactions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const startDate = dateRange.startDate
        ? dateRange.startDate.format("YYYY-MM-DD")
        : null;
      const endDate = dateRange.endDate
        ? dateRange.endDate.format("YYYY-MM-DD")
        : null;

      const response = await api.get(`${API_BASE_URL}/calisancari/calisancari-get-all`, {
        headers: { accept: "*/*" },
        params: {
          employeeId: id,
          startDate: startDate,
          endDate: endDate,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      const formattedData = data.map((transaction) => ({
        id: transaction.id,
        tarih: transaction.tarih || null,
        aciklama: transaction.aciklama || "-",
        borc: transaction.borc || 0,
        alacak: transaction.alacak || 0,
        bakiye: transaction.bakiye || 0,
        calisan: getEmployeeName(transaction.calisanId),
        masrafAnaKategoriAdi: getMainCategoryName(transaction),
        masrafAltKategoriAdi: getSubCategoryName(transaction),
      }));

      setTransactions(formattedData);
      setFilteredTransactions(formattedData);
      setError(
        formattedData.length === 0
          ? "Seçilen tarih aralığında işlem bulunmamaktadır."
          : null
      );

      const totalDebt = formattedData.reduce((sum, t) => sum + (t.borc || 0), 0);
      const totalCredit = formattedData.reduce((sum, t) => sum + (t.alacak || 0), 0);
      const totalBalance =
        formattedData.length > 0
          ? formattedData[formattedData.length - 1].bakiye
          : totalCredit - totalDebt;

      setTotals({ totalDebt, totalCredit, totalBalance });
      fetchEmployeeBalance(id);
    } catch (err) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Cari işlemler hatası:", {
        message: errorMessage,
        status: status,
        url: err.config?.url,
        params: err.config?.params,
      });
      setError(
        status === 404
          ? `Çalışan ID ${id} için cari işlem bulunamadı.`
          : `Cari işlemler alınamadı: ${errorMessage}`
      );
      setTransactions([]);
      setFilteredTransactions([]);
      setTotals({ totalDebt: 0, totalCredit: 0, totalBalance: 0 });
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    let filtered = transactions;
    if (dateRange.startDate && dateRange.endDate) {
      filtered = transactions.filter((transaction) => {
        const transactionDate = dayjs(transaction.tarih);
        return (
          transactionDate.isSameOrAfter(dateRange.startDate, "day") &&
          transactionDate.isSameOrBefore(dateRange.endDate, "day")
        );
      });
    }
    setFilteredTransactions(filtered);

    const totalDebt = filtered.reduce((sum, t) => sum + (t.borc || 0), 0);
    const totalCredit = filtered.reduce((sum, t) => sum + (t.alacak || 0), 0);
    const totalBalance =
      filtered.length > 0
        ? filtered[filtered.length - 1].bakiye
        : totalCredit - totalDebt;

    setTotals({ totalDebt, totalCredit, totalBalance });
    if (employeeId) {
      fetchEmployeeBalance(employeeId);
    }
  };

  const exportToExcel = () => {
    try {
      const wsData = filteredTransactions.map((transaction) => ({
        Tarih: transaction.tarih
          ? dayjs(transaction.tarih).format("DD.MM.YYYY")
          : "-",
        Çalışan: transaction.calisan,
        "Ana Kategori": transaction.masrafAnaKategoriAdi,
        "Alt Kategori": transaction.masrafAltKategoriAdi,
        Açıklama: transaction.aciklama,
        Borç: transaction.borc
          ? `${transaction.borc.toLocaleString("tr-TR")} ${currency}`
          : "-",
        Alacak: transaction.alacak
          ? `${transaction.alacak.toLocaleString("tr-TR")} ${currency}`
          : "-",
        Bakiye: transaction.bakiye
          ? `${transaction.bakiye.toLocaleString("tr-TR")} ${currency}`
          : "-",
      }));

      wsData.push({
        Tarih: "Toplam",
        Çalışan: "",
        "Ana Kategori": "",
        "Alt Kategori": "",
        Açıklama: "",
        Borç: `${totals.totalDebt.toLocaleString("tr-TR")} ${currency}`,
        Alacak: `${totals.totalCredit.toLocaleString("tr-TR")} ${currency}`,
        Bakiye: `${totals.totalBalance.toLocaleString("tr-TR")} ${currency}`,
      });

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hesap Ekstresi");

      XLSX.writeFile(wb, `${employeeName}_Hesap_Ekstresi.xlsx`, {
        bookType: "xlsx",
        type: "binary",
      });
    } catch (err) {
      console.error("Excel dışa aktarma hatası:", err);
      setError("Excel dosyası oluşturulurken hata oluştu.");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      doc.text(`Hesap Ekstresi - ${employeeName}`, 14, 20);

      if (dateRange.startDate && dateRange.endDate) {
        doc.text(
          `Tarih Aralığı: ${dayjs(dateRange.startDate).format("DD.MM.YYYY")} - ${dayjs(
            dateRange.endDate
          ).format("DD.MM.YYYY")}`,
          14,
          30
        );
      }

      const tableData = filteredTransactions.map((transaction) => [
        transaction.tarih ? dayjs(transaction.tarih).format("DD.MM.YYYY") : "-",
        transaction.calisan,
        transaction.masrafAnaKategoriAdi,
        transaction.masrafAltKategoriAdi,
        transaction.aciklama,
        transaction.borc
          ? `${transaction.borc.toLocaleString("tr-TR")} ${currency}`
          : "-",
        transaction.alacak
          ? `${transaction.alacak.toLocaleString("tr-TR")} ${currency}`
          : "-",
        transaction.bakiye
          ? `${transaction.bakiye.toLocaleString("tr-TR")} ${currency}`
          : "-",
      ]);

      tableData.push([
        "Toplam",
        "",
        "",
        "",
        "",
        `${totals.totalDebt.toLocaleString("tr-TR")} ${currency}`,
        `${totals.totalCredit.toLocaleString("tr-TR")} ${currency}`,
        `${totals.totalBalance.toLocaleString("tr-TR")} ${currency}`,
      ]);

      doc.autoTable({
        startY: 40,
        head: [
          [
            "Tarih",
            "Çalışan",
            "Ana Kategori",
            "Alt Kategori",
            "Açıklama",
            "Borç",
            "Alacak",
            "Bakiye",
          ],
        ],
        body: tableData,
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fillColor: [41, 101, 168], textColor: [255, 255, 255] },
      });

      doc.save(`${employeeName}_Hesap_Ekstresi.pdf`);
    } catch (err) {
      console.error("PDF dışa aktarma hatası:", err);
      setError("PDF dosyası oluşturulurken hata oluştu.");
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchTransactions(employeeId);
      setEmployeeName(
        selectedEmployee?.adiSoyadi || employee?.adiSoyadi || "Bilinmeyen Çalışan"
      );
    } else {
      setError("Çalışan bilgisi eksik.");
      navigate("/app/employee-detail");
    }
  }, [employeeId, navigate, selectedEmployee, employee]);

  useEffect(() => {
    applyDateFilter();
  }, [dateRange.startDate, dateRange.endDate, transactions]);

  return (
    <>
      <CButton
        color="secondary"
        className="text-white my-2"
        onClick={() => navigate(-1)}
      >
        <CIcon icon={cilArrowLeft} /> Geri Dön
      </CButton>
      <CCard className="mt-2">
        <CCardHeader
          className="pt-3"
          style={{ backgroundColor: "#2965A8", color: "#ffffff" }}
        >
          <CRow className="align-items-center">
            <CCol xs={8} className="text-start">
              <h5>{employeeName} Hesap Ekstresi</h5>
            </CCol>
            <CCol xs={4}></CCol>
          </CRow>
        </CCardHeader>
        <CCardBody>
          <CRow className="mb-3 align-items-end">
            <CCol md={3}>
              <CFormLabel>Başlangıç Tarihi</CFormLabel>
              <DatePickerField
                value={dateRange.startDate}
                onChange={(newValue) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: newValue,
                  }))
                }
              />
            </CCol>
            <CCol md={3}>
              <CFormLabel>Bitiş Tarihi</CFormLabel>
              <DatePickerField
                value={dateRange.endDate}
                onChange={(newValue) =>
                  setDateRange((prev) => ({
                    ...prev,
                    endDate: newValue,
                  }))
                }
              />
            </CCol>
            <CCol md={6} className="text-end">
              <CButton
                color="success"
                className="text-white me-2"
                onClick={exportToExcel}
                disabled={filteredTransactions.length === 0}
              >
                Excel'e Aktar
              </CButton>
              <CButton
                color="danger"
                className="text-white"
                onClick={exportToPDF}
                disabled={filteredTransactions.length === 0}
              >
                PDF'e Aktar
              </CButton>
            </CCol>
          </CRow>
          {loading && <p className="text-center">Yükleniyor...</p>}
          {!loading && !error && filteredTransactions.length > 0 ? (
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Tarih</CTableHeaderCell>
                  <CTableHeaderCell>Çalışan</CTableHeaderCell>
                  <CTableHeaderCell>Ana Kategori</CTableHeaderCell>
                  <CTableHeaderCell>Alt Kategori</CTableHeaderCell>
                  <CTableHeaderCell>Açıklama</CTableHeaderCell>
                  <CTableHeaderCell>Borç</CTableHeaderCell>
                  <CTableHeaderCell>Alacak</CTableHeaderCell>
                  <CTableHeaderCell>Bakiye</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredTransactions.map((transaction) => (
                  <CTableRow key={transaction.id}>
                    <CTableDataCell>
                      {transaction.tarih
                        ? dayjs(transaction.tarih).format("DD.MM.YYYY")
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>{transaction.calisan}</CTableDataCell>
                    <CTableDataCell>{transaction.masrafAnaKategoriAdi}</CTableDataCell>
                    <CTableDataCell>{transaction.masrafAltKategoriAdi}</CTableDataCell>
                    <CTableDataCell>{transaction.aciklama}</CTableDataCell>
                    <CTableDataCell>
                      {transaction.borc
                        ? `${transaction.borc.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.alacak
                        ? `${transaction.alacak.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.bakiye
                        ? `${transaction.bakiye.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                  </CTableRow>
                ))}
                <CTableRow style={{ fontWeight: "bold" }}>
                  <CTableDataCell>Toplam</CTableDataCell>
                  <CTableDataCell></CTableDataCell>
                  <CTableDataCell></CTableDataCell>
                  <CTableDataCell></CTableDataCell>
                  <CTableDataCell></CTableDataCell>
                  <CTableDataCell>
                    {totals.totalDebt
                      ? `${totals.totalDebt.toLocaleString("tr-TR")} ${currency}`
                      : "-"}
                  </CTableDataCell>
                  <CTableDataCell>
                    {totals.totalCredit
                      ? `${totals.totalCredit.toLocaleString("tr-TR")} ${currency}`
                      : "-"}
                  </CTableDataCell>
                  <CTableDataCell>
                    {totals.totalBalance
                      ? `${totals.totalBalance.toLocaleString("tr-TR")} ${currency}`
                      : "-"}
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          ) : (
            !loading &&
            !error && (
              <p className="text-center">
                Seçilen tarih aralığında işlem bulunmamaktadır.
              </p>
            )
          )}
          {error && <p className="text-danger text-center">{error}</p>}
        </CCardBody>
      </CCard>
    </>
  );
};

export default EmployeeStatement;