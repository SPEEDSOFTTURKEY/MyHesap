import { CFormLabel, CFormInput, CRow, CCol, CImage, CButton } from "@coreui/react";

const SupplierIdentity = ({
  formData,
  handleChange,
  handleImageUpload,
  errors = {},
  setErrors,
}) => {
  return (
    <CRow>
      <CCol>
        <CFormLabel>İsim/Unvan</CFormLabel>
        <CFormInput
          name="unvan"
          value={formData.unvan || ""}
          onChange={(e) => {
            handleChange(e);
            if (setErrors) {
              setErrors((prev) => ({ ...prev, unvan: "" }));
            }
          }}
          required
          className="mb-3"
          invalid={!!errors.unvan}
          feedbackInvalid={errors?.unvan}
        />
      </CCol>
      <CCol>
        <CFormLabel>Resim</CFormLabel>
        <div className="d-flex flex-column align-items-start">
          {formData.fotograf ? (
            <>
              <div className="mb-2 border rounded" style={{ width: "200px", height: "200px" }}>
                <CImage
                  src={formData.fotograf}
                  alt="Tedarikçi resmi"
                  className="w-100 h-100 object-fit-cover"
                  onError={(e) => {
                    e.target.src = "";
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div className="d-flex gap-2">
                <CButton
                  color="primary"
                  onClick={() => document.getElementById("fotograf").click()}
                  size="sm"
                >
                  Resmi Değiştir
                </CButton>
                {formData.fotograf && (
                  <CButton
                    color="danger"
                    size="sm"
                    onClick={() => handleChange({ target: { name: "fotograf", value: null } })}
                  >
                    Resmi Kaldır
                  </CButton>
                )}
              </div>
            </>
          ) : (
            <div
              className="border border-2 border-dashed border-secondary rounded position-relative overflow-hidden"
              style={{
                width: "200px",
                height: "200px",
                cursor: "pointer",
                backgroundColor: "#f8f9fa",
              }}
              onClick={() => document.getElementById("fotograf").click()}
            >
              <div className="d-flex align-items-center justify-content-center h-100 text-secondary">
                Fotoğraf Yükle
              </div>
            </div>
          )}
          <CFormInput
            type="file"
            id="fotograf"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>
      </CCol>
    </CRow>
  );
};

export default SupplierIdentity;