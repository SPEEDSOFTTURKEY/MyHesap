import { useState, useEffect } from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CButton,
  CImage,
  CRow,
  CCol,
} from "@coreui/react";
import { IMaskInput } from "react-imask";
import dayjs from "dayjs";
import DatePickerField from "./DatePickerField";

const EmployeeForm = ({ employee, onSubmit, onCancel, onDelete }) => {
  useEffect(() => {
    console.log("Employee prop:", employee);
  }, [employee]);

  const [formData, setFormData] = useState({
    adiSoyadi: employee?.adiSoyadi || "",
    emailName: employee?.email ? employee.email.split("@")[0] : "",
    emailDomain: employee?.email
      ? employee.email.split("@")[1] || "gmail.com"
      : "gmail.com",
    telefon: employee?.telefon || "",
    paraBirimi: employee?.paraBirimi || "TRY",
    maas: employee?.maas || "",
    hesapNo: employee?.hesapNo || "",
    departman: employee?.departman || "",
    adres: employee?.adres || "",
    tc: employee?.tc || "",
    notlar: employee?.notlar || "",
  });
  const [girisTarihi, setGirisTarihi] = useState(
    employee?.girisTarihi ? dayjs(employee.girisTarihi) : null
  );
  const [cikisTarihi, setCikisTarihi] = useState(
    employee?.cikisTarihi ? dayjs(employee.cikisTarihi) : null
  );
  const [dogumTarihi, setDogumTarihi] = useState(
    employee?.dogumTarihi ? dayjs(employee.dogumTarihi) : null
  );
  const [file, setFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const BASE_PHOTO_URL = "https://speedsofttest.com";

  const getPhotoUrl = (foto) => {
    console.log("getPhotoUrl called with foto:", foto);
    if (!foto || typeof foto !== "string") return null;
    if (foto.startsWith("http")) return foto;
    const normalizedFoto = foto.startsWith("/") ? foto : `/${foto}`;
    return `${BASE_PHOTO_URL}${normalizedFoto}`;
  };

  useEffect(() => {
    if (employee?.fotograf) {
      const url = getPhotoUrl(employee.fotograf);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  }, [employee]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.adiSoyadi.trim()) newErrors.adiSoyadi = "Ad Soyad zorunlu";
    if (!formData.tc.trim()) newErrors.tc = "T.C. Kimlik Numarası zorunlu";
    if (!formData.emailName.trim()) newErrors.emailName = "E-posta zorunlu";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const employeeData = {
      ...formData,
      email: `${formData.emailName}@${formData.emailDomain}`,
      dogumTarihi:
        dogumTarihi && dayjs.isDayjs(dogumTarihi)
          ? dogumTarihi.toISOString()
          : "",
      girisTarihi:
        girisTarihi && dayjs.isDayjs(girisTarihi)
          ? girisTarihi.toISOString()
          : "",
      cikisTarihi:
        cikisTarihi && dayjs.isDayjs(cikisTarihi)
          ? cikisTarihi.toISOString()
          : "",
      fotograf: file || employee?.fotograf || null,
    };
    console.log("Submitting employee data:", employeeData);
    onSubmit(employeeData);
  };

  return (
    <CForm onSubmit={handleSubmit}>
      <CRow>
        <CCol xs={6}>
          <CCard
            className="shadow-sm border-primary"
            style={{ minHeight: "600px" }}
          >
            <CCardHeader
              style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}
            >
              ÇALIŞAN BİLGİLERİ
            </CCardHeader>
            <CCardBody style={{ padding: "2rem" }}>
              <div className="mb-4">
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
                  {photoPreview ? (
                    <CImage
                      src={photoPreview}
                      alt="Çalışan Fotoğrafı"
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => {
                        console.log("CImage error:", e);
                        e.target.src = "";
                        e.target.style.display = "none";
                        setPhotoPreview(null);
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
                  name="fotograf"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <style>
                  {`
                    .photo-overlay { opacity: 0; }
                    .border-dashed:hover .photo-overlay { opacity: 1; }
                  `}
                </style>
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="adiSoyadi">Ad Soyad</CFormLabel>
                <CFormInput
                  id="adiSoyadi"
                  name="adiSoyadi"
                  value={formData.adiSoyadi}
                  onChange={handleChange}
                  invalid={!!errors.adiSoyadi}
                  feedbackInvalid={errors.adiSoyadi}
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="emailName">E-Posta</CFormLabel>
                <div className="input-group d-flex align-items-center mb-3">
                  <CFormInput
                    id="emailName"
                    name="emailName"
                    value={formData.emailName}
                    onChange={handleChange}
                    invalid={!!errors.emailName}
                    feedbackInvalid={errors.emailName}
                    className="w-40 me-2"
                  />
                  <span className="input-group-text mx-2">@</span>
                  <CFormSelect
                    id="emailDomain"
                    name="emailDomain"
                    value={formData.emailDomain}
                    onChange={handleChange}
                    className="w-40"
                  >
                    <option value="gmail.com">gmail.com</option>
                    <option value="hotmail.com">hotmail.com</option>
                    <option value="outlook.com">outlook.com</option>
                    <option value="windowslive.com">windowslive.com</option>
                    <option value="icloud.com">icloud.com</option>
                    <option value="yahoo.com">yahoo.com</option>
                  </CFormSelect>
                </div>
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="tc">T.C. Kimlik Numarası</CFormLabel>
                <IMaskInput
                  mask="00000000000"
                  id="tc"
                  name="tc"
                  value={formData.tc}
                  onAccept={(value) =>
                    handleChange({ target: { name: "tc", value } })
                  }
                  placeholder="11 haneli sayı girin"
                  className={`form-control mb-3 ${errors.tc ? "is-invalid" : ""}`}
                />
                {errors.tc && (
                  <CFormFeedback invalid>{errors.tc}</CFormFeedback>
                )}

              </div>

              <div className="mb-3">
                <CFormLabel htmlFor="telefon">Telefon</CFormLabel>
                <IMaskInput
                  mask="(500) 000 00 00"
                  id="telefon"
                  name="telefon"
                  value={formData.telefon}
                  onAccept={(value) =>
                    handleChange({ target: { name: "telefon", value } })
                  }
                  placeholder="(5XX) XXX XX XX"
                  className="form-control mb-3"
                />
              </div>
              <DatePickerField
                label="Doğum Tarihi"
                value={dogumTarihi}
                onChange={setDogumTarihi}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={6}>
          <CCard
            className="shadow-sm border-success"
            style={{ minHeight: "600px" }}
          >
            <CCardHeader
              style={{ backgroundColor: "#4DAD4A", color: "#FFFFFF" }}
            >
              DİĞER BİLGİLER
            </CCardHeader>
            <CCardBody style={{ padding: "2rem" }}>
              <div className="mb-3">
                <CFormLabel htmlFor="paraBirimi">Cari Para Birimi</CFormLabel>
                <CFormSelect
                  id="paraBirimi"
                  name="paraBirimi"
                  value={formData.paraBirimi}
                  onChange={handleChange}
                  className="mb-3"
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </CFormSelect>
              </div>
              <DatePickerField
                label="İşe Giriş Tarihi"
                value={girisTarihi}
                onChange={setGirisTarihi}
              />
              <DatePickerField
                label="İşten Ayrılış Tarihi"
                value={cikisTarihi}
                onChange={setCikisTarihi}
              />
              <div className="mb-3">
                <CFormLabel htmlFor="maas">Aylık Net Maaş</CFormLabel>
                <CFormInput
                  id="maas"
                  name="maas"
                  type="number"
                  value={formData.maas}
                  onChange={handleChange}
                  className="mb-3"
                  step="0.01"
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="hesapNo">
                  Banka Hesap Numarası (IBAN)
                </CFormLabel>
                <IMaskInput
                  mask="TR00 0000 0000 0000 0000 0000 00"
                  id="hesapNo"
                  name="hesapNo"
                  value={formData.hesapNo}
                  onAccept={(value) =>
                    handleChange({ target: { name: "hesapNo", value } })
                  }
                  placeholder="TRXX XXXX XXXX XXXX XXXX XXXX XX"
                  className="form-control mb-3"
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="departman">Departman</CFormLabel>
                <CFormInput
                  id="departman"
                  name="departman"
                  value={formData.departman}
                  onChange={handleChange}
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="adres">Adres</CFormLabel>
                <CFormInput
                  id="adres"
                  name="adres"
                  value={formData.adres}
                  onChange={handleChange}
                  className="mb-3"
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="notlar">Not</CFormLabel>
                <CFormInput
                  id="notlar"
                  name="notlar"
                  type="textarea"
                  rows="4"
                  value={formData.notlar}
                  onChange={handleChange}
                  className="mb-3"
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <CButton color="primary" type="submit">
                  {employee?.id ? "Güncelle" : "Kaydet"}
                </CButton>
                {employee?.id && (
                  <CButton
                    color="danger"
                    style={{ color: "white" }}
                    onClick={onDelete}
                  >
                    Sil
                  </CButton>
                )}
                <CButton color="secondary" onClick={onCancel}>
                  İptal
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CForm>
  );
};

export default EmployeeForm;
