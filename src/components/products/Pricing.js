import {
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
} from "@coreui/react";

const Pricing = ({ formData, handleChange }) => {
  const containerStyle = {
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "0.5rem",
    border: "1px solid #dee2e6",
  };

  const inputStyle = {
    fontSize: "0.85rem",
    padding: "0.25rem 0.5rem",
    height: "32px",
    borderRadius: "0.25rem",
  };

  const labelStyle = {
    fontSize: "0.8rem",
    marginBottom: "2px",
    fontWeight: "600",
    color: "#495057",
  };

  const checkStyle = {
    fontSize: "0.85rem",
    marginBottom: "8px",
    marginTop: "0.5rem",
  };

  const sectionTitleStyle = {
    fontSize: "0.9rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#2c3e50",
    borderBottom: "2px solid #3498db",
    paddingBottom: "0.25rem",
  };

  return (
    <div style={containerStyle}>
      <CRow>
        <CCol md={6}>
          <div style={sectionTitleStyle}>Satış Fiyatlandırması</div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Satış Fiyatı</CFormLabel>
            <div className="d-flex align-items-center">
              <CFormInput
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                required
                className="flex-grow-1 me-2"
                step="0.01"
                style={inputStyle}
                placeholder="0.00"
              />
              <CFormSelect
                name="saleCurrency"
                value={formData.saleCurrency}
                onChange={handleChange}
                style={{ ...inputStyle, width: "80px" }}
              >
                <option value="TRY">TL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </CFormSelect>
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Satış KDV Oranı (%)</CFormLabel>
            <CFormInput
              type="number"
              name="saleVatRate"
              value={formData.saleVatRate}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0"
            />
          </div>
<div className="mb-3">
  <CFormCheck
    name="saleVatIncluded"
    checked={formData.saleVatIncluded}
    onChange={handleChange}
    style={{ color: "rgb(0, 0, 0)" }} // input için
    label={
      <span style={{ color: "black" }}>
        Satış Fiyatına KDV Dahil mi?
      </span>
    }
  />
</div>


          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ö.İ.V. Oranı (%)</CFormLabel>
            <CFormInput
              type="number"
              name="otvRate"
              value={formData.otvRate}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0"
            />
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Ö.T.V. Tipi</CFormLabel>
            <CFormSelect
              name="otvType"
              value={formData.otvType}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="Yok">Yok</option>
              <option value="Tip 1">Tip 1</option>
              <option value="Tip 2">Tip 2</option>
            </CFormSelect>
          </div>
        </CCol>

        <CCol md={6}>
          <div style={sectionTitleStyle}>Alış Fiyatlandırması</div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Alış Fiyatı</CFormLabel>
            <div className="d-flex align-items-center">
              <CFormInput
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                className="flex-grow-1 me-2"
                step="0.01"
                style={inputStyle}
                placeholder="0.00"
              />
              <CFormSelect
                name="purchaseCurrency"
                value={formData.purchaseCurrency || formData.saleCurrency}
                onChange={handleChange}
                style={{ ...inputStyle, width: "80px" }}
              >
                <option value="TRY">TL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </CFormSelect>
            </div>
          </div>

          <div className="mb-3">
            <CFormLabel style={labelStyle}>Alış KDV Oranı (%)</CFormLabel>
            <CFormInput
              type="number"
              name="purchaseVatRate"
              value={formData.purchaseVatRate}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0"
            />
          </div>

<div className="mb-3">
  <CFormCheck
    name="purchaseVatIncluded"
    checked={formData.purchaseVatIncluded}
    onChange={handleChange}
    style={{ color: "rgb(0, 0, 0)" }} // input için
    label={
      <span style={{ color: "black" }}>
        Alış Fiyatına KDV Dahil mi?
      </span>
    }
  />
</div>


          <div className="mb-3">
            <CFormLabel style={labelStyle}>Alış İskontosu (%)</CFormLabel>
            <CFormInput
              type="number"
              name="purchaseDiscount"
              value={formData.purchaseDiscount}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0"
            />
          </div>
        </CCol>
      </CRow>
    </div>
  );
};

export default Pricing;
