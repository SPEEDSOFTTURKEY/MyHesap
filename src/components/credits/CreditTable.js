import {
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";

const CreditTable = ({ credits, onCreditClick }) => {
  return (
    <CTable responsive hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Kredi Adı</CTableHeaderCell>
          <CTableHeaderCell>Kalan Tutar</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {credits.length > 0 ? (
          credits.map((credit) => (
            <CTableRow
              key={credit.id}
              onClick={() => onCreditClick(credit)}
              style={{ cursor: "pointer" }}
            >
              <CTableDataCell>{credit.name}</CTableDataCell>
              <CTableDataCell>
                {credit.remainingAmount.toLocaleString("tr-TR")} TRY
              </CTableDataCell>
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan="2">Kredi bulunamadı.</CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  );
};

export default CreditTable;