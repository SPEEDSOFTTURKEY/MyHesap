import { useLocation, useNavigate } from "react-router-dom";
import CustomerModal from "./CustomerModal";

const CustomerUpdate = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const customer = state?.customer;

  const addToast = (message, type = "success") => {
    // Basit bir toast fonksiyonu, gerçek uygulamada global bir toast sistemi kullanılabilir
    alert(message);
  };

  return (
    <CustomerModal
      visible={true}
      onClose={() => navigate("/app/customers")}
      onSubmit={() => navigate("/app/customers")}
      customer={customer}
      addToast={addToast}
    />
  );
};

export default CustomerUpdate;
