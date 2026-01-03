import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CPagination,
  CPaginationItem,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import assemblyService from '../../../services/assemblyService'
import projectService from '../../../services/projectService'

const ViewAssembly = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const [assemblies, setAssemblies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [assembliesData, projects] = await Promise.all([
          assemblyService.getAll(),
          projectService.getAll().catch(() => []),
        ])

        // Build a lookup of assemblyId -> project name by walking project sets
        const assemblyProjectMap = {}
        ;(projects || []).forEach((project) => {
          const pname = project.name || '—'
          ;(project.sets || []).forEach((set) => {
            ;(set.assemblies || []).forEach((asm) => {
              const aid = typeof asm === 'string' ? asm : asm?._id || asm?.id
              if (aid) assemblyProjectMap[aid] = pname
            })
          })
        })

        const normalized = (assembliesData || []).map((a, idx) => {
          const aid = a._id || a.id || `asm-${idx + 1}`
          const projectName =
            assemblyProjectMap[aid] ||
            (typeof a.project === 'object' ? a.project?.name : a.project) ||
            '—'
          return {
            id: aid,
            project: projectName,
            name: a.name || '—',
            parts: a.partsCount || a.parts || 0,
            supervisor: a.supervisor || a.owner || '—',
            status: a.status || 'Draft',
          }
        })
        setAssemblies(normalized)
      } catch (err) {
        setAssemblies([])
        setError(err?.message || 'Unable to load assemblies.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(
    () =>
      assemblies.filter((a) =>
        Object.values(a).some((v) => v.toString().toLowerCase().includes(search.toLowerCase())),
      ),
    [search, assemblies],
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const exportCSV = () => {
    const csv = [
      ['ID', 'Project', 'Assembly Name', 'Parts Count', 'Supervisor', 'Status'],
      ...filtered.map((a) => [a.id, a.project, a.name, a.parts, a.supervisor, a.status]),
    ]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assemblies.csv'
    a.click()
  }

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="d-flex justify-content-between align-items-center bg-body-secondary">
        <h5 className="mb-0 fw-semibold">All Assemblies</h5>
        <div className="d-flex gap-2">
          <CFormInput
            type="text"
            size="sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CButton color="primary" size="sm" onClick={exportCSV} disabled={!filtered.length}>
            <CIcon icon={cilCloudDownload} className="me-1" /> Export CSV
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <>
            {error && <div className="text-danger mb-3 small">{error}</div>}
        <CTable striped hover responsive bordered align="middle">
          <CTableHead color="dark">
            <CTableRow>
              <CTableHeaderCell>ID</CTableHeaderCell>
              <CTableHeaderCell>Project</CTableHeaderCell>
              <CTableHeaderCell>Assembly Name</CTableHeaderCell>
              <CTableHeaderCell>Parts Count</CTableHeaderCell>
              <CTableHeaderCell>Supervisor</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
                {currentData.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-body-secondary py-4">
                      No assemblies found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentData.map((a) => (
              <CTableRow key={a.id}>
                <CTableDataCell>{a.id}</CTableDataCell>
                <CTableDataCell>{a.project}</CTableDataCell>
                <CTableDataCell>{a.name}</CTableDataCell>
                <CTableDataCell>{a.parts}</CTableDataCell>
                <CTableDataCell>{a.supervisor}</CTableDataCell>
                <CTableDataCell>
                        <span
                          className={`badge bg-${
                            a.status.toLowerCase().includes('complete')
                              ? 'success'
                              : a.status.toLowerCase().includes('progress') ||
                                  a.status.toLowerCase().includes('production')
                                ? 'info'
                                : 'warning'
                          }`}
                        >
                          {a.status}
                        </span>
                </CTableDataCell>
              </CTableRow>
                  ))
                )}
          </CTableBody>
        </CTable>
            <PaginationInfo
              filtered={filtered}
              currentData={currentData}
              page={page}
              totalPages={totalPages}
              setPage={setPage}
            />
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

const PaginationInfo = ({ filtered, currentData, page, totalPages, setPage }) => (
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
)

export default ViewAssembly
