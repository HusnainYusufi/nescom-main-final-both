import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CButton,
  CRow,
  CCol,
  CAlert,
  CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFactory, cilMediaPlay } from '@coreui/icons'
import { TourProvider, useTour } from '@reactour/tour'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import projectService from '../../../services/projectService'
import statusService from '../../../services/statusService'
import productionReviewService from '../../../services/productionReviewService'

const ProjectSummaryInner = () => {
  const { setIsOpen } = useTour()
  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [projectsList, setProjectsList] = useState([])
  const [selectedSetId, setSelectedSetId] = useState('all')

  // Parse search params from location (works with HashRouter)
  const getSearchParam = (key) => {
    const search = location.search || (location.hash?.includes('?') ? location.hash.split('?')[1] : '')
    const params = new URLSearchParams(search)
    return params.get(key)
  }
  
  const setParam = getSearchParam('set')
  const projectParam = getSearchParam('project')

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    if (setParam) {
      setSelectedSetId(setParam)
      return
    }
    setSelectedSetId('all')
  }, [activeProjectId, setParam])

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')
      try {
        const projectList = projects?.length ? projects : await projectService.getAll()
        setProjectsList(projectList || [])
        const selected =
          projectList.find((p) =>
            String(p._id || p.id) === String(projectParam || activeProjectId || ''),
          ) || projectList[0]
        if (!selected) {
          setSummary(null)
          setLoading(false)
          return
        }

        const projectId = selected._id || selected.id
        if (projectId && String(activeProjectId) !== String(projectId)) {
          dispatch({ type: 'setActiveProject', projectId })
        }

        const [statuses, discussionPoints] = await Promise.all([
          statusService.getAll({ project: projectId }).catch(() => []),
          productionReviewService.getDiscussionPoints({ project: projectId }).catch(() => []),
        ])

        const latestStatusBySet = new Map()
        const latestStatusByAssemblyType = new Map()
        statuses.forEach((entry) => {
          const setKey = entry.set?._id || entry.set
          const asmKey = entry.assembly?._id || entry.assembly
          const statusType = entry.statusType || 'CURRENT'
          const updatedAt =
            statusType === 'CURRENT'
              ? entry.updatedOn
                ? new Date(entry.updatedOn).getTime()
                : 0
              : entry.meeting?.meetingDate
                ? new Date(entry.meeting.meetingDate).getTime()
                : entry.updatedOn
                  ? new Date(entry.updatedOn).getTime()
                  : 0
          if (setKey && statusType === 'CURRENT') {
            const existing = latestStatusBySet.get(setKey)
            const existingDate = existing?.updatedOn ? new Date(existing.updatedOn).getTime() : 0
            if (!existing || updatedAt >= existingDate) latestStatusBySet.set(setKey, entry)
          }
          if (asmKey) {
            const key = `${asmKey}-${statusType}`
            const existing = latestStatusByAssemblyType.get(key)
            const existingDate = existing?.updatedAt || 0
            if (!existing || updatedAt >= existingDate) {
              latestStatusByAssemblyType.set(key, { ...entry, updatedAt })
            }
          }
        })

        const sets = (selected.sets || []).map((set) => {
          const setId = set._id || set.id
          const entry = latestStatusBySet.get(setId)
          return {
            id: setId || set.name || '',
            name: set.name || 'Set',
            code: set.code || '—',
            completion: Number(set.progress ?? 0),
            currentStatus: entry?.remarks || entry?.status || set.status || 'Draft',
          }
        })

        const latestDiscussionBySet = new Map()
        discussionPoints.forEach((point) => {
          const setId = point.set?._id || point.set
          if (!setId) return
          const meetingDate = point.meeting?.meetingDate
            ? new Date(point.meeting.meetingDate).getTime()
            : 0
          const existing = latestDiscussionBySet.get(setId)
          if (!existing || meetingDate >= existing.meetingDate) {
            latestDiscussionBySet.set(setId, {
              meetingNo: point.meeting?.meetingNo || '—',
              discussionPoint: point.discussionPoint || '—',
              meetingDate,
            })
          }
        })

        const assemblies = []
        ;(selected.sets || []).forEach((set) => {
          const structures = set.structures || []
          structures.forEach((structure) => {
            const group = {
              setId: set._id || set.id || '',
              setName: set.name || 'Set',
              type: structure.name || 'Structure',
              parts: [],
            }
            ;(structure.assemblies || []).forEach((assembly) => {
              const asmId = assembly._id || assembly.id || assembly
              const prmEntry = latestStatusByAssemblyType.get(`${asmId}-PRM`) || null
              const currentEntry = latestStatusByAssemblyType.get(`${asmId}-CURRENT`) || null
              group.parts.push({
                name: assembly.name || 'Assembly',
                prmEcd: prmEntry?.meeting?.meetingDate || prmEntry?.updatedOn || null,
                currentStatus: currentEntry?.status || currentEntry?.remarks || 'Draft',
                revisedEcd: currentEntry?.revisedEcd || currentEntry?.updatedOn || null,
              })
            })
            if (group.parts.length) assemblies.push(group)
          })
        })

        setSummary({
          project: {
            name: selected.name || 'Project',
            code: selected.code || '—',
            manager: selected.owner || selected.manager || 'Program Office',
            priority: selected.priority || 'Standard',
          },
          sets,
          assemblies,
          discussionBySet: latestDiscussionBySet,
        })
      } catch (err) {
        setError(err?.message || 'Unable to load project review data.')
        setSummary(null)
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [activeProjectId, dispatch, projects, projectParam])

  useEffect(() => {
    if (!summary || selectedSetId === 'all') return
    const stillExists = summary.sets.some((set) => String(set.id) === String(selectedSetId))
    if (!stillExists) setSelectedSetId('all')
  }, [selectedSetId, summary])

  if (!summary) return null

  const project = summary.project
  const visibleSets =
    selectedSetId && selectedSetId !== 'all'
      ? summary.sets.filter((set) => String(set.id) === String(selectedSetId))
      : summary.sets
  const visibleAssemblies =
    selectedSetId && selectedSetId !== 'all'
      ? summary.assemblies.filter((group) => String(group.setId) === String(selectedSetId))
      : summary.assemblies

  const statusColor = (status = '') => {
    const normalized = String(status).toLowerCase()
    if (normalized.includes('delivered') || normalized.includes('complete')) return 'success'
    if (normalized.includes('available') || normalized.includes('integration')) return 'info'
    if (normalized.includes('casting') || normalized.includes('fabrication')) return 'primary'
    if (normalized.includes('testing') || normalized.includes('qc')) return 'warning'
    return 'secondary'
  }

  const formatDate = (value) => {
    if (!value) return ''
    const d = new Date(value)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = String(d.getFullYear()).slice(-2)
    return `${day} ${month}, ${year}`
  }

  // Compute discussion entry
  const discussionEntry = (() => {
    if (!summary?.discussionBySet) return null
    if (selectedSetId && selectedSetId !== 'all') {
      return summary.discussionBySet.get(selectedSetId) || null
    }
    const firstSet = summary.sets?.[0]
    if (!firstSet) return null
    return summary.discussionBySet.get(firstSet.id) || null
  })()

  return (
    <>
      <CCard className="border-0 shadow-sm fade-in">
        {/* Header with project info and inline dropdowns */}
        <CCardHeader className="bg-dark text-white rounded-top py-2" data-tour="header">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h5 className="fw-bold mb-0">
                <CIcon icon={cilFactory} className="me-2" />
                {project.name}
              </h5>
              <div className="small text-light opacity-75">
                Code: {project.code} • Manager: {project.manager} • Priority:{' '}
                <CBadge color="danger">{project.priority}</CBadge>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap tour-filters">
              <CFormSelect
                size="sm"
                value={activeProjectId || ''}
                onChange={(e) => dispatch({ type: 'setActiveProject', projectId: e.target.value })}
                style={{ minWidth: '140px' }}
              >
                <option value="">Select Project</option>
                {projectsList.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>
                    {p.name || p.code || 'Project'}
                  </option>
                ))}
              </CFormSelect>
              <CFormSelect
                size="sm"
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                disabled={!summary.sets.length}
                style={{ minWidth: '120px' }}
              >
                <option value="all">Select Set</option>
                {summary.sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </CFormSelect>
              <CButton
                color="success"
                variant="outline"
                size="sm"
                className="rounded-pill fw-semibold"
                onClick={() => setIsOpen(true)}
              >
                <CIcon icon={cilMediaPlay} className="me-1" />
                Start Tour
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-3">
          {error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
          {loading && <CAlert color="info" className="mb-3">Loading project review...</CAlert>}

          {/* Side-by-side layout: Project Sets (left) | Structure Tables (right) */}
          <CRow className="g-3">
            {/* Left Column: Project Sets */}
            <CCol lg={3}>
              <h6 className="fw-bold text-primary border-bottom pb-1 mb-2 tour-sets">
                Project Sets
              </h6>
              <CTable bordered hover responsive size="sm" className="align-middle shadow-sm mb-0">
                <CTableHead className="table-dark">
                  <CTableRow className="text-center">
                    <CTableHeaderCell>Set Name</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>%</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {visibleSets.map((set, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell className="fw-medium">{set.name}</CTableDataCell>
                      <CTableDataCell className="text-center">{set.code}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge
                          color={set.completion > 80 ? 'success' : set.completion > 50 ? 'info' : 'warning'}
                        >
                          {set.completion}%
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={statusColor(set.currentStatus)}>{set.currentStatus}</CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCol>

            {/* Right Column: Structure Tables */}
            <CCol lg={9}>
              {visibleAssemblies.length === 0 ? (
                <div className="text-muted text-center py-4">No assemblies found for this selection.</div>
              ) : (
                visibleAssemblies.map((group, index) => (
                  <div key={index} className="mb-3">
                    <h6
                      className="fw-bold text-success border-bottom pb-1 mb-2"
                      data-tour={group.type.toLowerCase().replace(/\s+/g, '-')}
                    >
                      {group.type}
                    </h6>
                    <CTable bordered hover responsive size="sm" className="align-middle shadow-sm mb-0">
                      <CTableHead className="table-dark">
                        <CTableRow className="text-center">
                          <CTableHeaderCell style={{ width: '30%' }}>Assy / Part</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '20%' }}>PRM-95 ECD</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '30%' }}>Current Status</CTableHeaderCell>
                          <CTableHeaderCell style={{ width: '20%' }}>Revised ECD</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {group.parts.map((part, i) => (
                          <CTableRow key={i}>
                            <CTableDataCell className="fw-medium">{part.name}</CTableDataCell>
                            <CTableDataCell className="text-center text-muted small">
                              {formatDate(part.prmEcd) || '—'}
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                              <CBadge color={statusColor(part.currentStatus)}>
                                {part.currentStatus}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell className="text-center text-muted small">
                              {formatDate(part.revisedEcd) || '—'}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                ))
              )}
            </CCol>
          </CRow>

          {/* Discussion Point Section */}
          <div className="mt-3 border rounded p-2 bg-warning bg-opacity-10 d-flex align-items-start gap-3 discussion-point">
            <div className="fw-bold text-warning" style={{ minWidth: '120px' }}>
              Discussion Point
            </div>
            <div className="flex-grow-1">
              <span className="text-muted small me-2">
                PRM No: <strong>{discussionEntry?.meetingNo || '—'}</strong>
              </span>
              <span className="fw-medium">
                {discussionEntry?.discussionPoint || 'No discussion points available.'}
              </span>
            </div>
          </div>
        </CCardBody>

        <style>
          {`
          .fade-in { animation: fadeIn 0.3s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          [data-tour-elem='highlighted'] {
            box-shadow: 0 0 0 3px #0d6efd, 0 0 20px #0d6efd88;
            border-radius: 8px;
          }
          `}
        </style>
      </CCard>
    </>
  )
}

// Guided Tour Steps
const steps = [
  { selector: '[data-tour="header"]', content: 'Project header with info and filters.' },
  { selector: '.tour-filters', content: 'Select project and set to filter the view.' },
  { selector: '.tour-sets', content: 'Project sets with completion status.' },
  { selector: '[data-tour="mechanical-structure"]', content: 'Mechanical structure assemblies.' },
  { selector: '.discussion-point', content: 'Latest discussion point from PRM meeting.' },
]

const ProjectSummaryOverview = () => (
  <TourProvider
    steps={steps}
    disableInteraction
    styles={{
      popover: {
        backgroundColor: '#1e1e2f',
        color: '#fff',
        padding: '18px 20px',
        borderRadius: '12px',
        boxShadow: '0 0 20px rgba(0,0,0,0.6)',
        maxWidth: 360,
      },
      badge: { backgroundColor: '#0d6efd', color: '#fff' },
      arrow: { color: '#0d6efd' },
      close: { color: '#fff' },
    }}
  >
    <ProjectSummaryInner />
  </TourProvider>
)

export default ProjectSummaryOverview
