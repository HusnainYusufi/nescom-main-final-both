import React, { useState, useMemo } from 'react'
import {
  CCard, CCardHeader, CCardBody, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell, CFormInput, CButton,
  CPagination, CPaginationItem
} from '@coreui/react'
import { cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

const ViewMeetings = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5

  const meetings = [
    { id: 'M-001', title: 'Assembly Alignment Review', date: '2025-11-02', attendees: 8, lead: 'Eng. Saad Qureshi', remarks: 'Alignment verified and approved.' },
    { id: 'M-002', title: 'Procurement Follow-up', date: '2025-11-01', attendees: 6, lead: 'Eng. Zara Mehmood', remarks: 'Suppliers confirmed delivery timelines.' },
    { id: 'M-003', title: 'Quality Control Briefing', date: '2025-10-31', attendees: 10, lead: 'Eng. Mariam Ali', remarks: 'Inspection process finalized.' },
    { id: 'M-004', title: 'Project NES-2412 Discussion', date: '2025-10-30', attendees: 5, lead: 'Eng. Khalid Bashir', remarks: 'Pending documentation review.' },
  ]

  const filtered = useMemo(() => {
    return meetings.filter(m =>
      Object.values(m).some(v => v.toString().toLowerCase().includes(search.toLowerCase()))
    )
  }, [search, meetings])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const exportCSV = () => {
    const csv = [
      ['ID', 'Title', 'Date', 'Lead Engineer', 'Attendees', 'Remarks'],
      ...filtered.map(m => [m.id, m.title, m.date, m.lead, m.attendees, m.remarks]),
    ].map(e => e.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meetings.csv'
    a.click()
  }

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center">
        <strong>All Meetings</strong>
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
              <CTableHeaderCell>Title</CTableHeaderCell>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Lead Engineer</CTableHeaderCell>
              <CTableHeaderCell>Attendees</CTableHeaderCell>
              <CTableHeaderCell>Remarks</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {currentData.map((m) => (
              <CTableRow key={m.id}>
                <CTableDataCell>{m.id}</CTableDataCell>
                <CTableDataCell>{m.title}</CTableDataCell>
                <CTableDataCell>{m.date}</CTableDataCell>
                <CTableDataCell>{m.lead}</CTableDataCell>
                <CTableDataCell>{m.attendees}</CTableDataCell>
                <CTableDataCell>{m.remarks}</CTableDataCell>
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
)

export default ViewMeetings
