import Expenses from "./views/pages/expenses/Expenses";
import ExpensesItem from "./views/pages/expenses/ExpensesItem";
import NewExpense from "./views/pages/expenses/NewExpense";
import UserDetail from "./views/pages/settings/users/UserDetail";
import EmployeeUpdate from "./views/pages/employees/EmployeeUpdate";
import { lazy } from "react";
import EmployeeStatement from "./components/employees/EmployeeStatement";
import CreditDetail from "./views/pages/credits/CreditDetail";
import ProductNew from "./views/pages/products/ProductNew";
import SupplierNew from "./views/pages/suppliers/SupplierNew";
import CustomerNew from "./views/pages/customers/CustomerNew";
import StockCount from "./components/products/StockCount";
import RegisteredSupplierPurchase from "./components/purchases/RegisteredSupplierPuchase";
import PurchaseDetail from "./components/purchases/PurchaseDetail";
import MembershipDetail from "./views/pages/settings/membership/MembershipDetail";
import WarehouseTransfer from "./components/warehouses/WarehouseTransfer";
import WarehouseStockCount from "./components/warehouses/WarehouseStockCount";
import Login from "./views/pages/login/Login";
import { element } from "prop-types";
const Dashboard = lazy(() => import("./views/dashboard/Dashboard"));
const Accounts = lazy(() => import("./views/pages/accounts/Accounts"));
const Employees = lazy(() => import("./views/pages/employees/Employees"));
const EmployeeDetail = lazy(
  () => import("./views/pages/employees/EmployeeDetail"),
);
const Credits = lazy(() => import("./views/pages/credits/Credits"));
const Customers = lazy(() => import("./views/pages/customers/Customers"));
const CustomerDetail = lazy(
  () => import("./views/pages/customers/CustomerDetail"),
);
const Suppliers = lazy(() => import("./views/pages/suppliers/Suppliers"));
const SupplierDetail = lazy(
  () => import("./views/pages/suppliers/SupplierDetail"),
);
const Sales = lazy(() => import("./views/pages/sales/Sales"));
const Purchases = lazy(() => import("./views/pages/purchases/Purchases"));
const Products = lazy(() => import("./views/pages/products/Products"));
const ProductDetail = lazy(
  () => import("./views/pages/products/ProductDetail"),
);
const Warehouses = lazy(() => import("./views/pages/warehouses/Warehouses"));
const WarehouseDetail = lazy(
  () => import("./views/pages/warehouses/WarehouseDetail"),
);
const Reports = lazy(() => import("./views/pages/reports/Reports"));
const SalesPurchases = lazy(
  () => import("./components/reports/SalesPurchases"),
);
const SimpleSalesReport = lazy(
  () => import("./components/reports/SimpleSalesReport"),
);
const ProductSalesReport = lazy(
  () => import("./components/reports/ProductSalesReport"),
);
const CustomerTurnoversReport = lazy(
  () => import("./components/reports/CustomerTurnoversReport"),
);
const NonSalesCustomersReport = lazy(
  () => import("./components/reports/NonSalesCustomersReport"),
);
const PurchasesReport = lazy(
  () => import("./components/reports/PurchasesReport"),
);
const ReturnsReport = lazy(() => import("./components/reports/ReturnsReport"));
const OffersReport = lazy(() => import("./components/reports/OffersReport"));
const SixMonthSalesReport = lazy(
  () => import("./components/reports/SixMonthSalesReport"),
);
const StockSalesCoverageReport = lazy(
  () => import("./components/reports/StockSalesCoverageReport"),
);
const Users = lazy(() => import("./views/pages/settings/users/Users"));
const Definitions = lazy(
  () => import("./views/pages/settings/definitions/Definitions"),
);
const MenuLayout = lazy(() => import("./views/pages/settings/menu/MenuLayout"));
const EFatura = lazy(() => import("./views/pages/settings/eFatura/EFatura"));
const Colors = lazy(() => import("./views/theme/colors/Colors"));
const Typography = lazy(() => import("./views/theme/typography/Typography"));

// Base
const Accordion = lazy(() => import("./views/base/accordion/Accordion"));
const Breadcrumbs = lazy(() => import("./views/base/breadcrumbs/Breadcrumbs"));
const Cards = lazy(() => import("./views/base/cards/Cards"));
const Carousels = lazy(() => import("./views/base/carousels/Carousels"));
const Collapses = lazy(() => import("./views/base/collapses/Collapses"));
const ListGroups = lazy(() => import("./views/base/list-groups/ListGroups"));
const Navs = lazy(() => import("./views/base/navs/Navs"));
const Paginations = lazy(() => import("./views/base/paginations/Paginations"));
const Placeholders = lazy(
  () => import("./views/base/placeholders/Placeholders"),
);
const Popovers = lazy(() => import("./views/base/popovers/Popovers"));
const Progress = lazy(() => import("./views/base/progress/Progress"));
const Spinners = lazy(() => import("./views/base/spinners/Spinners"));
const Tabs = lazy(() => import("./views/base/tabs/Tabs"));
const Tooltips = lazy(() => import("./views/base/tooltips/Tooltips"));

// Buttons
const Buttons = lazy(() => import("./views/buttons/buttons/Buttons"));
const ButtonGroups = lazy(
  () => import("./views/buttons/button-groups/ButtonGroups"),
);
const Dropdowns = lazy(() => import("./views/buttons/dropdowns/Dropdowns"));

// Forms
const ChecksRadios = lazy(
  () => import("./views/forms/checks-radios/ChecksRadios"),
);
const FloatingLabels = lazy(
  () => import("./views/forms/floating-labels/FloatingLabels"),
);
const FormControl = lazy(
  () => import("./views/forms/form-control/FormControl"),
);
const InputGroup = lazy(() => import("./views/forms/input-group/InputGroup"));
const Layout = lazy(() => import("./views/forms/layout/Layout"));
const Range = lazy(() => import("./views/forms/range/Range"));
const Select = lazy(() => import("./views/forms/select/Select"));
const Validation = lazy(() => import("./views/forms/validation/Validation"));

const Charts = lazy(() => import("./views/charts/Charts"));

// Icons
const CoreUIIcons = lazy(
  () => import("./views/icons/coreui-icons/CoreUIIcons"),
);
const Flags = lazy(() => import("./views/icons/flags/Flags"));
const Brands = lazy(() => import("./views/icons/brands/Brands"));

// Notifications
const Alerts = lazy(() => import("./views/notifications/alerts/Alerts"));
const Badges = lazy(() => import("./views/notifications/badges/Badges"));
const Modals = lazy(() => import("./views/notifications/modals/Modals"));
const Toasts = lazy(() => import("./views/notifications/toasts/Toasts"));

const Widgets = lazy(() => import("./views/widgets/Widgets"));

const routes = [
  {
    path: "test-purchase",
    name: "Test Alış",
    element: RegisteredSupplierPurchase,
  }, // test için eklendi
  { path: "dashboard", name: "Hesaplarım", element: Dashboard },
  {
    path: "account-detail/:userId",
    name: "Hesap Detayları",
    element: Accounts,
  },
  { path: "employees", name: "Çalışanlar", element: Employees },
  {
    path: "employee-detail/:employeeId",
    name: "Çalışan Detayları",
    element: EmployeeDetail,
  },
  {
    path: "employee-update",
    name: "Çalışan Güncelle",
    element: EmployeeUpdate,
  },
  {
    path: "employee-statement/:employeeId",
    name: "Çalışan Hesap Ekstre",
    element: EmployeeStatement,
  },
  { path: "login", name: "Login", element: Login },
  { path: "expenses", name: "Masraflar", element: Expenses },
  { path: "expenses-item", name: "Masraf Kalemleri", element: ExpensesItem },
  { path: "new-expense", name: "Yeni Masraf Gir", element: NewExpense },
  { path: "credits", name: "Krediler", element: Credits },
  { path: "credit-detail", name: "Kredi Detay", element: CreditDetail },
  { path: "customers", name: "Müşteriler", element: Customers },
  { path: "customer-new", name: "Yeni Müşteri Ekle", element: CustomerNew },
  {
    path: "customer-detail/:id",
    name: "Müşteri Detay",
    element: CustomerDetail,
  },
  { path: "suppliers", name: "Tedarikçiler", element: Suppliers },
  { path: "supplier-new", name: "Yeni Tedarikçi Ekle", element: SupplierNew },
  {
    path: "supplier-detail/:id",
    name: "Tedarikçi Detayları",
    element: SupplierDetail,
  },
  { path: "sales", name: "Satışlar", element: Sales },
  { path: "purchases", name: "Alışlar", element: Purchases },
  {
    path: "purchases/purchase-detail",
    name: "Alış Detay",
    element: PurchaseDetail,
  },
  { path: "products", name: "Ürünler", element: Products },
  { path: "products/:id", name: "Ürün Detay", element: ProductDetail },
  { path: "product-new", name: "Yeni Ürün Gir", element: ProductNew },
  {
    path: "products/:id/stock-count",
    name: "Ürün Stok Sayımı",
    element: StockCount,
  },
  { path: "warehouses", name: "Depolar", element: Warehouses },
  {
    path: "warehouse-detail/:id",
    name: "Depo Detay",
    element: WarehouseDetail,
  },
  {
    path: "warehouses/:id/stock-count",
    name: "Depo Stok Sayımı",
    element: WarehouseStockCount,
  },
  {
    path: "warehouse-transfer",
    name: "Depolar Arası Transfer",
    element: WarehouseTransfer,
  },
  { path: "reports", name: "Raporlar", element: Reports },
  {
    path: "sales-purchases",
    name: "Satışlar - Alışlar",
    element: SalesPurchases,
  },
  {
    path: "purchases/registered-supplier-purchase",
    name: "Kayıtlı Tedarikçiden Alış Gir",
    element: RegisteredSupplierPurchase,
  },
  // {
  //   path: "membership-detail",
  //   name: "Üyelik Detayları",
  //   element: MembershipDetail,
  // },
  {
    path: "sales-purchases/simple-sales",
    name: "Basit Satış Raporu",
    element: SimpleSalesReport,
  },
  {
    path: "sales-purchases/product-sales",
    name: "Ürün Alış-Satış Raporu",
    element: ProductSalesReport,
  },
  {
    path: "sales-purchases/customer-turnovers",
    name: "Müşteri Ciroları",
    element: CustomerTurnoversReport,
  },
  {
    path: "sales-purchases/non-sales-customers",
    name: "Satış Olmayan Müşteriler",
    element: NonSalesCustomersReport,
  },
  {
    path: "sales-purchases/purchases",
    name: "Alışlar",
    element: PurchasesReport,
  },
  { path: "sales-purchases/returns", name: "İadeler", element: ReturnsReport },
  { path: "sales-purchases/offers", name: "Teklifler", element: OffersReport },
  {
    path: "sales-purchases/six-month-sales",
    name: "6 Aylık Satışlar",
    element: SixMonthSalesReport,
  },
  {
    path: "sales-purchases/stock-sales-coverage",
    name: "Stok-Satış Karşılama",
    element: StockSalesCoverageReport,
  },
  { path: "users", name: "Kullanıcılar", element: Users },
  { path: "user-detail/:id", name: "Kullanıcı Detay", element: UserDetail },
  { path: "definitions", name: "Tanımlar", element: Definitions },
  { path: "menu", name: "Menü Düzeni", element: MenuLayout },
  { path: "e-invoice", name: "E-Fatura", element: EFatura },
  { path: "theme", name: "Theme", element: Colors, exact: true },
  { path: "theme/colors", name: "Colors", element: Colors },
  { path: "theme/typography", name: "Typography", element: Typography },
  { path: "base", name: "Base", element: Cards, exact: true },
  { path: "base/accordion", name: "Accordion", element: Accordion },
  { path: "base/breadcrumbs", name: "Breadcrumbs", element: Breadcrumbs },
  { path: "base/cards", name: "Cards", element: Cards },
  { path: "base/carousels", name: "Carousel", element: Carousels },
  { path: "base/collapses", name: "Collapse", element: Collapses },
  { path: "base/list-groups", name: "List Groups", element: ListGroups },
  { path: "base/navs", name: "Navs", element: Navs },
  { path: "base/paginations", name: "Paginations", element: Paginations },
  { path: "base/placeholders", name: "Placeholders", element: Placeholders },
  { path: "base/popovers", name: "Popovers", element: Popovers },
  { path: "base/progress", name: "Progress", element: Progress },
  { path: "base/spinners", name: "Spinners", element: Spinners },
  { path: "base/tabs", name: "Tabs", element: Tabs },
  { path: "base/tooltips", name: "Tooltips", element: Tooltips },
  { path: "buttons", name: "Buttons", element: Buttons, exact: true },
  { path: "buttons/buttons", name: "Buttons", element: Buttons },
  { path: "buttons/dropdowns", name: "Dropdowns", element: Dropdowns },
  {
    path: "buttons/button-groups",
    name: "Button Groups",
    element: ButtonGroups,
  },
  { path: "charts", name: "Charts", element: Charts },
  { path: "forms", name: "Forms", element: FormControl, exact: true },
  { path: "forms/form-control", name: "Form Control", element: FormControl },
  { path: "forms/select", name: "Select", element: Select },
  {
    path: "forms/checks-radios",
    name: "Checks & Radios",
    element: ChecksRadios,
  },
  { path: "forms/range", name: "Range", element: Range },
  { path: "forms/input-group", name: "Input Group", element: InputGroup },
  {
    path: "forms/floating-labels",
    name: "Floating Labels",
    element: FloatingLabels,
  },
  { path: "forms/layout", name: "Layout", element: Layout },
  { path: "forms/validation", name: "Validation", element: Validation },
  { path: "icons", exact: true, name: "Icons", element: CoreUIIcons },
  { path: "icons/coreui-icons", name: "CoreUI Icons", element: CoreUIIcons },
  { path: "icons/flags", name: "Flags", element: Flags },
  { path: "icons/brands", name: "Brands", element: Brands },
  {
    path: "notifications",
    name: "Notifications",
    element: Alerts,
    exact: true,
  },
  { path: "notifications/alerts", name: "Alerts", element: Alerts },
  { path: "notifications/badges", name: "Badges", element: Badges },
  { path: "notifications/modals", name: "Modals", element: Modals },
  { path: "notifications/toasts", name: "Toasts", element: Toasts },
  { path: "widgets", name: "Widgets", element: Widgets },
  // routes.js dosyasına ekleyin:
  {
    path: "products/:id",
    exact: true,
    name: "Product Detail",
    element: ProductDetail, // Bu komponenti import etmeniz gerekecek
  },
];

export default routes;
