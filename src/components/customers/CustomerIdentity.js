import { CFormLabel, CFormInput, CRow, CCol, CImage } from "@coreui/react";

const CustomerIdentity = ({ formData, handleChange, handleImageUpload }) => {
  return (
    <CRow>
      <CCol className="">
        <CFormLabel>İsim/Unvan</CFormLabel>
        <CFormInput
          name="unvani"
          value={formData.unvani ?? ""}
          onChange={handleChange}
          required
          className="mb-3"
        />
      </CCol>
      <CCol>
        <CFormLabel>Resim Ekle</CFormLabel>
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
          {formData.fotograf ? (
            <CImage
              src={formData.fotograf}
              alt="Müşteri resmi"
              className="w-100 h-100 object-fit-cover"
              onError={(e) => {
                e.target.src = "";
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-secondary">
              Fotoğraf Yükle
            </div>
          )}
          <div
            className="photo-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-50"
            style={{ opacity: 0, transition: "opacity 0.3s ease" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              fill="#fff"
              viewBox="0 0 24 24"
              className="bg-dark rounded-circle p-2"
            >
              <path
                d="M12 4v16m-8-8h16"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span
              className="text-white mt-2 fw-bold"
              style={{ fontSize: "14px" }}
            >
              Fotoğrafı Düzenle
            </span>
          </div>
        </div>
        <CFormInput
          type="file"
          id="fotograf"
          accept="image/*"
          onChange={(e) => handleImageUpload(e)}
          style={{ display: "none" }}
        />
        <style>
          {`
            .photo-overlay { opacity: 0; }
            .border-dashed:hover .photo-overlay { opacity: 1; }
          `}
        </style>
      </CCol>
    </CRow>
  );
};

export default CustomerIdentity;
