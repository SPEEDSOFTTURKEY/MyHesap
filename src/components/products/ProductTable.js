import {
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CRow,
  CCol,
  CBadge,
} from "@coreui/react";

const ProductTable = ({
  products,
  onProductClick,
  selectedIds = [],
  allSelected = false,
  onToggleAll,
  onToggleOne,
}) => {
  // Stok durumunu belirle
  const getStockBadge = (quantity) => {
    if (quantity === 0) {
      return <CBadge color="danger">Stok Yok</CBadge>;
    } else if (quantity < 10) {
      return <CBadge color="warning">Kritik Stok</CBadge>;
    } else if (quantity < 50) {
      return <CBadge color="info">Düşük Stok</CBadge>;
    } else {
      return <CBadge color="success">Stokta</CBadge>;
    }
  };

  // Stok miktarı için renk belirle
  const getStockColor = (quantity) => {
    if (quantity === 0) return "#dc3545"; // Kırmızı
    if (quantity < 10) return "#ffc107"; // Sarı
    if (quantity < 50) return "#17a2b8"; // Mavi
    return "#28a745"; // Yeşil
  };
  return (
    <CTable responsive hover>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell style={{ width: 36, textAlign: "center" }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              aria-label="Tümünü seç"
            />
          </CTableHeaderCell>
          <CTableHeaderCell>Ürün/Hizmet Bilgileri</CTableHeaderCell>
          <CTableHeaderCell>Satış Fiyatı</CTableHeaderCell>
          <CTableHeaderCell style={{ textAlign: "center" }}>
            Stok Miktarı
          </CTableHeaderCell>
          <CTableHeaderCell style={{ textAlign: "center" }}>
            Stok Durumu
          </CTableHeaderCell>
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {products.length > 0 ? (
          products.map((product) => (
            <CTableRow
              key={product.id}
              onClick={() => onProductClick(product)}
              style={{ cursor: "pointer" }}
            >
              <CTableDataCell style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => onToggleOne(product.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Seç"
                />
              </CTableDataCell>

              <CTableDataCell>
                <CRow>
                  <CCol xs={4}>
                    <div>
                      <strong>{product.name || "Bilinmiyor"}</strong>
                      <p className="mb-0 text-muted">
                        {product.unit || "Adet"}
                      </p>
                    </div>
                  </CCol>

                  <CCol xs={4}>
                    <CRow>
                      <CCol xs={6}>
                        <div
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            fontSize: "0.9rem",
                            borderRadius: "4px",
                            textAlign: "center",
                            minWidth: "100px",
                          }}
                        >
                          {product.category || "Kategori Yok"}
                        </div>
                      </CCol>
                      <CCol xs={6}>
                        <div
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#ffc107",
                            color: "#000",
                            fontSize: "0.9rem",
                            borderRadius: "4px",
                            textAlign: "center",
                            minWidth: "100px",
                          }}
                        >
                          {product.brand || "Marka Yok"}
                        </div>
                      </CCol>
                    </CRow>
                  </CCol>

                  <CCol xs={4}>
                    <CRow>
                      <CCol xs={6}>
                        <div
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#dc3545",
                            color: "#fff",
                            fontSize: "0.9rem",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          {product.productCode || "-"}
                        </div>
                      </CCol>
                      <CCol xs={6}>
                        <div
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#17a2b8",
                            color: "#fff",
                            fontSize: "0.9rem",
                            borderRadius: "4px",
                            textAlign: "center",
                          }}
                        >
                          {product.shelfLocation || "Raf Yok"}
                        </div>
                      </CCol>
                    </CRow>
                  </CCol>

                  <CCol xs={4}></CCol>
                </CRow>
              </CTableDataCell>

              <CTableDataCell>
                {product.salePrice
                  ? `${product.salePrice.toLocaleString("tr-TR")} ${product.saleCurrency}`
                  : "Fiyat Yok"}
              </CTableDataCell>
 
              <CTableDataCell style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: getStockColor(product.stockQuantity || 0),
                  }}
                >
                  {product.stockQuantity !== undefined
                    ? product.stockQuantity.toLocaleString("tr-TR")
                    : "0"}
                </div>
                <small className="text-muted">{product.unit || "Adet"}</small>
              </CTableDataCell>

              <CTableDataCell style={{ textAlign: "center" }}>
                {getStockBadge(product.stockQuantity || 0)}
              </CTableDataCell>
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan="5" className="text-center">
              Ürün bulunamadı veya veri yüklenemedi.
            </CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  );
};

export default ProductTable;
