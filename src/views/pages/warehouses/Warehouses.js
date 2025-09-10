import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastBody,
  CToastHeader,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus } from "@coreui/icons";
import WarehouseTable from "../../../components/warehouses/WarehouseTable";
import WarehouseModal from "../../../components/warehouses/WarehouseModal";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const toaster = useRef();
  const navigate = useNavigate();

  const addToast = (message, type = "success") => {
    const id = Date.now();
    const toast = (
      <CToast
        key={id}
        autohide={true}
        visible={true}
        delay={5000}
        className={
          type === "error" ? "bg-danger text-white" : "bg-success text-white"
        }
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `${API_BASE_URL}/depo/get-all`,
      );
      const result = Array.isArray(data)
        ? data.filter((item) => item.durumu === 1)
        : [];
      setWarehouses(result);
    } catch (err) {
      addToast(err.response?.data?.message || "Depolar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddWarehouse = async (formData) => {
    try {
      setLoading(true);
      const payload = { adi: formData.adi, durumu: 1 };
      const { data } = await api.post(
        `${API_BASE_URL}/depo/create`,
        payload,
      );
      setWarehouses((prev) => [...prev, data]);
      setShowModal(false);
      addToast("Depo başarıyla eklendi.", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Depo eklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseClick = (warehouse) => {
    navigate(`/app/warehouse-detail/${warehouse.id}`, { state: { warehouse } });
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>
      <div className="d-flex gap-2 mb-3">
        <CButton
          color="success"
          className="text-light"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          <CIcon icon={cilPlus} size="m" /> Yeni Depo Ekle
        </CButton>
      </div>

      {loading && (
        <CCard className="mb-3">
          <CCardBody>Yükleniyor...</CCardBody>
        </CCard>
      )}

      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
        >
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Depolar</span>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                color: "#2965A8",
                padding: "5px 10px",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "14px",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              Toplam Depo: {warehouses.length}
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <p>Bir depoya tıklayarak detaylarını görüntüleyebilirsiniz.</p>
          <WarehouseTable
            warehouses={warehouses}
            onWarehouseClick={handleWarehouseClick}
          />
        </CCardBody>
      </CCard>

      <WarehouseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddWarehouse}
        loading={loading}
      />
    </>
  );
};

export default Warehouses;
