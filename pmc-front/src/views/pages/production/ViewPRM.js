import React, { useState, useMemo } from 'react'
import {
  CCard, CCardHeader, CCardBody, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell, CFormInput, CButton,
  CPagination, CPaginationItem
} from '@coreui/react'
import { cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const ViewPRM = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5

  const data = [
    { id: 'PRM-001', project: 'Radar Control Unit', assembly: 'Signal Processor', preprm: 'Approved', prm: 'In Progress', updated: '2025-11-03' },
    { id: 'PRM-002', project: 'Aerial Defense System', assembly: 'Launcher Assembly', preprm: 'Approved', prm: 'Completed', updated: '2025-10-28' },
    { id: 'PRM-003', project: 'Thermal Imaging Core', assembly: 'Sensor Array', preprm: 'Pending', prm: 'In Progress', updated: '2025-11-02' },
  ]

  const filtered = useMemo(() => data.filter(d =>
    Object.values(d).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
  ), [search, data])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const exportCSV = () => {
    const csv = [
      ['ID', 'Project', 'Assembly', 'Pre-PRM', 'PRM', 'Updated'],
      ...filtered.map(d => [d.id, d.project, d.assembly, d.preprm, d.prm, d.updated]),
    ].map(e => e.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prm_status.csv'
    a.click()
  }

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center">
        <strong>All PRM Status</strong>
        <div className="d-flex gap-2">
          <CFormInput type="text" size="sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <CButton color="success" size="sm" onClick={exportCSV}><CIcon icon={cilCloudDownload} className="me-1" /> Export CSV</CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        <CTable striped hover responsive bordered align="middle">
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Project</CTableHeaderCell>
              <CTableHeaderCell>Assembly</CTableHeaderCell>
              <CTableHeaderCell>Pre-PRM</CTableHeaderCell>
              <CTableHeaderCell>PRM</CTableHeaderCell>
              <CTableHeaderCell>Updated</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {currentData.map((d) => (
              <CTableRow key={d.id}>
                <CTableDataCell>{d.id}</CTableDataCell>
                <CTableDataCell>{d.project}</CTableDataCell>
                <CTableDataCell>{d.assembly}</CTableDataCell>
                <CTableDataCell>{d.preprm}</CTableDataCell>
                <CTableDataCell>{d.prm}</CTableDataCell>
                <CTableDataCell>{d.updated}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
        <PaginationInfo filtered={filtered} currentData={currentData} page={page} totalPages={totalPages} setPage={setPage} />
      </CCardBody>
    </CCard>
  )
}

const PaginationInfo = ({ filtered, currentData, page, totalPages, setPage }) => (
  <div className="d-flex justify-content-between align-items-center mt-3">
    <span className="text-muted small">Showing {currentData.length} of {filtered.length} entries</span>
    <CPagination align="end">
      {[...Array(totalPages)].map((_, i) => (
        <CPaginationItem key={i} active={i + 1 === page} onClick={() => setPage(i + 1)} style={{ cursor: 'pointer' }}>
          {i + 1}
        </CPaginationItem>
      ))}
    </CPagination>
  </div>
)

export default ViewPRM
