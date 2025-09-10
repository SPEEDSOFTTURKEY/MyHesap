import { useRef } from "react";
import { CToaster, CToast, CToastHeader, CToastBody } from "@coreui/react";

const Notifications = ({ toasts }) => {
  const toaster = useRef();

  return (
    <CToaster ref={toaster} placement="top-end" className="p-3">
      {toasts.map(({ id, message, type }) => (
        <CToast
          key={id}
          autohide={true}
          visible={true}
          delay={5000}
          className={type === "hata" ? "bg-danger text-white" : "bg-success text-white"}
        >
          <CToastHeader closeButton>
            <strong className="me-auto">{type === "hata" ? "Hata" : "Başarılı"}</strong>
          </CToastHeader>
          <CToastBody>{message}</CToastBody>
        </CToast>
      ))}
    </CToaster>
  );
};

export default Notifications;