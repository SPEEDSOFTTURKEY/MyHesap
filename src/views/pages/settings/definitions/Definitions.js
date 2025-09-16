import { useEffect, useRef, useState } from "react";
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormLabel,
  CSpinner,
  CForm,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilPencil } from "@coreui/icons";
import api from "../../../../api/api";

const Definitions = () => {
  const [definitions, setDefinitions] = useState({
    urunMarka: [],
    urunKategori: [],
    urunRaf: [],
    musteriSinif1: [],
    musteriSinif2: [],
    tedarikciSinif1: [],
    tedarikciSinif2: [],
    fihristGrup1: [],
    fihristGrup2: [],
  });
  const [selectedDefinition, setSelectedDefinition] = useState(null);
  const [definitionType, setDefinitionType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ adi: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toaster = useRef();
const API_BASE_URL = "https://speedsofttest.com/api";

  const definitionConfigs = [
    { key: "urunMarka", label: "Ürün Markaları", endpoint: `${API_BASE_URL}/urunMarka` },
    {
      key: "urunKategori",
      label: "Ürün Kategorileri",
      endpoint: `${API_BASE_URL}/urunKategori`,
    },
    { key: "urunRaf", label: "Raf Yerleri", endpoint: `${API_BASE_URL}/urunRaf` },
    
  ];

  // "definitionConfigs" İÇERİSİNE EKLENECEK
  // {
  //     key: "musteriSinif1",
  //     label: "Müşteri Sınıflandırması 1",
  //     endpoint: "/api/musteriSinif1",
  //   },
  //   {
  //     key: "musteriSinif2",
  //     label: "Müşteri Sınıflandırması 2",
  //     endpoint: "/api/musteriSinif2",
  //   },
  //   {
  //     key: "tedarikciSinif1",
  //     label: "Tedarikçi Sınıflandırması 1",
  //     endpoint: "/api/tedarikciSinif1",
  //   },
  //   {
  //     key: "tedarikciSinif2",
  //     label: "Tedarikçi Sınıflandırması 2",
  //     endpoint: "/api/tedarikciSinif2",
  //   },
  //   {
  //     key: "fihristGrup1",
  //     label: "Fihrist Grupları 1",
  //     endpoint: "/api/fihristGrup1",
  //   },
  //   {
  //     key: "fihristGrup2",
  //     label: "Fihrist Grupları 2",
  //     endpoint: "/api/fihristGrup2",
  //   },

  const fetchDefinitions = async (config) => {
    setIsLoading(true);
    try {
      const response = await api.get(`${config.endpoint}/get-all`);
      setDefinitions((prev) => ({
        ...prev,
        [config.key]: response.data.filter((item) => item.durumu === 1),
      }));
    } catch (error) {
      console.error(
        `${config.label} çekilirken hata:`,
        error.response?.data || error.message
      );
      setToast({
        message: `${config.label} yüklenirken hata oluştu.`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    definitionConfigs.forEach((config) => fetchDefinitions(config));
  }, []);

  const checkDuplicateName = (name, type, currentId) => {
    return definitions[type].some(
      (item) =>
        item.adi.toLowerCase() === name.toLowerCase() && item.id !== currentId
    );
  };

  const handleDefinitionClick = (definition, type) => {
    setSelectedDefinition(definition);
    setDefinitionType(type);
    setFormData({ adi: definition.adi });
    setShowModal(true);
  };

  const handleAddDefinition = (type) => {
    setSelectedDefinition(null);
    setDefinitionType(type);
    setFormData({ adi: "" });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const config = definitionConfigs.find((c) => c.key === definitionType);
    const currentId = selectedDefinition?.id;
    if (checkDuplicateName(formData.adi, definitionType, currentId)) {
      setToast({
        message: `Bu isimde bir ${config.label.toLowerCase()} zaten mevcut!`,
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        id: selectedDefinition?.id || 0,
        adi: formData.adi,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
      };

      if (selectedDefinition?.id) {
        await api.put(`${config.endpoint}/update`, payload, {
          headers: { "Content-Type": "application/json", accept: "*/*" },
        });
        setToast({
          message: `${formData.adi} ${config.label.toLowerCase()} başarıyla güncellendi.`,
          color: "success",
        });
      } else {
        await api.post(`${config.endpoint}/create`, payload, {
          headers: { "Content-Type": "application/json", accept: "*/*" },
        });
        setToast({
          message: `${formData.adi} ${config.label.toLowerCase()} başarıyla eklendi.`,
          color: "success",
        });
      }
      await fetchDefinitions(config);
      setShowModal(false);
      setFormData({ adi: "" });
    } catch (error) {
      console.error(
        `${config.label} kaydedilirken hata:`,
        error.response?.data || error.message
      );
      setToast({
        message: `${config.label} kaydedilirken hata: ${error.response?.data?.title || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const config = definitionConfigs.find((c) => c.key === definitionType);
      await api.delete(`${config.endpoint}/delete/${selectedDefinition.id}`, {
        headers: { accept: "*/*" },
      });
      await fetchDefinitions(config);
      setToast({
        message: `${selectedDefinition.adi} ${config.label.toLowerCase()} silindi.`,
        color: "success",
      });
      setShowModal(false);
    } catch (error) {
      console.error(
        `${definitionType} silinirken hata:`,
        error.response?.data || error.message
      );
      setToast({
        message: `${config.label} silinirken hata: ${error.response?.data?.title || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toast && (
          <CToast
            autohide={5000}
            visible={!!toast}
            color={toast.color}
            className="text-white shadow-lg"
            onClose={() => setToast(null)}
          >
            <CToastHeader closeButton={{ label: "Kapat" }}>
              <strong className="me-auto">Bildirim</strong>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        )}
      </CToaster>
      {isLoading && <CSpinner color="primary" />}
      <style>
        {`
          @media (prefers-color-scheme: dark) {
            .definition-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color-dark) !important;
            }
            .definition-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .add-button {
              background-color: #E88B22 !important;
              color: #FFFFFF !important;
              border: none !important;
            }
            .add-button:hover {
              background-color: #EB9E3E !important;
            }
            .edit-button:hover {
              background-color: rgba(255, 255, 255, 0.2) !important;
            }
          }
          @media (prefers-color-scheme: light) {
            .definition-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color) !important;
            }
            .definition-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .add-button {
              background-color: #E88B22 !important;
              color: #333333 !important;
              border: none !important;
            }
            .add-button:hover {
              background-color: #EB9E3E !important;
            }
            .edit-button:hover {
              background-color: rgba(255, 255, 255, 0.2) !important;
            }
          }
        `}
      </style>
      <CRow xs={{ gutter: 5 }}>
        {definitionConfigs.map((config) => (
          <CCol sm={6} xl={6} xxl={6} key={config.key}>
            <CCard>
              <CCardHeader className="definition-header">
                {config.label.toUpperCase()}
                <CButton
                  color="warning"
                  size="sm"
                  className="float-end add-button"
                  onClick={() => handleAddDefinition(config.key)}
                >
                  <CIcon icon={cilPlus} size="sm" /> Ekle
                </CButton>
              </CCardHeader>
              <CCardBody className="definition-card-body">
                <div className="d-flex flex-wrap gap-2">
                  {definitions[config.key].map((item) => (
                    <CButton
                      key={item.id}
                      color="info"
                      size="sm"
                      className="text-start px-2 py-1"
                      onClick={() => handleDefinitionClick(item, config.key)}
                    >
                      {item.adi}
                    </CButton>
                  ))}
                  {definitions[config.key].length === 0 && (
                    <p className="text-muted">Kayıt bulunamadı.</p>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
      <CModal
        visible={showModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setShowModal(false)}
      >
        <CModalHeader>
          <CModalTitle>
            {definitionConfigs.find((c) => c.key === definitionType)?.label ||
              "Tanım"}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CFormLabel htmlFor="adi">Tanım Adı</CFormLabel>
            <CFormInput
              id="adi"
              name="adi"
              value={formData.adi}
              onChange={handleInputChange}
              placeholder="Tanım adını girin"
              required
            />
          </CModalBody>
          <CModalFooter>
            {selectedDefinition?.id && (
              <CButton
                color="danger"
                style={{ color: "white" }}
                onClick={handleDelete}
                disabled={isLoading}
              >
                Sil
              </CButton>
            )}
            <CButton type="submit" color="primary" disabled={isLoading}>
              {isLoading ? <CSpinner size="sm" /> : "Kaydet"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => setShowModal(false)}
              disabled={isLoading}
            >
              İptal
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  );
};

export default Definitions;
