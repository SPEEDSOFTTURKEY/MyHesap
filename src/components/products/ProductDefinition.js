import { useState, useEffect } from "react";
import { CFormLabel, CFormInput, CFormSelect, CRow, CCol } from "@coreui/react";
import api from "../../api/api";

const API_BASE_URL = "https://speedsofttest.com/api";

const ProductDefinition = ({ formData, handleChange, refreshTrigger }) => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [depolar, setDepolar] = useState([]); // New state for warehouses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (url, setData) => {
    try {
      setLoading(true);
      const { data } = await api.get(url);
      setData(data.filter((item) => item.durumu === 1));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = () => {
    fetchData(`${API_BASE_URL}/urunKategori/get-all`, setCategories);
    fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
    fetchData(`${API_BASE_URL}/urunRaf/get-all`, setShelves);
    fetchData(`${API_BASE_URL}/depo/get-all`, setDepolar); // Fetch warehouses
  };

  // Component ilk yüklendiğinde çalışır
  useEffect(() => {
    fetchAllData();
  }, []);

  // refreshTrigger değiştiğinde kategoriler, markalar ve depolar yeniden yüklenir
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchData(`${API_BASE_URL}/urunKategori/get-all`, setCategories);
      fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
      fetchData(`${API_BASE_URL}/depo/get-all`, setDepolar); // Refresh warehouses
    }
  }, [refreshTrigger]);

  // Stil tanımlamaları
  const containerStyle = {
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "0.5rem",
    border: "1px solid #dee2e6",
    marginBottom: "1rem",
  };

  const labelStyle = {
    fontSize: "0.85rem",
    fontWeight: "600",
    marginBottom: "0.35rem",
    color: "#495057",
  };

  const inputStyle = {
    fontSize: "0.9rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "0.375rem",
    border: "1px solid #ced4da",
    backgroundColor: "#fff",
    color: "#000000", // Text color set to black
    height: "38px",
  };

  const selectStyle = {
    ...inputStyle,
    backgroundImage:
      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "16px 12px",
    paddingRight: "2.5rem",
    color: "#000000", // Text color set to black
  };

  const sectionTitleStyle = {
    fontSize: "0.95rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#2c3e50",
    borderBottom: "2px solid #3498db",
    paddingBottom: "0.5rem",
  };

  const errorStyle = {
    fontSize: "0.8rem",
    color: "#dc3545",
    marginTop: "0.25rem",
  };

  return (
    <div style={containerStyle}>
      <div style={sectionTitleStyle}>Ürün Tanımı</div>

      <CRow>
        <CCol md="6">
          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ürün Adı</CFormLabel>
            <CFormInput
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Ürün adını giriniz"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Satış Birimi</CFormLabel>
            <CFormSelect
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="Adet">Adet</option>
              <option value="Kilo">Kilo</option>
              <option value="Cm">Cm</option>
              <option value="Deste">Deste</option>
              <option value="Galon">Galon</option>
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ürün Tipi</CFormLabel>
            <CFormSelect
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="Stoklu">Stoklu</option>
              <option value="Stoksuz">Stoksuz</option>
            </CFormSelect>
          </div>
        </CCol>

        <CCol md="6">
          <div className="mb-3">
            <CFormLabel style={labelStyle}>Kategori</CFormLabel>
            <CFormSelect
              name="categoryId"
              value={formData.categoryId || ""}
              onChange={handleChange}
              style={selectStyle}
              disabled={loading}
            >
              <option value="">Kategori Seçiniz</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.adi}
                </option>
              ))}
            </CFormSelect>
            {error && <div style={errorStyle}>{error}</div>}
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Marka</CFormLabel>
            <CFormSelect
              name="brandId"
              value={formData.brandId || ""}
              onChange={handleChange}
              style={selectStyle}
              disabled={loading}
            >
              <option value="">Marka Seçiniz</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.adi}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Raf Yeri</CFormLabel>
            <CFormSelect
              name="shelfId"
              value={formData.shelfId || ""}
              onChange={handleChange}
              style={selectStyle}
              disabled={loading}
            >
              <option value="">Raf Seçiniz</option>
              {shelves.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.adi}
                </option>
              ))}
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Depo</CFormLabel>
            <CFormSelect
              name="depoId"
              value={formData.depoId || ""}
              onChange={handleChange}
              style={selectStyle}
              disabled={loading}
            >
              <option value="">Depo Seçiniz</option>
              {depolar.map((depo) => (
                <option key={depo.id} value={depo.id}>
                  {depo.adi}
                </option>
              ))}
            </CFormSelect>
            {error && <div style={errorStyle}>{error}</div>}
          </div>
        </CCol>
      </CRow>
    </div>
  );
};

export default ProductDefinition;