import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from "@coreui/react";
import { AppSidebarNav } from "./AppSidebarNav";
import navigation from "../_nav";
import MyHesapLogo from "../assets/myhesap-logo.svg";
import MyHesapLogoNoText from "../assets/LogoNoText.svg";
import "./AppSidebar.css";

const AppSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logout } = useUser();
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);

  const handleNavClick = (item) => {
    if (item.name === "Çıkış Yap") {
      logout();
      navigate("/app/login");
    } else if (item.to) {
      navigate(item.to);
    }
  };

  const updatedNavigation = navigation.map((item) => {
    if (item.items) {
      return {
        ...item,
        items: item.items.map((subItem) => ({
          ...subItem,
          onClick: () => handleNavClick(subItem),
        })),
      };
    }
    return {
      ...item,
      onClick: () => handleNavClick(item),
    };
  });
  useEffect(() => {
    console.log("unfoldable:", unfoldable);
  }, [unfoldable]);

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      // Explicitly disable hover events
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <img
            src={unfoldable ? MyHesapLogoNoText : MyHesapLogo}
            alt="My Hesap Logo"
            width={unfoldable ? 50 : 150}
          />
        </CSidebarBrand>
      </CSidebarHeader>
      <AppSidebarNav items={updatedNavigation} />
      <CSidebarFooter className="border-top">
        <CSidebarToggler
          onClick={() =>
            dispatch({ type: "set", sidebarUnfoldable: !unfoldable })
          }
        />
      </CSidebarFooter>
    </CSidebar>
  );
};

export default React.memo(AppSidebar);
