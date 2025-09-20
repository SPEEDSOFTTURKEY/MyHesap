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

const API_BASE_URL = "https://speedsofttest.com/api";

const CustomerOther = ({ formData, handleChange }) => {
  const [classifications, setClassifications] = useState([]);

  const fetchClassifications = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/musteriSiniflandirma/get-all`);
      setClassifications(data); // Durumu filtresi kaldırıldı
    } catch (err) {
      console.error("Sınıflandırmalar yüklenemedi:", err);
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
          name="musteriSiniflandirmaId"
          value={formData.musteriSiniflandirmaId}
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
          value={formData.kodu}
          onChange={handleChange}
          className="mb-3"
        />
      </CCol>
      <CCol>
        <CFormLabel>Not</CFormLabel>
        <CFormTextarea
          name="aciklama"
          rows={4}
          value={formData.aciklama}
          onChange={handleChange}
          className="mb-3"
        />
      </CCol>
    </CRow>
  );
};

export default CustomerOther;