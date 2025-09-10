import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar, AppFooter, AppHeader } from "../components/index";
import { CContainer } from "@coreui/react";

const AppContent = () => (
  <CContainer fluid className="px-4">
    <Outlet /> {/* App.js içindeki alt rotalar burada render edilir */}
  </CContainer>
);

const DefaultLayout = () => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  );
};

export default DefaultLayout;
