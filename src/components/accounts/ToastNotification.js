import { useEffect, useState } from "react";
import { CToaster, CToast, CToastHeader, CToastBody } from "@coreui/react";
import { useAccounts } from "../../context/AccountsContext";
import "../../scss/style.scss";

const ToastNotification = () => {
  const { toast, setToast, toaster } = useAccounts();
  const [toastQueue, setToastQueue] = useState([]);

  useEffect(() => {
    if (toast) {
      setToastQueue((prev) => [...prev, toast]);
      const timer = setTimeout(() => {
        setToastQueue((prev) => prev.slice(1));
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  return (
    <CToaster ref={toaster} placement="top-end" className="p-3">
      {toastQueue.map((t, index) => (
        <CToast
          key={index}
          autohide={5000}
          visible={true}
          color={t.color}
          className="text-white shadow-lg"
          onClose={() => {
            setToastQueue((prev) => prev.filter((_, i) => i !== index));
            if (index === 0) setToast(null);
          }}
        >
          <CToastHeader
            closeButton={{ label: "Kapat" }}
            style={{ color: "var(--jetBlack-color)" }}
          >
            <strong className="me-auto">Bildirim</strong>
          </CToastHeader>
          <CToastBody>{t.message}</CToastBody>
        </CToast>
      ))}
    </CToaster>
  );
};

export default ToastNotification;
