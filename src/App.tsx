import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./Components/Scroll/ScrollToTop";
import Spinner from "./Components/Spinner/Spinner";

const LoginAdmin = lazy(() => import("./screens/Admins/LoginAdmin"));
const Login = lazy(() => import("./screens/Clients/Login"));
const DashboardAdmin = lazy(() => import("./screens/Admins/DashboardAdmin"));
const EmpresasAdmin = lazy(() => import("./screens/Admins/EmpresasAdmin"));

function App() {


  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/loginadmin" element={<LoginAdmin />} />
          <Route path="/dashboardadmin" element={<DashboardAdmin />} />
          <Route path="/empresasadmin" element={<EmpresasAdmin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
