import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";

const WarehouseTable = ({ warehouses, onWarehouseClick }) => {
  return (
    <CTable responsive hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Depo Adı</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {warehouses.map((warehouse) => (
          <CTableRow
            key={warehouse.id}
            onClick={() => onWarehouseClick(warehouse)}
            style={{ cursor: "pointer" }}
          >
            <CTableDataCell>{warehouse.adi}</CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  );
};

export default WarehouseTable;
