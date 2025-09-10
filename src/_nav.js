import { CNavGroup, CNavItem, CNavTitle } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSpeedometer,
  cilWallet,
  cilPeople,
  cilList,
  cilCreditCard,
  cilStorage,
  cilChart,
  cilUser,
  cilApplicationsSettings,
  cilExitToApp,
  cibLaunchpad,
  cilMoney,
  cilFile,
  cilSettings,
  cilCart,
  cilBarChart,
  cibSuperuser,
  cilTruck,
  cilExcerpt,
  cilMenu,
  cilFax,
  cilTransfer,
  cibCcVisa,
  cilListRich,
} from "@coreui/icons";

const _nav = [
  {
    component: CNavItem,
    name: "Kullanıcı Paneli",
    to: "/dashboard",
    icon: <CIcon icon={cibLaunchpad} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Müşteriler",
    to: "/app/customers",
    icon: <CIcon icon={cibSuperuser} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: "Hesap Yönetimi",
  },
  {
    component: CNavGroup,
    name: "Nakit Yönetimi",
    to: "/app/base",
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Hesaplarım",
        to: "/app/dashboard",
        icon: <CIcon icon={cibCcVisa} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Çalışanlar",
        to: "/app/employees",
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Masraflar",
        to: "/app/expenses",
        icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Krediler",
        to: "/app/credits",
        icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavItem,
    name: "Tedarikçiler",
    to: "/app/suppliers",
    icon: <CIcon icon={cilBarChart} customClassName="nav-icon" />,
  },
   {
     component: CNavItem,
     name: "Satışlar",
     to: "/app/sales",
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
   },
  {
    component: CNavItem,
    name: "Alışlar",
    to: "/app/purchases",
    icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: "Ürün Yönetimi",
    to: "/app/base",
    icon: <CIcon icon={cilListRich} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Ürünler",
        to: "/app/products",
        icon: <CIcon icon={cilList} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Depolar",
        to: "/app/warehouses",
        icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: "Raporlar",
    to: "/app/base",
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Satışlar - Alışlar",
        to: "/app/sales-purchases",
        icon: <CIcon icon={cilTransfer} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavTitle,
    name: "Ayarlar",
  },
  {
    component: CNavGroup,
    name: "Ayarlar",
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: "Kullanıcılar",
        to: "/app/users",
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
      },
      // {
      //   component: CNavItem,
      //   name: "Üyelik Detayları",
      //   to: "/app/membership-detail",
      //   icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      // },
      {
        component: CNavItem,
        name: "Tanımlar",
        to: "/app/definitions",
        icon: <CIcon icon={cilExcerpt} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "Menu Düzeni",
        to: "/app/menu",
        icon: <CIcon icon={cilMenu} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: "E-Fatura",
        to: "/app/e-invoice",
        icon: <CIcon icon={cilFax} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavItem,
    name: "Çıkış Yap",
    to: "/app/exit",
    icon: <CIcon icon={cilExitToApp} customClassName="nav-icon" />,
  },
];

export default _nav;
