import React, { useEffect, useMemo, useState } from 'react'
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
import { useSearchParams } from 'react-router-dom'
import projectService from '../../../services/projectService'
import statusService from '../../../services/statusService'
import productionReviewService from '../../../services/productionReviewService'

const ProjectSummaryInner = () => {
  const { setIsOpen } = useTour()
  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [projectsList, setProjectsList] = useState([])
  const [selectedSetId, setSelectedSetId] = useState('all')

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const setParam = searchParams.get('set')
    if (setParam) {
      setSelectedSetId(setParam)
      return
    }
    setSelectedSetId('all')
  }, [activeProjectId, searchParams])

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')
      try {
        const projectList = projects?.length ? projects : await projectService.getAll()
        setProjectsList(projectList || [])
        const projectParam = searchParams.get('project')
        const selected =
          projectList.find((p) =>
            String(p._id || p.id) === String(projectParam || activeProjectId),
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
            code: set.code || setId || '—',
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
              group.parts.push({
                name: assembly.name || 'Assembly',
                lastPrmStatus: latestStatusByAssemblyType.get(`${asmId}-PRM`) || null,
                currentStatus: latestStatusByAssemblyType.get(`${asmId}-CURRENT`) || null,
                lastPrePrmStatus: latestStatusByAssemblyType.get(`${asmId}-PRE-PRM`) || null,
              })
            })
            if (group.parts.length) assemblies.push(group)
          })
        })

        setSummary({
          project: {
            name: selected.name || 'Project',
            code: selected.code || selected._id || '—',
            manager: selected.owner || selected.manager || '—',
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
  }, [activeProjectId, dispatch, projects, searchParams])

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
    const normalized = status.toLowerCase()
    if (normalized.includes('integration') || normalized.includes('complete')) return 'success'
    if (normalized.includes('casting')) return 'primary'
    if (normalized.includes('qc')) return 'info'
    if (normalized.includes('maintenance') || normalized.includes('ablative')) return 'warning'
    if (normalized.includes('testing') || normalized.includes('fabrication')) return 'warning'
    return 'secondary'
  }

  const formatDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '—')

  const renderStatusDetails = (entry) => {
    if (!entry) return <span className="text-body-secondary">—</span>
    const statusText = entry?.remarks || entry?.status || '—'
    const dateValue = entry.meeting?.meetingDate || entry.updatedOn
    return (
      <div className="d-flex flex-column gap-1">
        <CBadge color={statusColor(entry.status || statusText)}>{entry.status || statusText}</CBadge>
        {entry.meeting?.meetingNo && (
          <div className="small text-body-secondary">{entry.meeting.meetingNo}</div>
        )}
        {dateValue && (
          <div className="small text-body-secondary">ECD: {formatDate(dateValue)}</div>
        )}
        {entry.remarks && <div className="small">{entry.remarks}</div>}
      </div>
    )
  }

  const discussionEntry = useMemo(() => {
    if (!summary?.discussionBySet) return null
    if (selectedSetId && selectedSetId !== 'all') {
      return summary.discussionBySet.get(selectedSetId) || null
    }
    const firstSet = summary.sets?.[0]
    if (!firstSet) return null
    return summary.discussionBySet.get(firstSet.id) || null
  }, [summary, selectedSetId])

  return (
    <>
      {/* ─── Header ─── */}
      <CCard className="border-0 shadow-sm fade-in">
        <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center rounded-top" data-tour="header">
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
          <CButton color="success" variant="outline" className="rounded-pill fw-semibold" onClick={() => setIsOpen(true)}>
            <CIcon icon={cilMediaPlay} className="me-2" />
            Start Project Tour
          </CButton>
        </CCardHeader>

        <CCardBody className="pb-4">
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}
          {loading && (
            <CAlert color="info" className="mb-3">
              Loading project review...
            </CAlert>
          )}
          <CRow className="g-3 mb-3 tour-filters">
            <CCol md={6}>
              <CFormSelect
                label="Select Project"
                value={activeProjectId || ''}
                onChange={(event) =>
                  dispatch({ type: 'setActiveProject', projectId: event.target.value })
                }
              >
                <option value="">Select project</option>
                {projectsList.map((projectItem) => (
                  <option key={projectItem._id || projectItem.id} value={projectItem._id || projectItem.id}>
                    {projectItem.name || projectItem.code || 'Project'}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={6}>
              <CFormSelect
                label="Select Set"
                value={selectedSetId}
                onChange={(event) => setSelectedSetId(event.target.value)}
                disabled={!summary.sets.length}
              >
                <option value="all">All sets</option>
                {summary.sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="g-4">
            <CCol lg={4}>
              <h6 className="fw-bold text-info border-bottom pb-1 mb-2 tour-sets">
                Project Sets
              </h6>
              <CTable bordered hover responsive className="align-middle shadow-sm mb-4">
                <CTableHead color="dark">
                  <CTableRow className="text-white text-center">
                    <CTableHeaderCell>Set Name</CTableHeaderCell>
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Completion %</CTableHeaderCell>
                    <CTableHeaderCell>Current Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {visibleSets.map((set, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>{set.name}</CTableDataCell>
                      <CTableDataCell>{set.code}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={
                            set.completion > 80 ? 'success' : set.completion > 60 ? 'info' : 'warning'
                          }
                        >
                          {set.completion}%
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={statusColor(set.currentStatus)}>{set.currentStatus}</CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCol>

            <CCol lg={8}>
              {visibleAssemblies.map((a, index) => (
                <div key={index} className="mb-4">
                  <h6
                    className="fw-bold text-info border-bottom pb-1 mb-2"
                    data-tour={a.type.toLowerCase()}
                  >
                    {a.type}
                  </h6>
                  <CTable bordered hover responsive className="align-middle shadow-sm">
                    <CTableHead color="dark">
                      <CTableRow className="text-center text-white">
                        <CTableHeaderCell>Assy / Part</CTableHeaderCell>
                        <CTableHeaderCell>Last PRM Status</CTableHeaderCell>
                        <CTableHeaderCell>Current Status</CTableHeaderCell>
                        <CTableHeaderCell>Last PRE-PRM Status</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {a.parts.map((p, i) => (
                        <CTableRow key={i}>
                          <CTableDataCell>{p.name}</CTableDataCell>
                          <CTableDataCell>{renderStatusDetails(p.lastPrmStatus)}</CTableDataCell>
                          <CTableDataCell>{renderStatusDetails(p.currentStatus)}</CTableDataCell>
                          <CTableDataCell>{renderStatusDetails(p.lastPrePrmStatus)}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              ))}
            </CCol>
          </CRow>

          <div className="mt-4 border rounded-3 p-3 bg-body-secondary d-flex flex-column flex-md-row gap-3 align-items-stretch discussion-point">
            <div className="fw-semibold text-uppercase text-body-secondary">Discussion Point</div>
            <div className="border-start border-2 ps-md-3 flex-grow-1">
              <div className="small text-body-secondary">
                PRM No: <span className="fw-semibold">{discussionEntry?.meetingNo || '—'}</span>
              </div>
              <div className="fw-semibold mt-2">
                {discussionEntry?.discussionPoint || 'Discussion point comes here'}
              </div>
            </div>
          </div>
        </CCardBody>

        <style>
          {`
          .fade-in { animation: fadeIn 0.4s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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

// ─── Guided Tour Steps ───
const steps = [
  { selector: '[data-tour="header"]', content: 'Project header with key info and tour start button.' },
  { selector: '.tour-filters', content: 'Pick a project and optionally filter to a set.' },
  { selector: '.tour-sets', content: 'Each set under the project with current completion percentage.' },
  { selector: '[data-tour="mechanical"]', content: 'Mechanical assemblies and their PRM status.' },
  { selector: '[data-tour="electrical"]', content: 'Electrical assemblies and progress.' },
  { selector: '.discussion-point', content: 'Latest discussion point tied to the last PRM meeting.' },
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
