import React from "react";
import {
  CButton,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilMagnifyingGlass } from "@coreui/icons";

const Page404 = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <div className="clearfix">
              <h1 className="float-start display-3 me-4">404</h1>
              <h4 className="pt-3">Oops!!! Görünüşe göre kayboldun.</h4>
              <p className="text-body-secondary float-start">
                Yetkiniz olmayan bir sayfaya erişmeye çalıştınız veya sayfa
                mevcut değil.
              </p>
            </div>
            <CInputGroup className="input-prepend">
              <CInputGroupText>
                <CIcon icon={cilMagnifyingGlass} />
              </CInputGroupText>
              <CFormInput type="text" placeholder="Ne arıyorsun?" />
              <CButton color="info">Ara</CButton>
            </CInputGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default Page404;
