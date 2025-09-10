import React, { Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CSpinner, useColorModes } from "@coreui/react";
import "./scss/style.scss";
import "react-datepicker/dist/react-datepicker.css";
import "./scss/examples.scss";
import { UsersProvider } from "./context/UsersContext";
import { UserProvider, useUser } from "./context/UserContext";
import { EmployeesProvider } from "./context/EmployeesContext";
import { AccountsProvider } from "./context/AccountsContext";
import PrivateRoute from "./components/PrivateRoute";
import routes from "./routes";

// Pages
const Login = React.lazy(() => import("./views/pages/login/Login"));
const Register = React.lazy(() => import("./views/pages/register/Register"));
const Page404 = React.lazy(() => import("./views/pages/page404/Page404"));
const Page500 = React.lazy(() => import("./views/pages/page500/Page500"));
const ActivateAccount = React.lazy(
  () => import("./components/accounts/ActivateAccounts"),
);

// Containers
const DefaultLayout = React.lazy(() => import("./layout/DefaultLayout"));

// Açılış sayfası için yönlendirme bileşeni
const RedirectToDashboardIfLoggedIn = () => {
  const { user, loading: userLoading } = useUser();

  if (userLoading) {
    return (
      <div className="pt-3 text-center">
        <CSpinner color="primary" variant="grow" />
        <p>Kullanıcı yükleniyor...</p>
      </div>
    );
  }

  console.log("RedirectToDashboardIfLoggedIn - User:", user);

  const isValidUser = user && user.id && user.yetkiId;
  return isValidUser ? <Navigate to="/app/dashboard" replace /> : <Login />;
};

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes(
    "coreui-free-react-admin-template-theme",
  );
  const storedTheme = useSelector((state) => state.theme);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search.split("?")[1]);
    const theme =
      urlParams.get("theme") &&
      urlParams.get("theme").match(/^[A-Za-z0-9\s]+/)[0];
    if (theme) {
      setColorMode(theme);
    }

    if (isColorModeSet()) {
      return;
    }

    setColorMode(storedTheme);
  }, [storedTheme]);

  return (
    <BrowserRouter>
      <UsersProvider>
        <UserProvider>
          <EmployeesProvider>
            <AccountsProvider>
              <Suspense
                fallback={
                  <div className="pt-3 text-center">
                    <CSpinner color="primary" variant="grow" />
                  </div>
                }
              >
                <Routes>
                  <Route
                    exact
                    path="/"
                    name="Login Page"
                    element={<RedirectToDashboardIfLoggedIn />}
                  />
                  <Route
                    exact
                    path="/login"
                    name="Login Page"
                    element={<RedirectToDashboardIfLoggedIn />}
                  />
                  <Route
                    exact
                    path="/register"
                    name="Register Page"
                    element={<Register />}
                  />
                  <Route
                    exact
                    path="/activate"
                    name="Activate Account"
                    element={<ActivateAccount />}
                  />
                  <Route
                    exact
                    path="/404"
                    name="Page 404"
                    element={<Page404 />}
                  />
                  <Route
                    exact
                    path="/500"
                    name="Page 500"
                    element={<Page500 />}
                  />
                  <Route
                    path="/app"
                    element={
                      <PrivateRoute requiredYetkiId={1}>
                        <DefaultLayout />
                      </PrivateRoute>
                    }
                  >
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                    {routes.map((route, idx) =>
                      route.element ? (
                        <Route
                          key={idx}
                          path={route.path}
                          exact={route.exact}
                          name={route.name}
                          element={<route.element />}
                        />
                      ) : null,
                    )}
                  </Route>
                  {/* <Route path="*" element={<Navigate to="/404" replace />} /> */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </AccountsProvider>
          </EmployeesProvider>
        </UserProvider>
      </UsersProvider>
    </BrowserRouter>
  );
};

export default App;
