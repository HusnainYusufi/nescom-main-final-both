import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import buildConfigService from '../../../services/buildConfigService'
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

const columns = ['Part Id#', 'Part Name*', 'Qty*', 'Order#', 'Prod Status*', 'HW View', 'QC']

const BuildConfiguration = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectsList, setProjectsList] = useState([])
  const [configsByProject, setConfigsByProject] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentRows = useMemo(
    () => configsByProject[selectedProjectId]?.rows || [],
    [configsByProject, selectedProjectId],
  )

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

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
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('project', fallback)
        return params
      })
    }
  }, [activeProjectId, dispatch, projectsList, searchParams, setSearchParams])

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId)
    dispatch({ type: 'setActiveProject', projectId })
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (projectId) params.set('project', projectId)
      else params.delete('project')
      return params
    })
  }

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true)
      setError(null)
      try {
        const [data, backendProjects] = await Promise.all([
          buildConfigService.getAll(),
          projectService.getAll().catch(() => []),
        ])
        const allProjects = mergeProjectsById(
          projects,
          backendProjects.length ? backendProjects : projects,
        )
        setProjectsList(allProjects)

        const grouped = {}
        allProjects.forEach((p) => {
          const projectId = p.id || p._id
          if (projectId) grouped[projectId] = { projectName: p.name, rows: [] }
        })

        data.forEach((cfg) => {
          const projectId = cfg.project?._id || cfg.project
          if (!grouped[projectId]) {
            grouped[projectId] = { projectName: cfg.project?.name || 'Project', rows: [] }
          }
          const status = cfg.status || 'Draft'
          const items = Array.isArray(cfg.items) ? cfg.items : []
          items.forEach((item, idx) => {
            grouped[projectId].rows.push({
              id: item.part?._id || item.part || `item-${idx}`,
              projectId,
              name: item.part?.name || item.partName || 'Part',
              quantity: item.quantity ?? 0,
              order: item.position ?? idx + 1,
              productionStatus: status,
              hardwareView: item.hardwareView ?? '—',
              qc: item.notes || '—',
            })
          })
        })

        setConfigsByProject(grouped)
        if (!selectedProjectId && Object.keys(grouped).length) {
          const firstProject = Object.keys(grouped)[0]
          setSelectedProjectId(firstProject)
          dispatch({ type: 'setActiveProject', projectId: firstProject })
        }
      } catch (err) {
        setConfigsByProject({})
        setError(err?.message || 'Unable to load build configurations.')
      } finally {
        setLoading(false)
      }
    }
    loadConfigs()
  }, [dispatch, projects, selectedProjectId])

  return (
    <CContainer fluid className="py-4">
      <CRow className="align-items-center mb-3">
        <CCol>
          <h4 className="mb-1">Build Configuration</h4>
          <p className="text-body-secondary mb-0">
            Review build rows for the selected project without the on-screen tree view.
          </p>
        </CCol>
        <CCol xs="12" md="4" className="text-md-end mt-3 mt-md-0">
          <CFormSelect
            aria-label="Select project"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            <option value="">Select Project</option>
            {projectsList.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </CFormSelect>
        </CCol>
      </CRow>

      <CCard className="shadow-sm border-0">
        <CCardHeader className="bg-body-secondary d-flex flex-wrap align-items-center justify-content-between">
          <div className="fw-semibold">Configuration Summary</div>
          <div className="d-flex flex-wrap gap-3 small text-body">
            <span>
              Project:{' '}
              <CBadge color="primary" className="ms-1">
                {configsByProject[selectedProjectId]?.projectName || 'N/A'}
              </CBadge>
            </span>
            <span>
              Build Configs:{' '}
              <CBadge color="info" className="text-dark ms-1">
                {currentRows.length}
              </CBadge>
            </span>
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
          <CTable responsive hover className="mb-0">
            <CTableHead className="bg-body-secondary text-primary-emphasis">
              <CTableRow>
                {columns.map((column) => (
                  <CTableHeaderCell key={column} scope="col" className="small text-uppercase">
                    {column}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {loading && (
                <CTableRow>
                  <CTableDataCell colSpan={columns.length} className="text-center py-4">
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <CSpinner size="sm" />
                      <span>Loading build configurations...</span>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )}
              {!loading && !currentRows.length && (
                <CTableRow>
                  <CTableDataCell
                    colSpan={columns.length}
                    className="text-center py-4 text-body-secondary"
                  >
                    {selectedProjectId
                      ? 'No build configurations available for this project.'
                      : 'Select a project to view build configurations.'}
                  </CTableDataCell>
                </CTableRow>
              )}
              {currentRows.map((part) => (
                <CTableRow key={`${part.id}-${part.order}`}>
                  <CTableDataCell>
                    <div className="fw-semibold">{part.id}</div>
                    <div className="text-body-secondary small">{part.projectId || '—'}</div>
                  </CTableDataCell>
                  <CTableDataCell className="fw-semibold text-primary">{part.name}</CTableDataCell>
                  <CTableDataCell>{part.quantity}</CTableDataCell>
                  <CTableDataCell>{part.order}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color="info" className="text-dark">
                      {part.productionStatus}
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{part.hardwareView}</CTableDataCell>
                  <CTableDataCell>{part.qc}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default BuildConfiguration
