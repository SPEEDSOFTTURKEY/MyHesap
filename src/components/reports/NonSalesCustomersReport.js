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
} from "@coreui/react";
import axios from "axios";

const API_BASE_URL = "https://speedsofttest.com/api";

const NonSalesCustomersReport = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNonSalesCustomers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/musteriSatis/satisolmayanmusteri-get-all`);
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

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Satış Olmayan Müşteriler
      </CCardHeader>
      <CCardBody>
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