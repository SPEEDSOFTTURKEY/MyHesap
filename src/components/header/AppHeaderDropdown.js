import React from "react";
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import { cilExitToApp, cilSettings, cilUser } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

import avatar8 from "./../../assets/images/avatars/User.png";

const AppHeaderDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const handleProfileClick = () => {
    // Giriş yapmış kullanıcının ID'sini localStorage'dan al
    const userId = localStorage.getItem("userId"); // Varsayılan olarak localStorage kullanıyoruz
    if (user && user.id) {
      navigate("/app/membership-detail");
    } else {
      // Kullanıcı giriş yapmamışsa, giriş sayfasına yönlendir veya hata mesajı göster
      navigate("/app/login");
      // Alternatif olarak, bir toast mesajı gösterebilirsiniz:
      // addToast('Lütfen önce giriş yapın', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0"
        caret={false}
      >
        <CAvatar src={user?.fotograf || avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          Kullanıcılar
        </CDropdownHeader>
        <CDropdownItem
          onClick={handleProfileClick}
          style={{ cursor: "pointer" }}
        >
          <CIcon icon={cilUser} className="me-2" />
          Profil
        </CDropdownItem>
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">
          Ayarlar
        </CDropdownHeader>
        <CDropdownItem onClick={() => navigate("/app/menu")}>
          <CIcon icon={cilSettings} className="me-2" />
          Ayarlar
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout} style={{ cursor: "pointer" }}>
          <CIcon icon={cilExitToApp} className="me-2" />
          Çıkış Yap
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
};

export default AppHeaderDropdown;
