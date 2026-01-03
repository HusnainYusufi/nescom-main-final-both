import React, { useState, useMemo } from 'react'
import {
  CCard, CCardHeader, CCardBody, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell, CFormInput, CButton,
  CPagination, CPaginationItem
} from '@coreui/react'
import { cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const ViewProjects = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5

  const projects = [
    { id: 'P-001', name: 'Aerial Defense System', lead: 'Eng. Saad Qureshi', status: 'Active', start: '2024-02-10', end: '2025-02-15', sets: 12 },
    { id: 'P-002', name: 'Radar Control Unit', lead: 'Eng. Zara Mehmood', status: 'Ongoing', start: '2024-05-01', end: '2025-05-01', sets: 8 },
    { id: 'P-003', name: 'Cruise Launcher Mk-II', lead: 'Eng. Khalid Bashir', status: 'Pending', start: '2024-03-01', end: '2025-03-15', sets: 15 },
    { id: 'P-004', name: 'Thermal Imaging Core', lead: 'Eng. Mariam Ali', status: 'Active', start: '2024-01-05', end: '2025-01-10', sets: 9 },
    { id: 'P-005', name: 'Guidance Controller', lead: 'Eng. Fahad Khan', status: 'Completed', start: '2023-07-01', end: '2024-07-10', sets: 10 },
    { id: 'P-006', name: 'Tactical AI Unit', lead: 'Eng. Sameer Niaz', status: 'Ongoing', start: '2024-09-01', end: '2025-09-30', sets: 7 },
  ]

  // ---- Filtering ----
  const filtered = useMemo(() => {
    return projects.filter(p =>
      Object.values(p).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    )
  }, [search, projects])

  // ---- Pagination ----
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // ---- CSV Export ----
  const exportCSV = () => {
    const csv = [
      ['ID', 'Project Name', 'Lead Engineer', 'Status', 'Start Date', 'End Date', 'Total Sets'],
      ...filtered.map(p => [p.id, p.name, p.lead, p.status, p.start, p.end, p.sets]),
    ].map(e => e.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'projects.csv'
    a.click()
  }

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center">
        <strong>All Projects</strong>
        <div className="d-flex gap-2">
          <CFormInput
            type="text"
            size="sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CButton color="success" size="sm" onClick={exportCSV}>
            <CIcon icon={cilCloudDownload} className="me-1" /> Export CSV
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        <CTable striped hover responsive bordered align="middle">
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Project Name</CTableHeaderCell>
              <CTableHeaderCell>Lead Engineer</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
              <CTableHeaderCell>Start Date</CTableHeaderCell>
              <CTableHeaderCell>End Date</CTableHeaderCell>
              <CTableHeaderCell>Total Sets</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {currentData.map((p) => (
              <CTableRow key={p.id}>
                <CTableDataCell>{p.id}</CTableDataCell>
                <CTableDataCell>{p.name}</CTableDataCell>
                <CTableDataCell>{p.lead}</CTableDataCell>
                <CTableDataCell>
                  <span className={`badge bg-${
                    p.status === 'Active' ? 'success' :
                    p.status === 'Ongoing' ? 'info' :
                    p.status === 'Completed' ? 'secondary' :
                    'warning'
                  }`}>{p.status}</span>
                </CTableDataCell>
                <CTableDataCell>{p.start}</CTableDataCell>
                <CTableDataCell>{p.end}</CTableDataCell>
                <CTableDataCell>{p.sets}</CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted small">
            Showing {currentData.length} of {filtered.length} entries
          </span>
          <CPagination align="end">
            {[...Array(totalPages)].map((_, i) => (
              <CPaginationItem
                key={i}
                active={i + 1 === page}
                onClick={() => setPage(i + 1)}
                style={{ cursor: 'pointer' }}
              >
                {i + 1}
              </CPaginationItem>
            ))}
          </CPagination>
        </div>
      </CCardBody>
    </CCard>
  )
}

export default ViewProjects
