import { cilX } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CTable,
  CTableRow,
  CTableHead,
  CTableDataCell,
  CTableHeaderCell,
  CTableBody,
} from '@coreui/react'
import { useState } from 'react'

const TransactionModal = () => {
  const [selectedUser, setSelectedUser] = useState(() => {
    const stored = localStorage.getItem('selectedUser')
    return location.state?.user || (stored && JSON.parse(stored)) || null
  })
  return (
    <div>
      {/* İşlem Geçmişi */}
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 mt-2">
            <CCardHeader className="p-3">
              <h5>İşlem Geçmişi</h5>
            </CCardHeader>
            <CCardBody>
              {selectedUser.transactions?.length > 0 ? (
                <CTable>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Tarih</CTableHeaderCell>
                      <CTableHeaderCell>Kalem</CTableHeaderCell>
                      <CTableHeaderCell>Açıklama</CTableHeaderCell>
                      <CTableHeaderCell>Borç</CTableHeaderCell>
                      <CTableHeaderCell>Alacak</CTableHeaderCell>
                      <CTableHeaderCell>Bakiye</CTableHeaderCell>
                      <CTableHeaderCell></CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody className="my-2">
                    {selectedUser.transactions.map((t, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{t.date}</CTableDataCell>
                        <CTableDataCell>{t.type === 'income' ? 'Gelir' : 'Gider'}</CTableDataCell>
                        <CTableDataCell>{t.description}</CTableDataCell>
                        <CTableDataCell>{t.debit}</CTableDataCell>
                        <CTableDataCell>{t.credit}</CTableDataCell>
                        <CTableDataCell>{t.balance}</CTableDataCell>
                        <CTableDataCell>
                          <CIcon icon={cilX} style={{ color: 'white' }} className="text-danger"/>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <p>Henüz işlem yok.</p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default TransactionModal
