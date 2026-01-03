import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import { cilCloudDownload } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useSelector } from 'react-redux'
import statusService from '../../../services/statusService'

const ViewStatus = () => {
  const projects = useSelector((state) => state.projects)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    project: '',
    partName: '',
    status: 'Pending',
    updatedOn: '',
    remarks: '',
  })

  const normalize = (items = []) =>
    items.map((s, idx) => ({
      id: s._id || s.id || `status-${idx + 1}`,
      projectId: s.project?._id || s.project || '',
      projectName: typeof s.project === 'object' ? s.project?.name : s.project || '—',
      part: s.part?.name || s.partName || '—',
      status: s.status || 'Pending',
      updated: s.updatedOn ? new Date(s.updatedOn).toISOString().slice(0, 10) : '—',
      remarks: s.remarks || '—',
    }))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await statusService.getAll()
        setStatuses(normalize(data))
      } catch (err) {
        setStatuses([])
        setError(err?.message || 'Unable to load status entries.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const resetForm = () => {
    setForm({ project: '', partName: '', status: 'Pending', updatedOn: '', remarks: '' })
    setEditingId(null)
  }

  const openAdd = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setForm({
      project: row.projectId,
      partName: row.part === '—' ? '' : row.part,
      status: row.status,
      updatedOn: row.updated === '—' ? '' : row.updated,
      remarks: row.remarks === '—' ? '' : row.remarks,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.project) {
      setError('Project is required.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      project: form.project,
      partName: form.partName || undefined,
      status: form.status || 'Pending',
      remarks: form.remarks || undefined,
      updatedOn: form.updatedOn || undefined,
    }
    try {
      if (editingId) {
        const updated = await statusService.update(editingId, payload)
        const normalized = normalize([updated])[0]
        setStatuses((prev) => prev.map((s) => (s.id === editingId ? normalized : s)))
      } else {
        const created = await statusService.add(payload)
        setStatuses((prev) => [normalize([created])[0], ...prev])
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      setError(err?.message || 'Failed to save status.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(
    () =>
      statuses.filter((s) =>
        Object.values(s).some((v) =>
          v === null || v === undefined
            ? false
            : v.toString().toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [search, statuses],
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const exportCSV = () => {
    const csv = [
      ['ID', 'Project', 'Part', 'Status', 'Last Updated', 'Remarks'],
      ...filtered.map((s) => [s.id, s.projectName, s.part, s.status, s.updated, s.remarks]),
    ]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'status.csv'
    a.click()
  }

  return (
    <>
      <CCard className="shadow-sm border-0">
        <CCardHeader className="d-flex justify-content-between align-items-center bg-body-secondary">
          <h5 className="mb-0 fw-semibold">All Status</h5>
          <div className="d-flex gap-2 flex-wrap">
            <CFormInput
              type="text"
              size="sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CButton color="primary" size="sm" onClick={openAdd}>
              Add Status
            </CButton>
            <CButton color="primary" size="sm" onClick={exportCSV} disabled={!filtered.length}>
              <CIcon icon={cilCloudDownload} className="me-1" /> Export CSV
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}
          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <>
              <CTable striped hover responsive bordered align="middle">
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell>ID</CTableHeaderCell>
                    <CTableHeaderCell>Project</CTableHeaderCell>
                    <CTableHeaderCell>Part</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Updated</CTableHeaderCell>
                    <CTableHeaderCell>Remarks</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {currentData.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-body-secondary py-4">
                        No status entries found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    currentData.map((s) => (
                      <CTableRow key={s.id}>
                        <CTableDataCell>{s.id}</CTableDataCell>
                        <CTableDataCell>{s.projectName}</CTableDataCell>
                        <CTableDataCell>{s.part}</CTableDataCell>
                        <CTableDataCell>
                          <span
                            className={`badge bg-${
                              s.status.toLowerCase().includes('complete')
                                ? 'success'
                                : s.status.toLowerCase().includes('progress')
                                  ? 'info'
                                  : 'warning'
                            }`}
                          >
                            {s.status}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>{s.updated}</CTableDataCell>
                        <CTableDataCell>{s.remarks}</CTableDataCell>
                        <CTableDataCell>
                          <CButton
                            size="sm"
                            color="light"
                            className="text-primary"
                            onClick={() => openEdit(s)}
                          >
                            Edit
                          </CButton>
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
                totalPages={totalPages || 1}
                setPage={setPage}
              />
            </>
          )}
        </CCardBody>
      </CCard>

      <CModal
        alignment="center"
        visible={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
      >
        <CForm onSubmit={handleSave}>
          <CModalHeader closeButton>
            <CModalTitle>{editingId ? 'Edit Status' : 'Add Status'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3">
              <CFormSelect
                label="Project*"
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                required
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormInput
                label="Part / Item"
                value={form.partName}
                onChange={(e) => setForm({ ...form, partName: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <CFormSelect
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Resolved</option>
              </CFormSelect>
            </div>
            <div className="mb-3 d-flex gap-2">
              <CFormInput
                type="date"
                label="Updated On"
                value={form.updatedOn}
                onChange={(e) => setForm({ ...form, updatedOn: e.target.value })}
              />
              <CFormInput
                label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
          </CModalBody>
          <CModalFooter className="d-flex justify-content-between">
            <CButton
              color="secondary"
              variant="outline"
              onClick={() => {
                resetForm()
              }}
            >
              Reset
            </CButton>
            <div className="d-flex gap-2">
              <CButton
                color="light"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </CButton>
              <CButton color="primary" type="submit" disabled={saving}>
                {saving ? <CSpinner size="sm" /> : editingId ? 'Update' : 'Add'}
              </CButton>
            </div>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
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

export default ViewStatus
