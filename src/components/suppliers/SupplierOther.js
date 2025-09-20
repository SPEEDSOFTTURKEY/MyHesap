import { useState, useEffect } from "react";
import {
  CFormLabel,
  CFormInput,
  CFormSelect,
  CRow,
  CCol,
  CFormTextarea,
} from "@coreui/react";
import api from "../../api/api";

// API Base URL
const API_BASE_URL = "https://localhost:44375/api";

const SupplierOther = ({ formData, handleChange, errors = {}, setErrors }) => {
  const [classifications, setClassifications] = useState([]);

  const fetchClassifications = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/tedarikciSiniflandirma/get-all`
      );
      setClassifications(data.filter((item) => item.durumu === 1));
    } catch (err) {
      console.error("Sınıflandırmalar yüklenemedi:", err);
      setErrors((prev) => ({
        ...prev,
        tedarikciSiniflandirmaId: "Sınıflandırmalar yüklenemedi.",
      }));
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, []);

  return (
    <CRow>
      <CCol>
        <CFormLabel>Sınıflandırma</CFormLabel>
        <CFormSelect
          name="tedarikciSiniflandirmaId"
          value={formData.tedarikciSiniflandirmaId || ""}
          onChange={handleChange}
          className="mb-3"
        >
          <option value="">Sınıflandırma Seç</option>
          {classifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.adi}
            </option>
          ))}
        </CFormSelect>
        <CFormLabel>Muhasebe/Barkod Kodu</CFormLabel>
        <CFormInput
          name="kodu"
          value={formData.kodu || ""}
          onChange={handleChange}
          className="mb-3"
        />
      </CCol>
      <CCol>
        <CFormLabel>Not</CFormLabel>
        <CFormTextarea
          name="aciklama"
          rows={4}
          value={formData.aciklama || ""}
          onChange={handleChange}
          className="mb-3"
        />
      </CCol>
    </CRow>
  );
};

export default SupplierOther;