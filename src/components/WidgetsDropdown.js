import React, { useEffect } from "react";
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
} from "@coreui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UsersContext";

const WidgetsDropdown = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { users = [], loading, error, setUsers } = useUsers();

  const accountCategories = [
    { categoryId: 1, accountName: "Banka Hesapları", type: "bank" },
    { categoryId: 2, accountName: "Kasa Tanımları", type: "cash" },
    { categoryId: 3, accountName: "Kredi Kartları", type: "creditCard" },
    { categoryId: 4, accountName: "Pos Hesapları", type: "pos" },
    {
      categoryId: 5,
      accountName: "Şirket Ortakları Hesapları",
      type: "partner",
    },
    { categoryId: 6, accountName: "Veresiye Hesapları", type: "debt" },
  ];

  const getTextColor = (bgColor) => {
    if (!bgColor) return "#ffffff";
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 128 ? "#000000" : "#ffffff";
  };

  const handleUserClick = (user) => {
    navigate(`/app/account-detail/${user.id}`, { state: { user } });
  };

  // Gezinme sonrası users state'ini güncelle
  useEffect(() => {
    if (location.pathname === "/app/dashboard" && users.length === 0) {
      // Burada fetchAccounts gibi bir fonksiyon çağrılabilir, ancak mevcut context'e güveniyoruz
    }
  }, [location, users.length, setUsers]);

  if (loading) return <p>Hesaplar yükleniyor...</p>;
  if (error) return <p>{error}</p>;

  return (
    <CRow className="mb-4" xs={{ gutter: 3 }}>
      {accountCategories.map((category) => {
        const categoryUsers =
          users?.filter((user) => user.type === category.type) || [];

        return (
          <CCol
            xs={12}
            sm={6}
            xl={6}
            xxl={6}
            key={`row-${category.categoryId}`}
          >
            <CCard className="h-100 shadow-sm">
              <CCardHeader
                className="text-white"
                style={{ backgroundColor: "#2965A8" }}
              >
                <h5 className="mb-0">{category.accountName.toUpperCase()}</h5>
              </CCardHeader>
              <CCardBody
                style={{ backgroundColor: "#FBF7DC" }}
                className="d-flex flex-wrap gap-2"
              >
                {categoryUsers.length > 0 ? (
                  categoryUsers.map((user) => (
                    <CButton
                      key={`${user.id}-${category.categoryId}`}
                      size="sm"
                      className="text-start px-2 py-1 d-flex flex-column"
                      style={{
                        backgroundColor: user.labelColor || "#ccc",
                        borderColor: user.labelColor || "#ccc",
                        color: getTextColor(user.labelColor),
                        height: "60px",
                        minWidth: "120px",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        lineHeight: "1.2",
                      }}
                      onClick={() => handleUserClick(user)}
                    >
                      <strong
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {user.userName || "İsim Yok"}
                      </strong>
                      <small
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {(user.balance || 0).toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {user.currency || "TRY"}
                      </small>
                    </CButton>
                  ))
                ) : (
                  <p className="text-muted mb-0">Bu kategoride hesap yok.</p>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        );
      })}
    </CRow>
  );
};

export default WidgetsDropdown;
