import { useContext } from "react";
import { CCard, CCardHeader, CCardBody } from "@coreui/react";
import PurchasesContext from "../../context/PurchasesContext";
import PurchasesTable from "./PurchasesTable";
import PurchasesForm from "./PurchasesForm";

const PurchasesCard = () => {
  const { loading, error, filteredPurchases } = useContext(PurchasesContext);

  return (
    <CCard className="my-3">
      <CCardHeader
        style={{
          backgroundColor: "#2965A8",
          color: "#FFFFFF",
          fontSize: "large",
          fontWeight: "bold",
        }}
      >
        <PurchasesForm />
      </CCardHeader>
      <CCardBody>
        {loading && <p>Yükleniyor...</p>}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && (
          <>
            <p>Alış Sayısı: {filteredPurchases.length}</p>
            <PurchasesTable />
          </>
        )}
      </CCardBody>
    </CCard>
  );
};

export default PurchasesCard;
