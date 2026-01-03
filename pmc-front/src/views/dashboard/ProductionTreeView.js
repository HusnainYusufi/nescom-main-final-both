// src/views/dashboard/ProductionTreeView.js
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CCloseButton,
  CCol,
  CContainer,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CRow,
  CToast,
  CToastBody,
  CToaster,
  CTooltip,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilPlus, cilWarning } from '@coreui/icons'
import projectService from '../../services/projectService'
import assemblyService from '../../services/assemblyService'

const ProductionTreeView = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [qcDrafts, setQcDrafts] = useState({})
  const [toast, setToast] = useState({ visible: false, message: '', color: 'success' })

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
    const params = new URLSearchParams(location.search)
    const projectFromUrl = params.get('project')
    if (projectFromUrl) {
      dispatch({ type: 'setActiveProject', projectId: projectFromUrl })
    } else if (!activeProjectId && projects[0]) {
      dispatch({ type: 'setActiveProject', projectId: projects[0].id })
    }
  }, [location.search, projects, activeProjectId, dispatch])

  useEffect(() => {
    if (projects.length) return
    const loadProjects = async () => {
      try {
        const data = await projectService.getAll()
        const normalized = (data || []).map((p) => ({ ...p, id: p.id || p._id }))
        dispatch({
          type: 'set',
          projects: normalized,
          activeProjectId: normalized[0]?.id || activeProjectId,
        })
      } catch (err) {
        setToast({
          visible: true,
          message: err?.message || 'Unable to load projects.',
          color: 'danger',
        })
      }
    }
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length])

  const handleStatusChange = async (projectId, status) => {
    const project = projects.find((p) => p.id === projectId)
    const previous = project?.status
    dispatch({ type: 'updateProject', projectId, changes: { status } })
    try {
      await projectService.updateStatus(projectId, status)
      setToast({ visible: true, message: 'Project status updated.', color: 'primary' })
    } catch (err) {
      // revert on failure
      dispatch({ type: 'updateProject', projectId, changes: { status: previous } })
      setToast({
        visible: true,
        message: err?.message || 'Failed to update project status.',
        color: 'danger',
      })
    }
  }

  const getNormalizedSets = (project) =>
    (project.sets || []).map((set) => {
      const normalizedAssemblies = (set.assemblies || []).map((asm) => {
        const asmId = asm._id || asm.id || asm.name
        return typeof asm === 'string'
          ? { id: asmId, name: asm, status: 'Draft', qcReports: [] }
          : {
              id: asmId,
              name: asm.name,
              status: asm.status || 'Draft',
              description: asm.description || asm.notes || '',
              qcReports: asm.qcReports || [],
            }
      })

      const normalizedStructures = (set.structures || []).map((structure) => {
        const sid = structure._id || structure.id || structure.name
        return typeof structure === 'string'
          ? { id: sid, name: structure, status: 'Draft', qcReports: [], description: '' }
          : {
              id: sid,
              name: structure.name,
              status: structure.status || 'Draft',
              description: structure.description || structure.notes || '',
              qcReports: structure.qcReports || [],
            }
      })

      return {
        ...set,
        id: set.id || set._id || set.name,
        status: set.status || 'Draft',
        assemblies: normalizedAssemblies,
        structures: normalizedStructures,
        qcReports: set.qcReports || [],
      }
    })

  const handleQcDraftChange = (projectId, field, value) => {
    setQcDrafts((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value,
      },
    }))
  }

  const handleQcFileChange = (projectId, fileList) => {
    const file = fileList?.[0]
    setQcDrafts((prev) => ({
      ...prev,
      [projectId]: { ...prev[projectId], file, fileKey: Date.now() },
    }))
  }

  const handleAddQcReport = (projectId) => {
    const project = projects.find((p) => p.id === projectId)
    const draft = qcDrafts[projectId] || {}
    const normalizedSets = project ? getNormalizedSets(project) : []
    if (!normalizedSets.length) {
      setToast({
        visible: true,
        message: 'Add a set before attaching QC.',
        color: 'warning',
      })
      return
    }
    const targetSetId = draft.setId || normalizedSets[0]?.id
    const targetStructure = draft.structureName || ''
    const targetAssembly = draft.assemblyName || ''

    if (!project || !draft.title || !draft.owner || !draft.status || !targetSetId) {
      setToast({
        visible: true,
        message: 'Add QC title, owner, status, and pick the target set/structure/assembly.',
        color: 'warning',
      })
      return
    }

    const attachment = draft.file
      ? {
          name: draft.file.name,
          type: draft.file.type,
          size: draft.file.size,
          url: URL.createObjectURL(draft.file),
        }
      : null

    const newReport = {
      id: `qc-${Date.now()}`,
      title: draft.title,
      owner: draft.owner,
      status: draft.status,
      date: new Date().toISOString().slice(0, 10),
      comments: draft.comments || '',
      remarks: draft.comments || '',
      attachment,
      target: {
        setId: targetSetId,
        structureName: targetStructure || null,
        assemblyName: targetAssembly || null,
      },
    }

    // Find assembly id if selected
    let assemblyId = ''
    if (targetAssembly) {
      const targetSet = normalizedSets.find((s) => s.id === targetSetId)
      const structureAsm = targetSet?.structures
        ?.find((st) => st.name === targetStructure)
        ?.assemblies?.find((a) => a.name === targetAssembly)
      const setAsm = targetSet?.assemblies?.find((a) => a.name === targetAssembly)
      assemblyId = structureAsm?.id || setAsm?.id || ''
    }

    const applyLocalUpdate = (qcPayload) => {
      const updatedSets = normalizedSets.map((set) => {
        if (set.id !== targetSetId) return set

        if (targetAssembly && targetStructure) {
          return {
            ...set,
            structures: (set.structures || []).map((structure) =>
              structure.name === targetStructure
                ? {
                    ...structure,
                    assemblies: (structure.assemblies || []).map((assembly) =>
                      assembly.name === targetAssembly
                        ? { ...assembly, qcReports: [...(assembly.qcReports || []), qcPayload] }
                        : assembly,
                    ),
                  }
                : structure,
            ),
          }
        }

        if (targetStructure) {
          return {
            ...set,
            structures: (set.structures || []).map((structure) =>
              structure.name === targetStructure
                ? { ...structure, qcReports: [...(structure.qcReports || []), qcPayload] }
                : structure,
            ),
          }
        }

        if (targetAssembly && !targetStructure) {
          return {
            ...set,
            assemblies: (set.assemblies || []).map((assembly) =>
              assembly.name === targetAssembly
                ? { ...assembly, qcReports: [...(assembly.qcReports || []), qcPayload] }
                : assembly,
            ),
          }
        }

        return { ...set, qcReports: [...(set.qcReports || []), qcPayload] }
      })

      dispatch({
        type: 'updateProject',
        projectId,
        changes: { sets: updatedSets },
      })
      setQcDrafts((prev) => ({
        ...prev,
        [projectId]: {
          title: '',
          owner: '',
          status: '',
          comments: '',
          file: null,
          fileKey: Date.now(),
          setId: targetSetId,
          structureName: targetStructure,
          assemblyName: '',
        },
      }))
    }

    const persistToBackendIfPossible = async () => {
      // Only assemblies have a backend endpoint today
      if (assemblyId) {
        try {
          const payload = {
            title: newReport.title,
            status: newReport.status,
            owner: newReport.owner,
            comments: newReport.comments,
            remarks: newReport.comments,
          }
          const updatedAssembly = await assemblyService.addQcReport(assemblyId, payload)
          const backendReports = updatedAssembly?.qcReports || []
          const saved = backendReports[backendReports.length - 1] || {
            ...newReport,
            id: newReport.id,
          }
          // ensure owner/comments surface even if backend omits them
          const normalizedSaved = {
            ...saved,
            owner: saved.owner || newReport.owner,
            comments: saved.comments || newReport.comments,
            remarks: saved.remarks || newReport.remarks,
            title: saved.title || newReport.title,
            status: saved.status || newReport.status,
          }
          applyLocalUpdate(normalizedSaved)
          // refresh from backend to sync nested ids/qc
          projectService
            .getAll()
            .then((list) =>
              dispatch({
                type: 'set',
                projects: (list || []).map((p) => ({ ...p, id: p.id || p._id })),
                activeProjectId: projectId,
              }),
            )
            .catch(() => {})
          setToast({
            visible: true,
            message: 'QC report saved to backend.',
            color: 'success',
          })
          return
        } catch (err) {
          setToast({
            visible: true,
            message: err?.message || 'Backend QC save failed; kept locally.',
            color: 'warning',
          })
        }
      }

      // Fallback to local only
      applyLocalUpdate(newReport)
      setToast({
        visible: true,
        message: 'QC saved locally (no assembly selected).',
        color: 'info',
      })
    }

    persistToBackendIfPossible()
  }

  useEffect(() => {
    if (location.state?.projectCreated) {
      const projectName = location.state.projectName || 'Project'
      setToast({
        visible: true,
        message: `${projectName} was created successfully.`,
        color: 'success',
      })
      navigate({ pathname: location.pathname, search: location.search }, { replace: true })
      setShowSuccessModal(true)
    }
  }, [location.pathname, location.search, location.state, navigate])

  const renderQcReports = (project) => {
    const sets = getNormalizedSets(project)
    const draft = qcDrafts[project.id] || {}
    const selectedSetId = draft.setId || sets[0]?.id || ''
    const selectedSet = sets.find((set) => set.id === selectedSetId)
    const selectedStructureName = draft.structureName || ''
    const selectedStructure = (selectedSet?.structures || []).find(
      (structure) => structure.name === selectedStructureName,
    )
    const qcReports = sets.flatMap((set) => [
      // Set-level QC
      ...(set.qcReports || []).map((report) => ({
        ...report,
        location: `Set • ${set.name}`,
      })),
      // Assemblies directly under the set
      ...(set.assemblies || []).flatMap((assembly) =>
        (assembly.qcReports || []).map((report) => ({
          ...report,
          location: `Assembly • ${assembly.name}`,
        })),
      ),
      // Structures and their assemblies
      ...(set.structures || []).flatMap((structure) => [
        ...(structure.qcReports || []).map((report) => ({
          ...report,
          location: `Structure • ${structure.name}`,
        })),
        ...(structure.assemblies || []).flatMap((assembly) =>
          (assembly.qcReports || []).map((report) => ({
            ...report,
            location: `Assembly • ${assembly.name}`,
          })),
        ),
      ]),
    ])
    const safeReports = Array.isArray(qcReports) ? qcReports : []

    return (
      <div className="mt-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilInfo} className="text-info" />
            <span className="fw-semibold">QC Reports</span>
          </div>
          <CTooltip content="Attach QC proofs to sets, structures, or assemblies. Track unlimited reports per item.">
            <CIcon icon={cilWarning} className="text-warning" />
          </CTooltip>
        </div>

        {safeReports.length === 0 ? (
          <div className="small text-body-secondary mb-2">
            No QC reports captured yet for this build tree.
          </div>
        ) : (
          <CRow className="g-3 mb-3">
            {safeReports.map((report) => (
              <CCol md={6} key={report.id}>
                <CCard className="border-start border-4 border-success h-100">
                  <CCardBody className="py-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{report.title}</div>
                        <div className="small text-body-secondary">{report.location}</div>
                        <div className="small text-body-secondary">
                          Owner: {report.owner || '—'} • {report.date || 'Dated offline'}
                        </div>
                        {(report.comments || report.remarks) && (
                          <div className="small text-body mt-2">
                            <span className="text-body-secondary">Comments:</span>{' '}
                            {report.comments || report.remarks}
                          </div>
                        )}
                        {report.attachment && (
                          <div className="small text-body mt-2">
                            <div className="text-body-secondary">Attachment</div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <a
                                href={report.attachment.url}
                                download={report.attachment.name}
                                target="_blank"
                                rel="noreferrer"
                                className="fw-semibold"
                              >
                                {report.attachment.name}
                              </a>
                              <span className="text-body-secondary">
                                {formatFileSize(report.attachment.size)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <CBadge color="success" className="text-uppercase">
                        {report.status}
                      </CBadge>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>
        )}

        <CCol md={12} className="mt-3">
          <CCard className="bg-body-tertiary border-dashed h-100">
            <CCardBody>
              <div className="fw-semibold mb-3">Attach QC report</div>
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormSelect
                    label="Set"
                    value={selectedSetId}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'setId', event.target.value)
                    }
                  >
                    <option value="">Select set</option>
                    {sets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    label="Structure (optional)"
                    value={selectedStructureName}
                    onChange={(event) =>
                      setQcDrafts((prev) => ({
                        ...prev,
                        [project.id]: {
                          ...prev[project.id],
                          structureName: event.target.value,
                          assemblyName: '',
                        },
                      }))
                    }
                    disabled={!selectedSet}
                  >
                    <option value="">Attach to set only</option>
                    {(selectedSet?.structures || []).map((structure) => (
                      <option key={structure.name} value={structure.name}>
                        {structure.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    label="Assembly (optional)"
                    value={draft.assemblyName || ''}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'assemblyName', event.target.value)
                    }
                    disabled={!selectedSet}
                  >
                    <option value="">
                      {selectedStructure ? 'Attach to structure' : 'Attach to set assemblies'}
                    </option>
                    {(selectedStructure?.assemblies || selectedSet?.assemblies || []).map(
                      (assembly) => (
                        <option key={assembly.name} value={assembly.name}>
                          {assembly.name}
                        </option>
                      ),
                    )}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="g-3 mt-1">
                <CCol md={4}>
                  <CFormInput
                    label="QC title"
                    value={draft.title || ''}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'title', event.target.value)
                    }
                    placeholder="e.g., Assembly torque log"
                  />
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    label="Owner / Cell"
                    value={draft.owner || ''}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'owner', event.target.value)
                    }
                    placeholder="QA Cell"
                  />
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    label="Status"
                    value={draft.status || ''}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'status', event.target.value)
                    }
                  >
                    <option value="">Select status</option>
                    <option value="Draft">Draft</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                  </CFormSelect>
                </CCol>
                <CCol md={1} className="d-flex align-items-end">
                  <CButton
                    color="success"
                    variant="outline"
                    onClick={() => handleAddQcReport(project.id)}
                  >
                    Save
                  </CButton>
                </CCol>
              </CRow>
              <CRow className="g-3 mt-1 align-items-end">
                <CCol md={6}>
                  <CFormInput
                    key={(draft.fileKey ?? project.id) + '-file-input'}
                    type="file"
                    label="Attach QC proof (PDF, docs, images)"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                    onChange={(event) => handleQcFileChange(project.id, event.target.files)}
                  />
                  <div className="form-text">
                    Attach the offline report file to keep it linked with the selection.
                  </div>
                </CCol>
                <CCol md={5}>
                  <CFormInput
                    label="Comments / notes"
                    value={draft.comments || ''}
                    onChange={(event) =>
                      handleQcDraftChange(project.id, 'comments', event.target.value)
                    }
                    placeholder="Add reviewer notes or context"
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </div>
    )
  }

  const getStatusBadgeColor = (status = '') => {
    const normalized = status.toLowerCase()
    if (normalized.includes('complete')) return 'success'
    if (normalized.includes('production')) return 'primary'
    if (normalized.includes('config')) return 'info'
    if (normalized.includes('pending')) return 'warning'
    return 'secondary'
  }

  const renderAssemblyNodes = (assemblies = [], projectId, setId) => {
    if (!assemblies.length) {
      return (
        <div className="text-body-secondary small ms-4 ps-3 border-start border-secondary-subtle">
          No assemblies registered yet.
        </div>
      )
    }

    return assemblies.map((assembly) => (
      <div
        key={assembly.name}
        className="ms-4 ps-3 border-start border-secondary-subtle py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
      >
        <div>
          <div className="fw-semibold">{assembly.name}</div>
          <div className="text-body-secondary small">
            {(assembly.qcReports || []).length} QC logs
          </div>
          {(assembly.qcReports || []).length > 0 && (
            <div className="mt-1">
              {(assembly.qcReports || []).map((qc) => (
                <div key={qc._id || qc.id || qc.title} className="small text-body">
                  <CBadge color={getStatusBadgeColor(qc.status)} className="me-2">
                    {qc.status || 'Pending'}
                  </CBadge>
                  {qc.title}
                </div>
              ))}
            </div>
          )}
        </div>
        <CBadge color={getStatusBadgeColor(assembly.status)}>{assembly.status || 'Draft'}</CBadge>
      </div>
    ))
  }

  const renderStructureNodes = (set) => {
    if (!set.structures.length) {
      return (
        <div className="text-body-secondary small ms-3 ps-3 border-start border-secondary-subtle">
          No structures have been captured for this set.
        </div>
      )
    }

    return set.structures.map((structure) => (
      <div key={structure.name} className="ms-3 ps-3 border-start border-secondary-subtle py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fw-semibold">{structure.name}</div>
            <div className="text-body-secondary small">
              {(structure.assemblies || []).length} assemblies •{' '}
              {(structure.qcReports || []).length} QC logs
            </div>
          </div>
          <CBadge color={getStatusBadgeColor(structure.status)}>
            {structure.status || 'Draft'}
          </CBadge>
        </div>
        {renderAssemblyNodes(structure.assemblies || [], project.id, set.id || set._id || set.name)}
      </div>
    ))
  }

  const renderSetNodes = (project) => {
    const sets = getNormalizedSets(project)
    if (!sets.length) {
      return (
        <div className="text-body-secondary small">
          No sets yet. Start mapping the build tree from the Add Project dialog.
        </div>
      )
    }

    return sets.map((set) => (
      <div key={set.id} className="my-3 ms-2 ps-3 border-start border-secondary-subtle">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div>
            <div className="fw-semibold">{set.name}</div>
            {set.description && <div className="text-body-secondary small">{set.description}</div>}
            <div className="text-body-secondary small">
              {set.structures.length} structures • {set.assemblies.length} assemblies •{' '}
              {set.qcReports?.length || 0} QC logs
            </div>
          </div>
          <CBadge color={getStatusBadgeColor(set.status)}>{set.status || 'Draft'}</CBadge>
        </div>

        {set.structures.length === 0 ? (
          <div className="text-body-secondary small ms-3 ps-3 border-start border-secondary-subtle">
            No structures captured for this set.
          </div>
        ) : (
          set.structures.map((st) => (
            <div
              key={st.name}
              className="ms-3 ps-3 border-start border-secondary-subtle py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
            >
              <div>
                <div className="fw-semibold">{st.name}</div>
                {st.description && (
                  <div className="text-body-secondary small">{st.description}</div>
                )}
                <div className="text-body-secondary small">
                  {(st.qcReports || []).length} QC logs
                </div>
              </div>
              <CBadge color={getStatusBadgeColor(st.status)}>{st.status || 'Draft'}</CBadge>
            </div>
          ))
        )}

        {set.assemblies.length === 0 ? (
          <div className="text-body-secondary small ms-3 ps-3 border-start border-secondary-subtle">
            No assemblies captured for this set.
          </div>
        ) : (
          set.assemblies.map((asm) => (
            <div
              key={asm.name}
              className="ms-3 ps-3 border-start border-secondary-subtle py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
            >
              <div>
                <div className="fw-semibold">{asm.name}</div>
                {asm.description && (
                  <div className="text-body-secondary small">{asm.description}</div>
                )}
                <div className="text-body-secondary small">
                  {(asm.qcReports || []).length} QC logs
                </div>
              </div>
              <CBadge color={getStatusBadgeColor(asm.status)}>{asm.status || 'Draft'}</CBadge>
            </div>
          ))
        )}
      </div>
    ))
  }

  const renderProjectHeader = (project, isExpanded) => (
    <div className="bg-body-secondary rounded-3 p-3 mb-3 d-flex justify-content-between align-items-start flex-wrap gap-3">
      <div>
        <div className="fw-semibold">{project.name}</div>
        <div className="text-body-secondary small">
          {project.code} • {project.system || '—'}
        </div>
        <div className="text-body-secondary small">Owner: {project.owner || 'Program Office'}</div>
      </div>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <CBadge color="warning" textColor="dark" className="px-3">
          {typeof project.category === 'object'
            ? project.category?.name ||
              project.category?.title ||
              project.category?._id ||
              'General'
            : project.category || 'General'}
        </CBadge>
        <CFormSelect
          size="sm"
          value={project.status}
          onChange={(event) => handleStatusChange(project.id, event.target.value)}
          className="w-auto"
        >
          <option>Draft</option>
          <option>In Configuration</option>
          <option>In Production</option>
          <option>Complete</option>
        </CFormSelect>
        <CButton
          color="light"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/production/create-project-wizard?edit=${project.id}`)
          }}
        >
          Edit
        </CButton>
        <CButton
          color="light"
          size="sm"
          variant="outline"
          onClick={(event) => {
            event.stopPropagation()
            setExpandedProjects((prev) => (prev === project.id ? null : project.id))
          }}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </CButton>
      </div>
    </div>
  )

  const [expandedProjects, setExpandedProjects] = useState(null)

  const renderProjectTree = () => {
    if (!projects.length) {
      return (
        <div className="text-center text-body-secondary py-5">
          No projects available. Use the Add Project button to create one.
        </div>
      )
    }

    return projects.map((project) => {
      const isExpanded = expandedProjects === project.id
      return (
        <div key={project.id} className="pb-4 mb-4 border-bottom border-dark-subtle">
          {renderProjectHeader(project, isExpanded)}
          {isExpanded && (
            <>
              {renderSetNodes(project)}
              {renderQcReports(project)}
            </>
          )}
        </div>
      )
    })
  }

  return (
    <CContainer fluid className="py-4">
      <CToaster placement="top-end" className="mt-5 me-3">
        {toast.visible && (
          <CToast
            autohide
            visible
            color={toast.color}
            onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
          >
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        )}
      </CToaster>
      <CRow>
        <CCol xs={12}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="d-flex align-items-center justify-content-between bg-body-secondary">
              <h5 className="mb-0 fw-semibold">Projects Tree</h5>
              <div className="d-flex align-items-center gap-2">
                <CBadge color="dark" textColor="light" className="px-3">
                  {projects.length} Active
                </CBadge>
                <CButton
                  color="primary"
                  size="sm"
                  className="fw-semibold"
                  onClick={() => navigate('/production/create-project-wizard')}
                >
                  <CIcon icon={cilPlus} className="me-1" /> Add Project
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody className="p-4">{renderProjectTree()}</CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CModal
        alignment="center"
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      >
        <CModalHeader className="fw-semibold">
          Project added
          <CCloseButton className="ms-auto" onClick={() => setShowSuccessModal(false)} />
        </CModalHeader>
        <CModalBody>
          Your project has been saved locally with its sets and assemblies. Keep working offline,
          add QC snapshots, and push status updates when connected to LAN.
        </CModalBody>
        <CModalFooter className="justify-content-between">
          <CButton color="secondary" variant="ghost" onClick={() => setShowSuccessModal(false)}>
            Close
          </CButton>
          <CButton
            color="primary"
            onClick={() => {
              setViewMode('table')
              setShowSuccessModal(false)
            }}
          >
            Go to project table
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}

export default ProductionTreeView
