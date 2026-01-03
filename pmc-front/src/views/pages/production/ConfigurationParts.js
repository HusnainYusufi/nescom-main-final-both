import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import partService from '../../../services/partService'
import projectService from '../../../services/projectService'

const mergeProjectsById = (existing = [], incoming = []) => {
  const map = new Map()
  ;[...existing, ...incoming].forEach((p) => {
    const id = p.id || p._id
    if (!id) return
    map.set(id, { ...p, id })
  })
  return Array.from(map.values())
}

const ConfigurationParts = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)

  const [configurations, setConfigurations] = useState({})
  const [projectsList, setProjectsList] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedSetId, setSelectedSetId] = useState('')
  const [selectedPartId, setSelectedPartId] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    shortName: '',
    category: '',
    type: '',
    level: '',
    owner: '',
    status: 'Draft',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const availableSets = useMemo(
    () => configurations[selectedProjectId]?.sets || [],
    [configurations, selectedProjectId],
  )

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const loadParts = async () => {
      setLoading(true)
      setError(null)
      try {
        const [partsData, backendProjects] = await Promise.all([
          partService.getAll().catch(() => []),
          projectService.getAll().catch(() => []),
        ])

        const grouped = {}
        const allProjects = mergeProjectsById(
          projects,
          backendProjects.length ? backendProjects : projects,
        )
        setProjectsList(allProjects)

        allProjects.forEach((p) => {
          const projectId = p.id || p._id
          if (!projectId) return
          grouped[projectId] = grouped[projectId] || { sets: [] }
          if (Array.isArray(p.sets)) {
            p.sets.forEach((set, idx) => {
              const sid = set._id || set.id || `${projectId}-set-${idx + 1}`
              if (!grouped[projectId].sets.find((s) => s.id === sid)) {
                grouped[projectId].sets.push({
                  id: sid,
                  name: set.name || `Set ${idx + 1}`,
                  description: set.description || '',
                  parts: [],
                })
              }
            })
          }
        })

        partsData.forEach((part) => {
          const projectId = part.project?._id || part.project
          if (!grouped[projectId]) grouped[projectId] = { sets: [] }
          const setId = part.assembly?._id || part.assembly || 'unassigned-set'
          const setName =
            part.assembly?.name || (setId === 'unassigned-set' ? 'Unassigned Set' : 'Assembly Set')
          if (!grouped[projectId].sets.find((s) => s.id === setId)) {
            grouped[projectId].sets.push({
              id: setId,
              name: setName,
              description: part.assembly?.notes || '',
              parts: [],
            })
          }
          const targetSet = grouped[projectId].sets.find((s) => s.id === setId)
          targetSet.parts.push({
            id: part._id,
            code: part.code,
            name: part.name,
            shortName: part.code,
            category: part.category,
            type: part.type,
            level: part.level,
            owner: part.owner,
            status: part.status,
          })
        })
        setConfigurations(grouped)
      } catch (err) {
        setConfigurations({})
        setError(err?.message || 'Unable to load parts.')
      } finally {
        setLoading(false)
      }
    }
    loadParts()
  }, [projects])

  useEffect(() => {
    const projectFromUrl = searchParams.get('project')
    if (projectFromUrl) {
      setSelectedProjectId(projectFromUrl)
      dispatch({ type: 'setActiveProject', projectId: projectFromUrl })
      return
    }

    if (activeProjectId) {
      setSelectedProjectId(activeProjectId)
    } else if (projectsList.length) {
      const fallback = projectsList[0].id
      setSelectedProjectId(fallback)
      dispatch({ type: 'setActiveProject', projectId: fallback })
    }
  }, [activeProjectId, configurations, dispatch, projectsList, searchParams])

  useEffect(() => {
    if (!selectedProjectId) return
    const currentSets = configurations[selectedProjectId]?.sets || []
    if (!currentSets.length) {
      setSelectedSetId('')
      return
    }
    if (!currentSets.find((set) => set.id === selectedSetId)) {
      setSelectedSetId(currentSets[0].id)
      setSelectedPartId('')
    }
  }, [configurations, selectedProjectId, selectedSetId])

  const handleProjectChange = (value) => {
    setSelectedProjectId(value)
    setSelectedPartId('')
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('project', value)
      dispatch({ type: 'setActiveProject', projectId: value })
    } else {
      params.delete('project')
    }
    setSearchParams(params)
  }

  const selectedSet = useMemo(() => {
    return availableSets.find((set) => set.id === selectedSetId) || null
  }, [availableSets, selectedSetId])

  const visibleParts = selectedSet?.parts || []

  const validate = () => {
    const nextErrors = {}
    if (!selectedProjectId) nextErrors.project = 'Select a project'
    if (!selectedSetId) nextErrors.set = 'Select a set'
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (!form.category) nextErrors.category = 'Choose a category'
    if (!form.type) nextErrors.type = 'Choose a type'
    if (!form.level) nextErrors.level = 'Select a level'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)
      const payload = {
        name: form.name,
        code: form.shortName?.trim() || `PART-${Date.now()}`,
        category: form.category,
        type: form.type,
        level: form.level,
        status: form.status,
        owner: form.owner,
        project: selectedProjectId,
        assembly: selectedSetId !== 'unassigned-set' ? selectedSetId : undefined,
      }
      const created = await partService.add(payload)
      const normalized = {
        id: created._id,
        code: created.code,
        name: created.name,
        shortName: created.code,
        category: created.category,
        type: created.type,
        level: created.level,
        owner: created.owner,
        status: created.status,
      }

      setConfigurations((prev) => {
        const projectConfig = prev[selectedProjectId] || { sets: [] }
        const nextSets = projectConfig.sets.map((set) =>
          set.id === selectedSetId ? { ...set, parts: [...(set.parts || []), normalized] } : set,
        )
        return {
          ...prev,
          [selectedProjectId]: { ...projectConfig, sets: nextSets },
        }
      })

      setForm({
        name: '',
        shortName: '',
        category: '',
        type: '',
        level: '',
        owner: '',
        status: 'Draft',
      })
      setSelectedPartId(normalized.id)
      setErrors({})
      setShowAddModal(false)
    } catch (err) {
      setErrors({ form: err?.message || 'Failed to add part' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CContainer fluid className="py-4">
      <CRow className="g-3">
        <CCol xs={12}>
          <CCard className="shadow-sm border-0 mb-3">
            <CCardHeader className="bg-body-secondary d-flex align-items-center justify-content-between">
              <h5 className="mb-0">Configuration Parts</h5>
              <div className="d-flex align-items-center gap-2">
                <CFormSelect
                  size="sm"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  invalid={!!errors.project}
                >
                  <option value="">Select Project</option>
                  {projectsList.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </CFormSelect>
                <CFormSelect
                  size="sm"
                  value={selectedSetId}
                  onChange={(e) => setSelectedSetId(e.target.value)}
                  disabled={!availableSets.length}
                  invalid={!!errors.set}
                >
                  <option value="">
                    {availableSets.length ? 'Select Set' : 'No sets available'}
                  </option>
                  {availableSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.name}
                    </option>
                  ))}
                </CFormSelect>
                <CButton
                  color="light"
                  size="sm"
                  className="text-primary fw-semibold"
                  onClick={() => setShowAddModal(true)}
                  disabled={!selectedSetId}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  Add Part
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody className="p-0">
              {error && (
                <div className="p-3 pt-3">
                  <CAlert color="danger" className="mb-0">
                    {error}
                  </CAlert>
                </div>
              )}
              <CTable hover responsive bordered align="middle" className="mb-0">
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell scope="col">Part Id</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Name*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Short Name</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Category*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Type*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Part Level</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Owner</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading && (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center py-4">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <CSpinner size="sm" />
                          <span>Loading parts...</span>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {!loading && !visibleParts.length && (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center text-body-secondary py-4">
                        {selectedProjectId
                          ? 'No parts found for this set.'
                          : 'Select a project and set to see configuration parts.'}
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {visibleParts.map((part) => (
                    <CTableRow key={part.id} active={part.id === selectedPartId}>
                      <CTableDataCell className="fw-semibold">
                        {part.code || part.shortName || part.id}
                      </CTableDataCell>
                      <CTableDataCell>{part.name}</CTableDataCell>
                      <CTableDataCell>{part.shortName || '—'}</CTableDataCell>
                      <CTableDataCell>{part.category}</CTableDataCell>
                      <CTableDataCell>{part.type}</CTableDataCell>
                      <CTableDataCell>{part.level}</CTableDataCell>
                      <CTableDataCell>{part.owner || '—'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={part.status === 'Qualified' ? 'success' : 'warning'}
                          className="text-dark"
                        >
                          {part.status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        alignment="center"
        scrollable
        backdrop="static"
      >
        <CForm onSubmit={handleAddPart}>
          <CModalHeader closeButton>
            <CModalTitle>Add Configuration Part</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormInput
                  label="Name*"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  invalid={!!errors.name}
                  feedbackInvalid={errors.name}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Short Name"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Category*"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  invalid={!!errors.category}
                  feedbackInvalid={errors.category}
                >
                  <option value="">Select</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Actuator">Actuator</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Processor">Processor</option>
                  <option value="Structure">Structure</option>
                  <option value="Power">Power</option>
                  <option value="Harness">Harness</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Type*"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  invalid={!!errors.type}
                  feedbackInvalid={errors.type}
                >
                  <option value="">Select</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Digital">Digital</option>
                  <option value="Composite">Composite</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Part Level*"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  invalid={!!errors.level}
                  feedbackInvalid={errors.level}
                >
                  <option value="">Select level</option>
                  <option value="L1">L1 - System</option>
                  <option value="L2">L2 - Sub System</option>
                  <option value="L3">L3 - Assembly</option>
                  <option value="L4">L4 - Sub Assembly</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Owner"
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Draft</option>
                  <option>Under Review</option>
                  <option>Qualified</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter className="d-flex justify-content-between">
            <CButton
              color="secondary"
              variant="outline"
              onClick={() =>
                setForm({
                  id: '',
                  name: '',
                  shortName: '',
                  category: '',
                  type: '',
                  level: '',
                  owner: '',
                  status: 'Draft',
                })
              }
            >
              Reset
            </CButton>
            <div className="d-flex gap-2">
              <CButton color="light" onClick={() => setShowAddModal(false)}>
                Cancel
              </CButton>
              <CButton color="primary" type="submit" disabled={!selectedSetId}>
                <CIcon icon={cilPlus} className="me-2" />
                Add Part
              </CButton>
            </div>
          </CModalFooter>
        </CForm>
      </CModal>
    </CContainer>
  )
}

export default ConfigurationParts
