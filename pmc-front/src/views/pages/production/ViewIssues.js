import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
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
import issueService from '../../../services/issueService'
import projectService from '../../../services/projectService'
import partService from '../../../services/partService'

const ViewIssues = () => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 5
  const initialForm = {
    title: '',
    project: '',
    set: '',
    structure: '',
    assembly: '',
    part: '',
    severity: 'Medium',
    status: 'Open',
    assignedTo: '',
    remarks: '',
  }
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState(null)
  const [partsOptions, setPartsOptions] = useState([])
  const [partsLoading, setPartsLoading] = useState(false)
  const [partsError, setPartsError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const normalizeIssue = useCallback(
    (i, idx = 0) => ({
      id: i._id || i.id || `issue-${idx + 1}`,
      project: typeof i.project === 'object' ? i.project?.name : i.project || '—',
      target:
        i.partName ||
        i.assemblyName ||
        i.structureName ||
        i.setName ||
        i.part?.name ||
        i.assembly?.name ||
        i.structure?.name ||
        '—',
      severity: i.severity || 'Medium',
      assigned: i.assignedTo || i.assigned || '—',
      status: i.status || 'Open',
      remarks: i.remarks || i.description || '—',
    }),
    [],
  )

  const loadIssues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await issueService.getAll()
      const normalized = (data || []).map((i, idx) => normalizeIssue(i, idx))
        setIssues(normalized)
      } catch (err) {
        setIssues([])
        setError(err?.message || 'Unable to load issues.')
      } finally {
        setLoading(false)
      }
  }, [normalizeIssue])

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true)
    setProjectsError(null)
    try {
      const data = await projectService.getAll()
      setProjects(data || [])
    } catch (err) {
      setProjects([])
      setProjectsError(err?.message || 'Unable to load projects.')
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIssues()
    loadProjects()
  }, [loadIssues, loadProjects])

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'project') {
        next.set = ''
        next.structure = ''
        next.assembly = ''
        next.part = ''
      }
      if (field === 'set') {
        next.structure = ''
        next.assembly = ''
        next.part = ''
      }
      if (field === 'structure' || field === 'assembly') {
        next.part = ''
      }
      return next
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setCreateError(null)
    setForm(initialForm)
  }

  const handleCreate = async (e) => {
    e?.preventDefault()
    setCreateError(null)

    if (!form.project || !form.title.trim()) {
      setCreateError('Project and title are required.')
      return
    }
    if (!form.set && !form.structure && !form.assembly && !form.part) {
      setCreateError('Select a set, structure, assembly, or part for this issue.')
      return
    }

    setCreating(true)
    try {
      await issueService.add({
        project: form.project,
        set: form.set || undefined,
        structure: form.structure || undefined,
        assembly: form.assembly || undefined,
        part: form.part || undefined,
        title: form.title.trim(),
        severity: form.severity,
        status: form.status,
        assignedTo: form.assignedTo?.trim() || undefined,
        remarks: form.remarks?.trim() || undefined,
      })
      await loadIssues()
      closeModal()
      setPage(1)
    } catch (err) {
      setCreateError(err?.message || 'Failed to create issue.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = useMemo(
    () =>
      issues.filter((i) =>
        Object.values(i).some((v) => v.toString().toLowerCase().includes(search.toLowerCase())),
      ),
    [search, issues],
  )

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const currentData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const selectedProject = useMemo(
    () => projects.find((p) => (p._id || p.id) === form.project),
    [projects, form.project],
  )
  const availableSets = useMemo(() => selectedProject?.sets || [], [selectedProject])
  const selectedSet = useMemo(() => {
    return availableSets.find((set) => (set._id || set.id || set.name) === form.set) || null
  }, [availableSets, form.set])
  const availableStructures = useMemo(() => selectedSet?.structures || [], [selectedSet])
  const selectedStructure = useMemo(
    () =>
      availableStructures.find((structure) => (structure._id || structure.id) === form.structure) ||
      null,
    [availableStructures, form.structure],
  )
  const availableAssemblies = useMemo(() => {
    const assemblies = selectedSet?.assemblies || []
    if (!selectedStructure?.assemblies?.length) return assemblies
    const allowed = new Set(selectedStructure.assemblies.map((id) => String(id._id || id)))
    return assemblies.filter((assembly) => allowed.has(String(assembly._id || assembly.id || assembly)))
  }, [selectedSet, selectedStructure])

  useEffect(() => {
    const loadParts = async () => {
      if (!form.assembly) {
        setPartsOptions([])
        setPartsError(null)
        return
      }
      setPartsLoading(true)
      setPartsError(null)
      try {
        const parts = await partService.getAll({ assembly: form.assembly })
        setPartsOptions(parts || [])
      } catch (err) {
        setPartsOptions([])
        setPartsError(err?.message || 'Unable to load parts.')
      } finally {
        setPartsLoading(false)
      }
    }
    loadParts()
  }, [form.assembly])

  const exportCSV = () => {
    const csv = [
      ['ID', 'Project', 'Target', 'Severity', 'Assigned Engineer', 'Status', 'Remarks'],
      ...filtered.map((i) => [
        i.id,
        i.project,
        i.target,
        i.severity,
        i.assigned,
        i.status,
        i.remarks,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'issues.csv'
    a.click()
  }

  return (
    <>
      <CModal visible={showModal} onClose={closeModal}>
        <CModalHeader closeButton>Create Issue</CModalHeader>
        <CModalBody>
          {createError && <div className="text-danger small mb-2">{createError}</div>}
          <CForm
            id="create-issue-form"
            className="d-flex flex-column gap-3"
            onSubmit={handleCreate}
          >
            <div>
              <CFormLabel className="small fw-semibold">Project</CFormLabel>
              <CFormSelect
                size="sm"
                value={form.project}
                onChange={(e) => handleFormChange('project', e.target.value)}
                disabled={creating || projectsLoading}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.code || 'Unnamed'}
                  </option>
                ))}
              </CFormSelect>
              {projectsLoading && <div className="small text-muted mt-1">Loading projects...</div>}
              {projectsError && <div className="text-danger small mt-1">{projectsError}</div>}
            </div>
            <div className="d-flex gap-3 flex-wrap">
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Set</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.set}
                  onChange={(e) => handleFormChange('set', e.target.value)}
                  disabled={!availableSets.length || creating}
                >
                  <option value="">{availableSets.length ? 'Select set' : 'No sets found'}</option>
                  {availableSets.map((set, index) => (
                    <option key={set._id || set.id || index} value={set._id || set.id || set.name}>
                      {set.name || `Set ${index + 1}`}
                    </option>
                  ))}
                </CFormSelect>
              </div>
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Structure</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.structure}
                  onChange={(e) => handleFormChange('structure', e.target.value)}
                  disabled={!availableStructures.length || creating}
                >
                  <option value="">
                    {availableStructures.length ? 'Select structure' : 'No structures found'}
                  </option>
                  {availableStructures.map((structure, index) => (
                    <option key={structure._id || structure.id || index} value={structure._id || structure.id}>
                      {structure.name || `Structure ${index + 1}`}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </div>
            <div className="d-flex gap-3 flex-wrap">
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Assembly</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.assembly}
                  onChange={(e) => handleFormChange('assembly', e.target.value)}
                  disabled={!availableAssemblies.length || creating}
                >
                  <option value="">
                    {availableAssemblies.length ? 'Select assembly' : 'No assemblies found'}
                  </option>
                  {availableAssemblies.map((assembly, index) => (
                    <option key={assembly._id || assembly.id || index} value={assembly._id || assembly.id}>
                      {assembly.name || `Assembly ${index + 1}`}
                    </option>
                  ))}
                </CFormSelect>
              </div>
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Part</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.part}
                  onChange={(e) => handleFormChange('part', e.target.value)}
                  disabled={!form.assembly || partsLoading || creating}
                >
                  <option value="">
                    {form.assembly ? 'Select part' : 'Select an assembly first'}
                  </option>
                  {partsOptions.map((part) => (
                    <option key={part._id || part.id} value={part._id || part.id}>
                      {part.name || part.code || part.id}
                    </option>
                  ))}
                </CFormSelect>
                {partsLoading && <div className="small text-muted mt-1">Loading parts...</div>}
                {partsError && <div className="text-danger small mt-1">{partsError}</div>}
              </div>
            </div>
            <div>
              <CFormLabel className="small fw-semibold">Title</CFormLabel>
              <CFormInput
                size="sm"
                placeholder="Short issue title"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                disabled={creating}
                required
              />
            </div>
            <div className="d-flex gap-3">
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Severity</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.severity}
                  onChange={(e) => handleFormChange('severity', e.target.value)}
                  disabled={creating}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </CFormSelect>
              </div>
              <div className="flex-fill">
                <CFormLabel className="small fw-semibold">Status</CFormLabel>
                <CFormSelect
                  size="sm"
                  value={form.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                  disabled={creating}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </CFormSelect>
              </div>
            </div>
            <div>
              <CFormLabel className="small fw-semibold">Assigned To</CFormLabel>
              <CFormInput
                size="sm"
                placeholder="Engineer name"
                value={form.assignedTo}
                onChange={(e) => handleFormChange('assignedTo', e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <CFormLabel className="small fw-semibold">Remarks</CFormLabel>
              <CFormTextarea
                rows={3}
                placeholder="Add context or steps to reproduce"
                value={form.remarks}
                onChange={(e) => handleFormChange('remarks', e.target.value)}
                disabled={creating}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeModal} disabled={creating}>
            Cancel
          </CButton>
          <CButton
            color="primary"
            type="submit"
            form="create-issue-form"
            disabled={creating || projectsLoading}
          >
            {creating ? <CSpinner size="sm" className="me-2" /> : null}
            Create Issue
          </CButton>
        </CModalFooter>
      </CModal>

    <CCard className="shadow-sm border-0">
      <CCardHeader className="d-flex justify-content-between align-items-center bg-body-secondary">
        <h5 className="mb-0 fw-semibold">All Critical Issues</h5>
        <div className="d-flex gap-2">
            <CButton
              color="success"
              size="sm"
              onClick={() => {
                setCreateError(null)
                setForm(initialForm)
                setShowModal(true)
              }}
            >
              + Create Issue
            </CButton>
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
                  <CTableHeaderCell>Target</CTableHeaderCell>
                  <CTableHeaderCell>Severity</CTableHeaderCell>
                  <CTableHeaderCell>Assigned</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Remarks</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {currentData.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center text-body-secondary py-4">
                      No issues found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentData.map((i) => (
                    <CTableRow key={i.id}>
                      <CTableDataCell>{i.id}</CTableDataCell>
                      <CTableDataCell>{i.project}</CTableDataCell>
                      <CTableDataCell>{i.target}</CTableDataCell>
                      <CTableDataCell>
                        <span
                          className={`badge bg-${
                            i.severity.toLowerCase() === 'high'
                              ? 'danger'
                              : i.severity.toLowerCase() === 'medium'
                                ? 'warning'
                                : 'success'
                          }`}
                        >
                          {i.severity}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>{i.assigned}</CTableDataCell>
                      <CTableDataCell>
                        <span
                          className={`badge bg-${
                            i.status.toLowerCase().includes('resolved')
                              ? 'success'
                              : i.status.toLowerCase().includes('progress')
                                ? 'info'
                                : 'danger'
                          }`}
                        >
                          {i.status}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell>{i.remarks}</CTableDataCell>
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

export default ViewIssues
