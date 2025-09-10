import { useState } from "react";
import { CFormLabel, CFormInput, CButton } from "@coreui/react";

const Images = ({ formData, handleImageUpload, handleImageRemove }) => {
  const [selectedImage, setSelectedImage] = useState(null);

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
    marginBottom: "0.5rem",
    color: "#495057",
    display: "block",
  };

  const inputStyle = {
    fontSize: "0.9rem",
    padding: "0.4rem 0.75rem",
    borderRadius: "0.375rem",
    border: "1px solid #ced4da",
    backgroundColor: "#fff",
    marginBottom: "1rem",
  };

  const sectionTitleStyle = {
    fontSize: "0.95rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#2c3e50",
    borderBottom: "2px solid #3498db",
    paddingBottom: "0.5rem",
  };

  const imageContainerStyle = {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginTop: "1rem",
  };

  const imageStyle = {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "0.375rem",
    border: "1px solid #dee2e6",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  const selectedImageStyle = {
    ...imageStyle,
    border: "2px solid #3498db",
    boxShadow: "0 0 0 3px rgba(52, 152, 219, 0.3)",
  };

  const emptyStateStyle = {
    textAlign: "center",
    padding: "2rem",
    color: "#6c757d",
    fontStyle: "italic",
    backgroundColor: "#fff",
    borderRadius: "0.375rem",
    border: "1px dashed #dee2e6",
  };

  const previewContainerStyle = {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "0.5rem",
    border: "1px solid #dee2e6",
  };

  const previewImageStyle = {
    maxWidth: "100%",
    maxHeight: "300px",
    borderRadius: "0.375rem",
    border: "1px solid #dee2e6",
  };

  const buttonStyle = {
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    marginTop: "0.5rem",
  };

  return (
    <div style={containerStyle}>
      <div style={sectionTitleStyle}>Ürün Resimleri</div>

      <div>
        <CFormLabel style={labelStyle}>Resim Ekle</CFormLabel>
        <CFormInput
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          style={{ ...inputStyle, color: "#000000" }}
        />
      </div>

      {formData.images && formData.images.length > 0 ? (
        <>
          <div style={imageContainerStyle}>
            {formData.images.map((img, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img
                  src={img}
                  alt={`Ürün resmi ${index + 1}`}
                  style={
                    selectedImage === index ? selectedImageStyle : imageStyle
                  }
                  onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow =
                      selectedImage === index
                        ? "0 0 0 3px rgba(52, 152, 219, 0.3)"
                        : "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                  onClick={() => setSelectedImage(index)}
                />
                <CButton
                  color="danger"
                  size="sm"
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    padding: 0,
                  }}
                  onClick={() => handleImageRemove(index)}
                >
                  &times;
                </CButton>
              </div>
            ))}
          </div>

          {selectedImage !== null && (
            <div style={previewContainerStyle}>
              <h6 style={{ marginBottom: "0.75rem", color: "#495057" }}>
                Büyük Ön İzleme
              </h6>
              <div style={{ textAlign: "center" }}>
                <img
                  src={formData.images[selectedImage]}
                  alt={`Büyük ön izleme ${selectedImage + 1}`}
                  style={previewImageStyle}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1rem",
                }}
              >
                <CButton
                  color="primary"
                  size="sm"
                  style={buttonStyle}
                  onClick={() => setSelectedImage(null)}
                >
                  Ön İzlemeyi Kapat
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  style={buttonStyle}
                  onClick={() => {
                    handleImageRemove(selectedImage);
                    setSelectedImage(null);
                  }}
                >
                  Bu Resmi Sil
                </CButton>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={emptyStateStyle}>
          <p>Henüz hiç resim eklenmemiş</p>
          <small>Yukarıdaki alandan resim yükleyebilirsiniz</small>
        </div>
      )}
    </div>
  );
};

export default Images;