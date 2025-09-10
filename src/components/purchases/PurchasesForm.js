import { useContext } from "react";
import {
  CRow,
  CCol,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CFormSwitch,
  CFormCheck,
  CFormInput,
} from "@coreui/react";
import PurchasesContext from "../../context/PurchasesContext";

const PurchasesForm = () => {
  const {
    showCancelled,
    setShowCancelled,
    docTypeFilter,
    setDocTypeFilter,
    timeFilter,
    setTimeFilter,
    searchType,
    setSearchType,
    contentType,
    setContentType,
    searchTerm,
    setSearchTerm,
  } = useContext(PurchasesContext);

  return (
    <>
      <CRow className="d-flex">
        <CCol className="d-flex align-items-center justify-content-between">
          <div className="d-flex gap-2">
            <CDropdown>
              <CDropdownToggle color="light">
                Tüm Belge Tipleri: {docTypeFilter}
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setDocTypeFilter("Tümünü seç")}>
                  Tümünü seç
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={() => setDocTypeFilter("Sipariş")}>
                  Sipariş
                </CDropdownItem>
                <CDropdownItem onClick={() => setDocTypeFilter("İrsaliye")}>
                  İrsaliye
                </CDropdownItem>
                <CDropdownItem onClick={() => setDocTypeFilter("Faturalaşmış")}>
                  Faturalaşmış
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CDropdown>
              <CDropdownToggle color="light">{timeFilter}</CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  onClick={() => setTimeFilter("Bu yılın Satışlarını Göster")}
                >
                  Bu yılın Satışlarını Göster
                </CDropdownItem>
                <CDropdownItem onClick={() => setTimeFilter("Son 1 Ay")}>
                  Son 1 Ay
                </CDropdownItem>
                <CDropdownItem onClick={() => setTimeFilter("Son 3 Ay")}>
                  Son 3 Ay
                </CDropdownItem>
                <CDropdownItem onClick={() => setTimeFilter("Bugün")}>
                  Bugün
                </CDropdownItem>
                <CDropdownItem onClick={() => setTimeFilter("Tamamını Göster")}>
                  Tamamını Göster
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
          <CFormSwitch
            label="İptalleri de göster"
            checked={showCancelled}
            onChange={() => setShowCancelled(!showCancelled)}
          />
        </CCol>
      </CRow>
      <CCol className="d-flex flex-wrap align-items-center justify-content-between mt-2 gap-3">
        <div style={{ display: "flex", gap: "10px" }}>
          <CFormCheck
            type="radio"
            button={{ color: "light", variant: "outline" }}
            name="contentType"
            id="products"
            label="Ürünler"
            checked={contentType === "Ürünler"}
            onChange={() => setContentType("Ürünler")}
          />
          <CFormCheck
            type="radio"
            button={{ color: "light", variant: "outline" }}
            name="contentType"
            id="services"
            label="Hizmetler"
            checked={contentType === "Hizmetler"}
            onChange={() => setContentType("Hizmetler")}
            disabled
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span>Ara:</span>
          <CDropdown>
            <CDropdownToggle color="light">{searchType}</CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                onClick={() => setSearchType("Tedarikçi İsmi / Belge No")}
              >
                Tedarikçi İsmi / Belge No
              </CDropdownItem>
              <CDropdownItem
                onClick={() => setSearchType("Ürün Adı / Kodu / Barkodu")}
              >
                Ürün Adı / Kodu / Barkodu
              </CDropdownItem>
              <CDropdownItem onClick={() => setSearchType("Belge Açıklaması")}>
                Belge Açıklaması
              </CDropdownItem>
              <CDropdownItem onClick={() => setSearchType("Satır Açıklaması")}>
                Satır Açıklaması
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </div>
        <CFormInput
          type="text"
          placeholder="Arama... (en az 3 karakter)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "240px" }}
        />
      </CCol>
    </>
  );
};

export default PurchasesForm;
