import React from "react";
import { useLocation } from "react-router-dom";
import { CBreadcrumb, CBreadcrumbItem } from "@coreui/react";
import routes from "../routes";
import _nav from "../_nav";

// _nav.js dosyasındaki tüm yolları ve isimleri düzleştirme
const flattenNavItems = (items, parentPath = "") => {
  const flatRoutes = [];
  items.forEach((item) => {
    const currentPath = item.to ? `${parentPath}${item.to}` : "";
    if (item.name && currentPath) {
      // /app/ önekini kaldırarak routes.js ile uyumlu hale getir
      const normalizedPath = currentPath.replace(/^\/app\//, "");
      flatRoutes.push({ path: normalizedPath, name: item.name });
    }
    if (item.items) {
      flatRoutes.push(...flattenNavItems(item.items, parentPath));
    }
  });
  return flatRoutes;
};

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname;

  // routes.js ve _nav.js'den gelen yolları birleştir
  const navRoutes = flattenNavItems(_nav);
  const allRoutes = [...routes, ...navRoutes];

  const getRouteName = (pathname) => {
    // /app/ önekini kaldır
    const normalizedPath = pathname.replace(/^\/app\//, "");

    // Tam eşleşme için kontrol et
    let matchedRoute = allRoutes.find((route) => route.path === normalizedPath);
    if (matchedRoute) {
      return matchedRoute.name;
    }

    // Dinamik yollar için (örneğin, user-detail/:id)
    matchedRoute = allRoutes.find((route) => {
      const routeParts = route.path.split("/");
      const pathParts = normalizedPath.split("/");
      if (routeParts.length !== pathParts.length) return false;
      return routeParts.every(
        (part, index) => part.startsWith(":") || part === pathParts[index]
      );
    });

    return matchedRoute ? matchedRoute.name : false;
  };

  const getBreadcrumbs = (location) => {
    const breadcrumbs = [];
    // /app/ önekini kaldır
    const normalizedLocation = location.replace(/^\/app\//, "");
    const pathParts = normalizedLocation.split("/").filter((part) => part);

    let currentPath = "";
    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const routeName = getRouteName(currentPath);
      if (routeName) {
        breadcrumbs.push({
          pathname: `/app/${currentPath}`, // Orijinal yolu korumak için /app/ ekle
          name: routeName,
          active: index === pathParts.length - 1,
        });
      }
    });

    // Eğer hiçbir breadcrumb bulunamazsa, anasayfayı ekle
    if (breadcrumbs.length === 0) {
      breadcrumbs.push({
        pathname: "/app/dashboard",
        name: "Hesaplarım",
        active: true,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(currentLocation);

  return (
    <CBreadcrumb className="my-0">
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active
            ? { active: true }
            : { href: breadcrumb.pathname })}
          key={index}
        >
          {breadcrumb.name}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  );
};

export default React.memo(AppBreadcrumb);
