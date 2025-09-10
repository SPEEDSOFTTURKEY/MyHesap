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

const Page500 = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <span className="clearfix">
              <h1 className="float-start display-3 me-4">500</h1>
              <h4 className="pt-3">Üzgünüz, bir sorun var!</h4>
              <p className="text-body-secondary float-start">
                Aradığınız sayfa geçici olarak kullanılamamaktadır.
              </p>
            </span>
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

export default Page500;
