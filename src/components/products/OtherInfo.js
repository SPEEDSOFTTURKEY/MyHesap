import {
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CFormCheck,
  CRow,
  CCol,
} from "@coreui/react";

const OtherInfo = ({ formData, handleChange }) => {
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
    height: "38px",
  };

  const textareaStyle = {
    ...inputStyle,
    height: "auto",
    minHeight: "80px",
  };

  const checkStyle = {
    fontSize: "0.9rem",
    marginTop: "1rem",
    marginBottom: "1rem",
    color: "#495057",
  };

  const sectionTitleStyle = {
    fontSize: "0.95rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#2c3e50",
    borderBottom: "2px solid #3498db",
    paddingBottom: "0.5rem",
  };

  return (
    <div style={containerStyle}>
      <div style={sectionTitleStyle}>Diğer Bilgiler</div>

      <CRow>
        <CCol>
          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ürün Kodu</CFormLabel>
            <CFormInput
              name="productCode"
              value={formData.productCode}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="Ürün kodunu giriniz"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>GTIP</CFormLabel>
            <CFormInput
              name="gtip"
              value={formData.gtip}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="GTIP kodunu giriniz"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ülke Kodu</CFormLabel>
            <CFormInput
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="Ülke kodunu giriniz"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Fatura Başlığı</CFormLabel>
            <CFormInput
              name="invoiceTitle"
              value={formData.invoiceTitle}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="Faturada görünecek başlık"
            />
          </div>
        </CCol>

        <CCol>
          <div className="mb-3">
            <CFormLabel style={labelStyle}>Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{ ...textareaStyle, color: "#000000" }}
              placeholder="Ürün açıklamasını giriniz"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Barkod</CFormLabel>
            <CFormInput
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="Barkod numarasını giriniz"
            />
          </div>
<div className="mb-3">
  <CFormCheck
    name="trackStock"
    checked={formData.trackStock}
    onChange={handleChange}
    style={{ color: "rgb(0, 0, 0)" }} // input için
    label={
      <span style={{ color: "black" }}>
        Stok Takibi Yapılsın
      </span>
    }
  />
</div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Kritik Stok Miktarı</CFormLabel>
            <CFormInput
              type="number"
              name="criticalStock"
              value={formData.criticalStock}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Etiketler</CFormLabel>
            <CFormInput
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              style={{ ...inputStyle, color: "#000000" }}
              placeholder="Etiketleri virgülle ayırın (ör: test, elektronik)"
            />
          </div>
        </CCol>
      </CRow>
    </div>
  );
};

export default OtherInfo;