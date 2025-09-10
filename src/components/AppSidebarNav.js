import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import {
  CBadge,
  CNavLink,
  CSidebarNav,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CNavTitle,
} from "@coreui/react";

export const AppSidebarNav = ({ items }) => {
  const unfoldable = useSelector((state) => state.sidebarUnfoldable);
  const location = useLocation();

  const navLink = (name, icon, badge, indent = false) => {
    return (
      <>
        {icon ? (
          icon
        ) : indent ? (
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>
        ) : null}
        {!unfoldable && name && name}
        {!unfoldable && badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </>
    );
  };

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, to, ...rest } = item;
    const Component = component;

    return (
      <Component as="div" key={index}>
        {to ? (
          <CNavLink
            as={NavLink}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
            {...rest}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    );
  };

  const navGroup = (item, index) => {
    const { component, name, icon, items, ...rest } = item;
    const Component = component;

    if (unfoldable) {
      return (
        <CDropdown
          variant="nav-item"
          placement="right-start"
          key={index}
          autoClose="outside"
          trigger="hover" // Dropdown opens on hover
        >
          <CDropdownToggle caret={false} className="nav-link">
            {navLink(name, icon)}
          </CDropdownToggle>
          <CDropdownMenu className="dropdown-menu-dark">
            {items?.map((subItem, subIndex) =>
              subItem.to ? (
                <CDropdownItem
                  key={subIndex}
                  as={NavLink}
                  to={subItem.to}
                  className={({ isActive }) =>
                    isActive ? "active-sub-item" : ""
                  }
                  onClick={subItem.onClick}
                >
                  {navLink(subItem.name, subItem.icon)}
                </CDropdownItem>
              ) : null
            )}
          </CDropdownMenu>
        </CDropdown>
      );
    }

    return (
      <Component
        compact
        as="div"
        key={index}
        toggler={navLink(name, icon)}
        visible={!unfoldable}
        {...rest}
      >
        {items.map((subItem, subIndex) =>
          subItem.items
            ? navGroup(subItem, subIndex)
            : navItem(subItem, subIndex, true)
        )}
      </Component>
    );
  };

  return (
    <CSidebarNav as={SimpleBar}>
      {items.map((item, index) => {
        if (item.component === CNavTitle) {
          return !unfoldable ? (
            <CNavTitle key={index}>{item.name}</CNavTitle>
          ) : null;
        }
        return item.items ? navGroup(item, index) : navItem(item, index);
      })}
    </CSidebarNav>
  );
};

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default React.memo(AppSidebarNav);