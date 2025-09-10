import { cilSave } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormLabel,
  CFormCheck,
  CRow,
  CToast,
  CToastBody,
  CToaster,
  CToastHeader,
} from "@coreui/react";
import { useRef, useState } from "react";

const MenuLayout = () => {
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();

  // Menü öğelerinin görünürlük durumunu tutan state
  const [menuItems, setMenuItems] = useState({
    cashManagement: true,
    myAccounts: true,
    employees: true,
    expenses: true,
    incomingEFaturas: true,
    credits: true,
    fixedAssets: true,
    projects: true,
    checkPortfolio: true,
    notePortfolio: true,
    products: true,
    productServiceDefinitions: true,
    warehouses: true,
    production: true,
    catalogs: true,
    productVariants: true,
    suppliers: true,
    reports: true,
    salesPurchases: true,
    financialReports: true,
    stockReports: true,
    customerList: true,
    settings: true,
    users: true,
    eFatura: true,
  });

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

  const handleMenuItemChange = (item) => {
    setMenuItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await Promise.resolve(); // Simüle edilmiş API çağrısı
      addToast("Menü düzeni başarıyla kaydedildi");
    } catch (err) {
      addToast("Menü düzeni kaydedilirken bir hata oluştu!", "error");
    }
  };

  return (
    <>
      <style>
        {`
          .custom-checkbox .form-check-input {
            transform: scale(1.3);
            margin-right: 8px;
          }
        `}
      </style>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>
      <div className="d-flex gap-2 mb-3">
        <CButton
          type="submit"
          className="fs-6"
          style={{
            width: "150px",
            color: "white",
            backgroundColor: "#1D9030",
          }}
          onClick={handleSubmit}
        >
          <CIcon icon={cilSave} /> Kaydet
        </CButton>
      </div>
      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
          }}
        >
          Menü Düzeni
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel className="fw-bold fs-5">Nakit Yönetimi</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="cashManagementCheck"
                  name="cashManagement"
                  checked={menuItems.cashManagement}
                  onChange={() => handleMenuItemChange("cashManagement")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Nakit Yönetimi</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="myAccountsCheck"
                  name="myAccounts"
                  checked={menuItems.myAccounts}
                  onChange={() => handleMenuItemChange("myAccounts")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Hesaplarım</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="employeesCheck"
                  name="employees"
                  checked={menuItems.employees}
                  onChange={() => handleMenuItemChange("employees")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Çalışanlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="expensesCheck"
                  name="expenses"
                  checked={menuItems.expenses}
                  onChange={() => handleMenuItemChange("expenses")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Masraflar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="incomingEFaturasCheck"
                  name="incomingEFaturas"
                  checked={menuItems.incomingEFaturas}
                  onChange={() => handleMenuItemChange("incomingEFaturas")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Gelen E-Faturalar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="creditsCheck"
                  name="credits"
                  checked={menuItems.credits}
                  onChange={() => handleMenuItemChange("credits")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Krediler</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="fixedAssetsCheck"
                  name="fixedAssets"
                  checked={menuItems.fixedAssets}
                  onChange={() => handleMenuItemChange("fixedAssets")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Demirbaşlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="projectsCheck"
                  name="projects"
                  checked={menuItems.projects}
                  onChange={() => handleMenuItemChange("projects")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Projeler</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="checkPortfolioCheck"
                  name="checkPortfolio"
                  checked={menuItems.checkPortfolio}
                  onChange={() => handleMenuItemChange("checkPortfolio")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Çek Portföyü</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="notePortfolioCheck"
                  name="notePortfolio"
                  checked={menuItems.notePortfolio}
                  onChange={() => handleMenuItemChange("notePortfolio")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Senet Portföyü</CFormLabel>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel className="fw-bold fs-5">Ürünler</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="productServiceDefinitionsCheck"
                  name="productServiceDefinitions"
                  checked={menuItems.productServiceDefinitions}
                  onChange={() =>
                    handleMenuItemChange("productServiceDefinitions")
                  }
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">
                  Ürün/Hizmet Tanımları
                </CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="warehousesCheck"
                  name="warehouses"
                  checked={menuItems.warehouses}
                  onChange={() => handleMenuItemChange("warehouses")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Depolar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="productionCheck"
                  name="production"
                  checked={menuItems.production}
                  onChange={() => handleMenuItemChange("production")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Üretim</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="catalogsCheck"
                  name="catalogs"
                  checked={menuItems.catalogs}
                  onChange={() => handleMenuItemChange("catalogs")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Kataloglarınız</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="productVariantsCheck"
                  name="productVariants"
                  checked={menuItems.productVariants}
                  onChange={() => handleMenuItemChange("productVariants")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Ürün Varyantları</CFormLabel>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel className="fw-bold fs-5">Tedarikçiler</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="suppliersCheck"
                  name="suppliers"
                  checked={menuItems.suppliers}
                  onChange={() => handleMenuItemChange("suppliers")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Tedarikçiler</CFormLabel>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel className="fw-bold fs-5">Raporlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="salesPurchasesCheck"
                  name="salesPurchases"
                  checked={menuItems.salesPurchases}
                  onChange={() => handleMenuItemChange("salesPurchases")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">
                  Satışlar - Alışlar
                </CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="financialReportsCheck"
                  name="financialReports"
                  checked={menuItems.financialReports}
                  onChange={() => handleMenuItemChange("financialReports")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Finansal Raporlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="stockReportsCheck"
                  name="stockReports"
                  checked={menuItems.stockReports}
                  onChange={() => handleMenuItemChange("stockReports")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Stok Raporları</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="customerListCheck"
                  name="customerList"
                  checked={menuItems.customerList}
                  onChange={() => handleMenuItemChange("customerList")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Müşteri Listesi</CFormLabel>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={12}>
                <CFormLabel className="fw-bold fs-5">Ayarlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="settingsCheck"
                  name="settings"
                  checked={menuItems.settings}
                  onChange={() => handleMenuItemChange("settings")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Ayarlar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="usersCheck"
                  name="users"
                  checked={menuItems.users}
                  onChange={() => handleMenuItemChange("users")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">Kullanıcılar</CFormLabel>
              </CCol>
              <CCol
                md={4}
                className="d-flex align-items-center custom-checkbox"
              >
                <CFormCheck
                  type="checkbox"
                  id="eFaturaCheck"
                  name="eFatura"
                  checked={menuItems.eFatura}
                  onChange={() => handleMenuItemChange("eFatura")}
                  className="form-check-input"
                />
                <CFormLabel className="mb-0 fs-6">E-Fatura</CFormLabel>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>
    </>
  );
};

export default MenuLayout;
