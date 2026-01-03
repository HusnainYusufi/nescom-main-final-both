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
import setService from '../../../services/setService'
import projectService from '../../../services/projectService'

const ViewSets = () => {
  const projects = useSelector((state) => state.projects)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    project: '',
    supervisor: '',
    partsCount: '',
    progress: '',
    remarks: '',
  })

  const normalize = (items = []) =>
    items.map((s, idx) => ({
      id: s._id || s.id || `set-${idx + 1}`,
      projectId: s.project?._id || s.project || '',
      projectName: typeof s.project === 'object' ? s.project?.name || '—' : s.project || '—',
      name: s.name || 'Set',
      supervisor: s.supervisor || '—',
      partsCount: s.partsCount ?? 0,
      progress: s.progress ?? 0,
      remarks: s.remarks || s.description || '—',
    }))

  const normalizeFromProjects = (projects = []) => {
    const rows = []
    projects.forEach((p) => {
      const pid = p._id || p.id
      const pname = p.name || '—'
      ;(p.sets || []).forEach((set, idx) => {
        rows.push({
          id: set._id || set.id || `${pid}-set-${idx + 1}`,
          projectId: pid,
          projectName: pname,
          name: set.name || `Set ${idx + 1}`,
          supervisor: set.supervisor || '—',
          partsCount: set.partsCount ?? 0,
          progress: set.progress ?? 0,
          remarks: set.description || set.remarks || '—',
        })
      })
    })
    return rows
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [setData, projectData] = await Promise.all([
          setService.getAll().catch(() => []),
          projectService.getAll().catch(() => []),
        ])

        const normalizedSets = normalize(setData || [])
        const projectSets = normalizeFromProjects(projectData || [])
        const mergedMap = new Map()
        ;[...projectSets, ...normalizedSets].forEach((row) => {
          mergedMap.set(row.id, row)
        })
        setSets(Array.from(mergedMap.values()))
      } catch (err) {
        setSets([])
        setError(err?.message || 'Unable to load sets.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const resetForm = () => {
    setForm({
      name: '',
      project: '',
      supervisor: '',
      partsCount: '',
      progress: '',
      remarks: '',
    })
    setEditingId(null)
  }

  const openAdd = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (set) => {
    setEditingId(set.id)
    setForm({
      name: set.name,
      project: set.projectId,
      supervisor: set.supervisor === '—' ? '' : set.supervisor,
      partsCount: set.partsCount ?? '',
      progress: set.progress ?? '',
      remarks: set.remarks === '—' ? '' : set.remarks,
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.project) {
      setError('Project and Name are required.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      project: form.project,
      supervisor: form.supervisor || undefined,
      partsCount: form.partsCount ? Number(form.partsCount) : 0,
      progress: form.progress ? Number(form.progress) : 0,
      remarks: form.remarks || undefined,
    }
    try {
      if (editingId) {
        const updated = await setService.update(editingId, payload)
        const normalized = normalize([updated])[0]
        setSets((prev) => prev.map((s) => (s.id === editingId ? normalized : s)))
      } else {
        const created = await setService.add(payload)
        const projectName = projects.find((p) => (p.id || p._id) === payload.project)?.name || '—'
        const normalized = {
          id: created._id || created.id || `set-${Date.now()}`,
          projectId: payload.project,
          projectName,
          name: created.name || payload.name,
          supervisor: created.supervisor || payload.supervisor || '—',
          partsCount: created.partsCount ?? payload.partsCount ?? 0,
          progress: created.progress ?? payload.progress ?? 0,
          remarks: created.remarks || created.description || payload.remarks || '—',
        }
        setSets((prev) => [normalized, ...prev])
      }
      setShowModal(false)
      resetForm()
    } catch (err) {
      setError(err?.message || 'Failed to save set.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = useMemo(() => {
    return sets.filter((s) =>
      Object.values(s).some((v) =>
        v === null || v === undefined
          ? false
          : v.toString().toLowerCase().includes(search.toLowerCase()),
      ),
    )
  }, [search, sets])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const exportCSV = () => {
    const csv = [
      ['ID', 'Project', 'Set Name', 'Supervisor', 'Parts Count', 'Progress'],
      ...filtered.map((s) => [
        s.id,
        s.projectName,
        s.name,
        s.supervisor,
        s.partsCount,
        `${s.progress}%`,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sets.csv'
    a.click()
  }

  return (
    <>
      <CCard className="shadow-sm border-0">
        <CCardHeader className="d-flex justify-content-between align-items-center bg-body-secondary">
          <h5 className="mb-0 fw-semibold">All Sets</h5>
          <div className="d-flex gap-2 flex-wrap">
            <CFormInput
              type="text"
              size="sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <CButton color="primary" size="sm" onClick={openAdd}>
              Add Set
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
                    <CTableHeaderCell>Set Name</CTableHeaderCell>
                    <CTableHeaderCell>Supervisor</CTableHeaderCell>
                    <CTableHeaderCell>Parts Count</CTableHeaderCell>
                    <CTableHeaderCell>Progress</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {currentData.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-body-secondary py-4">
                        No sets found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    currentData.map((s) => (
                      <CTableRow key={s.id}>
                        <CTableDataCell>{s.id}</CTableDataCell>
                        <CTableDataCell>{s.projectName}</CTableDataCell>
                        <CTableDataCell>{s.name}</CTableDataCell>
                        <CTableDataCell>{s.supervisor}</CTableDataCell>
                        <CTableDataCell>{s.partsCount}</CTableDataCell>
                        <CTableDataCell>
                          <span className="badge bg-info">{`${s.progress}%`}</span>
                        </CTableDataCell>
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

              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted small">
                  Showing {currentData.length} of {filtered.length} entries
                </span>
                <CPagination align="end">
                  {[...Array(totalPages || 1)].map((_, i) => (
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
            <CModalTitle>{editingId ? 'Edit Set' : 'Add Set'}</CModalTitle>
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
                label="Set Name*"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormInput
                label="Supervisor"
                value={form.supervisor}
                onChange={(e) => setForm({ ...form, supervisor: e.target.value })}
              />
            </div>
            <div className="mb-3 d-flex gap-2">
              <CFormInput
                type="number"
                label="Parts Count"
                value={form.partsCount}
                onChange={(e) => setForm({ ...form, partsCount: e.target.value })}
                min={0}
              />
              <CFormInput
                type="number"
                label="Progress (%)"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
                min={0}
                max={100}
              />
            </div>
            <div className="mb-3">
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

export default ViewSets
