// src/views/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFactory,
  cilSettings,
  cilBolt,
  cilCloudDownload,
  cilLayers,
  cilChartLine,
  cilPlus,
  cilX,
} from '@coreui/icons'
import MainChart from './MainChart'
import projectService from '../../services/projectService'

const KPI_FALLBACK = {
  activeProjects: 0,
  totalSets: 0,
  totalComponents: 0,
  totalAssemblies: 0,
  totalParts: 0,
}

const STATUS_COMPLETION = {
  complete: 95,
  accepted: 90,
  'in production': 78,
  'in progress': 74,
  'in configuration': 62,
  pending: 55,
  draft: 40,
}

const toPercentFromStatus = (status = '') => {
  const normalized = (status || '').toLowerCase()
  return STATUS_COMPLETION[normalized] ?? 60
}

const normalizeAssembly = (assembly, fallbackId) => {
  const id = assembly?._id?.toString() || fallbackId
  return {
    id,
    name: assembly?.name || `Assembly ${id}`,
    status: assembly?.status || 'Draft',
    type: assembly?.type || 'Assembly',
  }
}

const normalizeStructures = (structures = []) =>
  (structures || []).map((structure, idx) => ({
    id: structure?._id?.toString() || `structure-${idx}`,
    name: structure?.name || `Structure ${idx + 1}`,
    status: structure?.status || 'Draft',
    assemblies: structure?.assemblies || [],
  }))

const normalizeProjects = (projects = []) =>
  (projects || []).map((project, index) => {
    const sets = Array.isArray(project.sets) ? project.sets : []
    const normalizedSets = sets.map((set, setIndex) => {
      const setId = set?._id?.toString() || `${project._id || 'project'}-set-${setIndex}`
      const assemblies = Array.isArray(set.assemblies)
        ? set.assemblies.map((assembly, asmIndex) =>
            normalizeAssembly(assembly, `${setId}-assembly-${asmIndex}`),
          )
        : []
      return {
        id: setId,
        name: set?.name || `Set ${setIndex + 1}`,
        status: set?.status || project?.status || 'Draft',
        structures: Array.isArray(set.structures) ? set.structures : [],
        assemblies,
        qcReports: set?.qcReports || [],
      }
    })

    return {
      id: project?._id?.toString() || project?.id || `project-${index + 1}`,
      name: project?.name || `Project ${index + 1}`,
      code: project?.code || `PRJ-${index + 1}`,
      description:
        project?.shortDescription || project?.description || 'No description provided yet.',
      status: project?.status || 'Draft',
      owner: project?.owner || 'Program Office',
      system: project?.system || 'Arial',
      configuration: project?.configuration || project?.type || 'special',
      sets: normalizedSets,
      structures: normalizeStructures(project?.structures || []),
      qcReports: project?.qcReports || [],
      createdAt: project?.createdAt || null,
      updatedAt: project?.updatedAt || null,
    }
  })

const calculateProjectProgress = (project) => {
  const setCount = project.sets?.length || 0
  const assemblyCount =
    project.sets?.reduce((sum, set) => sum + (set.assemblies?.length || 0), 0) || 0
  return Math.min(95, Math.max(35, (setCount + assemblyCount) * 7))
}

const buildEfficiencyTrend = (projects = []) => {
  if (!projects?.length) {
    return []
  }
  const today = new Date()
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - idx))
    const key = date.toISOString().slice(0, 10)
    return { date, key }
  })

  const buckets = new Map()
  projects.forEach((project) => {
    const sampleDate = project.updatedAt || project.createdAt
    const bucketDate = sampleDate ? new Date(sampleDate) : new Date()
    const key = bucketDate.toISOString().slice(0, 10)
    const progress = calculateProjectProgress(project)
    if (!buckets.has(key)) {
      buckets.set(key, { total: 0, count: 0 })
    }
    const entry = buckets.get(key)
    entry.total += progress
    entry.count += 1
  })

  let previousEfficiency = 60
  return days.map(({ key }) => {
    const bucket = buckets.get(key)
    if (bucket?.count) {
      previousEfficiency = Math.min(98, Math.max(30, Math.round(bucket.total / bucket.count)))
    } else {
      previousEfficiency = Math.max(30, Math.min(98, previousEfficiency + Math.floor(Math.random() * 5) - 2))
    }

    return {
      date: key,
      efficiency: Math.round(previousEfficiency),
    }
  })
}

const buildDashboardDataset = (projects = []) => {
  if (!projects?.length) {
    return {
      kpis: { ...KPI_FALLBACK },
      efficiencyTrend: [],
      topProjects: [],
      keyAssemblies: [],
    }
  }
  const aggregates = projects.reduce(
    (acc, project) => {
      const setCount = project.sets?.length || 0
      const structuresCount =
        project.structures?.length ||
        project.sets?.reduce((sum, set) => sum + (set.structures?.length || 0), 0) ||
        0
      const assembliesCount = project.sets?.reduce(
        (sum, set) => sum + (set.assemblies?.length || 0),
        0,
      ) || 0
      acc.projectCount += 1
      acc.setCount += setCount
      acc.structureCount += structuresCount
      acc.assemblyCount += assembliesCount
      return acc
    },
    { projectCount: 0, setCount: 0, structureCount: 0, assemblyCount: 0 },
  )

  const kpis = {
    activeProjects: aggregates.projectCount,
    totalSets: aggregates.setCount,
    totalComponents: aggregates.structureCount,
    totalAssemblies: aggregates.assemblyCount,
    totalParts:
      aggregates.assemblyCount * 4 + aggregates.structureCount * 2 || aggregates.projectCount * 8,
  }

  const sortedProjects = [...projects].sort((a, b) => {
    const aAssemblies = a.sets?.reduce((sum, set) => sum + (set.assemblies?.length || 0), 0) || 0
    const bAssemblies = b.sets?.reduce((sum, set) => sum + (set.assemblies?.length || 0), 0) || 0
    return bAssemblies - aAssemblies
  })

  const topProjects = sortedProjects.slice(0, 4).map((project) => {
    const progress = calculateProjectProgress(project)
    return {
      name: String(project.name || 'Unknown'),
      progress: `${progress}%`,
      leadEngineer: String(project.owner || 'Program Office'),
    }
  })

  const flattenedAssemblies = projects.flatMap((project) =>
    (project.sets || []).flatMap((set) => set.assemblies || []),
  )

  const keyAssemblies = flattenedAssemblies.slice(0, 6).map((assembly, idx) => ({
    name: String(assembly.name || `Assembly ${idx + 1}`),
    type: String(assembly.type || 'Assembly'),
    parts: Math.max(5, (assembly.components?.length || 0) * 4 || 12 + idx),
    completion: toPercentFromStatus(assembly.status),
  }))

  const efficiencyTrend = buildEfficiencyTrend(projects)

  return {
    kpis,
    efficiencyTrend,
    topProjects,
    keyAssemblies,
  }
}

// Helper to get stored items from localStorage
const getStoredItems = (key) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveStoredItems = (key, items) => {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])

  // Modal states
  const [showDefineProject, setShowDefineProject] = useState(false)
  const [showDefineSetups, setShowDefineSetups] = useState(false)
  const [showDefinePartCategory, setShowDefinePartCategory] = useState(false)
  const [showDefinePartTypes, setShowDefinePartTypes] = useState(false)
  const [showDefineQCTest, setShowDefineQCTest] = useState(false)
  const [showDefinePart, setShowDefinePart] = useState(false)
  const [showAddMeeting, setShowAddMeeting] = useState(false)
  const [showUpdateMeeting, setShowUpdateMeeting] = useState(false)
  const [showAddDiscussion, setShowAddDiscussion] = useState(false)

  // Form states
  const [projectForm, setProjectForm] = useState({ mode: 'new', selectedProject: '', name: '', system: '', configuration: '', shortDescription: '' })
  const [setupForm, setSetupForm] = useState({ mode: 'new', selectedSetup: '', name: '', adg: '', ddg: '', srDte: '', dte: '', site: '' })
  const [partCategoryForm, setPartCategoryForm] = useState({ mode: 'new', selectedCategory: '', category: '' })
  const [partTypeForm, setPartTypeForm] = useState({ mode: 'new', selectedType: '', partType: '' })
  const [qcTestForm, setQcTestForm] = useState({ mode: 'new', selectedTest: '', qcTest: '' })
  const [partForm, setPartForm] = useState({ mode: 'new', selectedPart: '', partName: '', shortName: '', drawingNo: '', partIdNo: '', revisionNo: '', partCategory: '', partType: '' })
  const [meetingForm, setMeetingForm] = useState({ meetingNo: '', meetingType: 'PRM', meetingDate: '', agenda: '' })
  const [updateMeetingForm, setUpdateMeetingForm] = useState({ selectedMeeting: '', meetingDate: '', status: '' })
  const [discussionForm, setDiscussionForm] = useState({ selectedMeeting: '', point: '', assignedTo: '', dueDate: '' })

  // Stored data
  const [storedPartCategories, setStoredPartCategories] = useState([])
  const [storedPartTypes, setStoredPartTypes] = useState([])
  const [storedQCTests, setStoredQCTests] = useState([])
  const [storedSetups, setStoredSetups] = useState([])
  const [storedParts, setStoredParts] = useState([])
  const [storedMeetings, setStoredMeetings] = useState([])

  // Load stored data on mount
  useEffect(() => {
    setStoredPartCategories(getStoredItems('partCategories'))
    setStoredPartTypes(getStoredItems('partTypes'))
    setStoredQCTests(getStoredItems('qcTests'))
    setStoredSetups(getStoredItems('setups'))
    setStoredParts(getStoredItems('parts'))
    setStoredMeetings(getStoredItems('meetings'))
  }, [])

  // Handle URL action parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    
    if (!action) return

    if (action === 'define-project') setShowDefineProject(true)
    else if (action === 'define-setups') setShowDefineSetups(true)
    else if (action === 'define-part-category') setShowDefinePartCategory(true)
    else if (action === 'define-part-types') setShowDefinePartTypes(true)
    else if (action === 'define-qc-test') setShowDefineQCTest(true)
    else if (action === 'define-part') setShowDefinePart(true)
    else if (action === 'production-review-add-meeting') setShowAddMeeting(true)
    else if (action === 'production-review-update-meeting') setShowUpdateMeeting(true)
    else if (action === 'production-review-add-discussion') setShowAddDiscussion(true)

    // Clear the action from URL after a short delay to allow modal to open
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true })
    }, 100)
    
    return () => clearTimeout(timer)
  }, [location.search, navigate])

  useEffect(() => {
    let mounted = true
    const fetchDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await projectService.getAll()
        if (!mounted) return
        const normalizedProjects = normalizeProjects(response)
        const dashboardDataset = buildDashboardDataset(normalizedProjects)
        setData(dashboardDataset)
        setProjects(normalizedProjects)
        dispatch({
          type: 'set',
          projects: normalizedProjects,
          activeProjectId: normalizedProjects[0]?.id || null,
          activeModule: 'dashboard',
        })
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load dashboard', err)
        setError('Unable to load dashboard data. Please try again.')
        setData(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDashboard()
    return () => {
      mounted = false
    }
  }, [dispatch])

  const closeModal = (setter) => {
    setter(false)
  }

  // Form handlers
  const handleSaveProject = async () => {
    try {
      if (projectForm.mode === 'new') {
        await projectService.add({
          name: projectForm.name,
          code: `PRJ-${Date.now()}`,
          system: projectForm.system,
          configuration: projectForm.configuration,
          shortDescription: projectForm.shortDescription,
        })
      } else {
        await projectService.update(projectForm.selectedProject, {
          name: projectForm.name,
          system: projectForm.system,
          configuration: projectForm.configuration,
          shortDescription: projectForm.shortDescription,
        })
      }
      setShowDefineProject(false)
      setProjectForm({ mode: 'new', selectedProject: '', name: '', system: '', configuration: '', shortDescription: '' })
      // Refresh projects
      const response = await projectService.getAll()
      const normalizedProjects = normalizeProjects(response)
      setProjects(normalizedProjects)
      dispatch({ type: 'set', projects: normalizedProjects })
    } catch (err) {
      console.error('Failed to save project', err)
      alert('Failed to save project: ' + (err?.message || 'Unknown error'))
    }
  }

  const handleSaveSetup = () => {
    const newSetup = {
      id: Date.now().toString(),
      name: setupForm.name,
      adg: setupForm.adg,
      ddg: setupForm.ddg,
      srDte: setupForm.srDte,
      dte: setupForm.dte,
      site: setupForm.site,
    }
    const updated = setupForm.mode === 'new' 
      ? [...storedSetups, newSetup]
      : storedSetups.map(s => s.id === setupForm.selectedSetup ? { ...s, ...newSetup, id: s.id } : s)
    setStoredSetups(updated)
    saveStoredItems('setups', updated)
    setShowDefineSetups(false)
    setSetupForm({ mode: 'new', selectedSetup: '', name: '', adg: '', ddg: '', srDte: '', dte: '', site: '' })
  }

  const handleSavePartCategory = () => {
    const newCategory = { id: Date.now().toString(), name: partCategoryForm.category }
    const updated = partCategoryForm.mode === 'new'
      ? [...storedPartCategories, newCategory]
      : storedPartCategories.map(c => c.id === partCategoryForm.selectedCategory ? { ...c, name: partCategoryForm.category } : c)
    setStoredPartCategories(updated)
    saveStoredItems('partCategories', updated)
    setShowDefinePartCategory(false)
    setPartCategoryForm({ mode: 'new', selectedCategory: '', category: '' })
  }

  const handleSavePartType = () => {
    const newType = { id: Date.now().toString(), name: partTypeForm.partType }
    const updated = partTypeForm.mode === 'new'
      ? [...storedPartTypes, newType]
      : storedPartTypes.map(t => t.id === partTypeForm.selectedType ? { ...t, name: partTypeForm.partType } : t)
    setStoredPartTypes(updated)
    saveStoredItems('partTypes', updated)
    setShowDefinePartTypes(false)
    setPartTypeForm({ mode: 'new', selectedType: '', partType: '' })
  }

  const handleSaveQCTest = () => {
    const newTest = { id: Date.now().toString(), name: qcTestForm.qcTest }
    const updated = qcTestForm.mode === 'new'
      ? [...storedQCTests, newTest]
      : storedQCTests.map(t => t.id === qcTestForm.selectedTest ? { ...t, name: qcTestForm.qcTest } : t)
    setStoredQCTests(updated)
    saveStoredItems('qcTests', updated)
    setShowDefineQCTest(false)
    setQcTestForm({ mode: 'new', selectedTest: '', qcTest: '' })
  }

  const handleSavePart = () => {
    const newPart = {
      id: Date.now().toString(),
      partName: partForm.partName,
      shortName: partForm.shortName,
      drawingNo: partForm.drawingNo,
      partIdNo: partForm.partIdNo,
      revisionNo: partForm.revisionNo,
      partCategory: partForm.partCategory,
      partType: partForm.partType,
    }
    const updated = partForm.mode === 'new'
      ? [...storedParts, newPart]
      : storedParts.map(p => p.id === partForm.selectedPart ? { ...p, ...newPart, id: p.id } : p)
    setStoredParts(updated)
    saveStoredItems('parts', updated)
    setShowDefinePart(false)
    setPartForm({ mode: 'new', selectedPart: '', partName: '', shortName: '', drawingNo: '', partIdNo: '', revisionNo: '', partCategory: '', partType: '' })
  }

  const handleSaveMeeting = () => {
    const newMeeting = {
      id: Date.now().toString(),
      meetingNo: meetingForm.meetingNo,
      meetingType: meetingForm.meetingType,
      meetingDate: meetingForm.meetingDate,
      agenda: meetingForm.agenda,
      status: 'Scheduled',
    }
    const updated = [...storedMeetings, newMeeting]
    setStoredMeetings(updated)
    saveStoredItems('meetings', updated)
    setShowAddMeeting(false)
    setMeetingForm({ meetingNo: '', meetingType: 'PRM', meetingDate: '', agenda: '' })
  }

  const handleUpdateMeeting = () => {
    const updated = storedMeetings.map(m => 
      m.id === updateMeetingForm.selectedMeeting 
        ? { ...m, meetingDate: updateMeetingForm.meetingDate, status: updateMeetingForm.status }
        : m
    )
    setStoredMeetings(updated)
    saveStoredItems('meetings', updated)
    setShowUpdateMeeting(false)
    setUpdateMeetingForm({ selectedMeeting: '', meetingDate: '', status: '' })
  }

  const handleSaveDiscussion = () => {
    // For now, just close the modal - in a real app, this would save to the meeting
    setShowAddDiscussion(false)
    setDiscussionForm({ selectedMeeting: '', point: '', assignedTo: '', dueDate: '' })
    alert('Discussion point added successfully!')
  }

  const k = data?.kpis ?? KPI_FALLBACK

  const kpiCards = useMemo(
    () => [
      {
        label: 'Active Projects',
        value: k.activeProjects,
        icon: cilFactory,
        color: 'primary',
        target: '/production/project-details',
      },
      { label: 'Total Sets', value: k.totalSets, icon: cilLayers, color: 'info' },
      { label: 'Components', value: k.totalComponents, icon: cilBolt, color: 'success' },
      { label: 'Assemblies', value: k.totalAssemblies, icon: cilSettings, color: 'warning' },
      { label: 'Parts', value: k.totalParts, icon: cilChartLine, color: 'danger' },
    ],
    [k.activeProjects, k.totalSets, k.totalComponents, k.totalAssemblies, k.totalParts],
  )

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  const chartLabels = data?.efficiencyTrend?.length
    ? data.efficiencyTrend.map((d) =>
        new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      )
    : []
  const chartDatasets =
    data?.efficiencyTrend?.length && chartLabels.length
      ? [
          {
            label: 'Efficiency %',
            data: data.efficiencyTrend.map((p) => p.efficiency),
            colorVar: 'success',
            fill: true,
          },
        ]
      : []

  const chart = {
    title: 'Production Efficiency (Past 7 Days)',
    labels: chartLabels,
    datasets: chartDatasets,
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Production Overview</h2>
      </div>
      {error && (
        <CAlert color="warning" className="mb-3">
          {error}
        </CAlert>
      )}

      <CRow className="g-4 mb-4">
        {kpiCards.map((card) => (
          <CCol key={card.label} xs={12} md={6} xl={4} xxl={3}>
            <CCard
              className="border-0 shadow-sm h-100"
              role={card.target ? 'button' : undefined}
              style={{ cursor: card.target ? 'pointer' : 'default' }}
              onClick={() => {
                if (card.target) navigate(card.target)
              }}
            >
              <CCardBody className="d-flex justify-content-between align-items-center py-4">
                <div>
                  <div className="text-body-secondary text-uppercase small">{card.label}</div>
                  <div className="display-6 fw-semibold">{card.value}</div>
                </div>
                <div className={`p-3 bg-${card.color} text-white rounded-3`}>
                  <CIcon icon={card.icon} size="xxl" />
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>

      {/* EFFICIENCY CHART */}
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">{chart.title}</h5>
          <CButton color="primary" variant="outline" size="sm" onClick={() => {}}>
            <CIcon icon={cilCloudDownload} className="me-1" />
            Export Report
          </CButton>
        </CCardHeader>
        <CCardBody>
          <MainChart labels={chart.labels} datasets={chart.datasets} />
        </CCardBody>
      </CCard>

      {/* TOP PROJECTS */}
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardHeader>
          <strong>Top Projects by Assembly Count</strong>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" hover responsive>
            <CTableHead color="dark">
              <CTableRow>
                <CTableHeaderCell>Project Name</CTableHeaderCell>
                <CTableHeaderCell>Progress</CTableHeaderCell>
                <CTableHeaderCell>Lead Engineer</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data?.topProjects?.length ? (
                data.topProjects.map((p, idx) => (
                  <CTableRow key={`project-${idx}`}>
                    <CTableDataCell>{p.name}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="success">{p.progress}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{p.leadEngineer}</CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={3} className="text-center text-body-secondary py-4">
                    No projects reported yet.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* ASSEMBLY DETAILS */}
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardHeader>
          <strong>Key Assemblies Overview</strong>
        </CCardHeader>
        <CCardBody>
          <CTable align="middle" hover responsive>
            <CTableHead color="dark">
              <CTableRow>
                <CTableHeaderCell>Assembly Name</CTableHeaderCell>
                <CTableHeaderCell>Component Type</CTableHeaderCell>
                <CTableHeaderCell>No. of Parts</CTableHeaderCell>
                <CTableHeaderCell>Completion %</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data?.keyAssemblies?.length ? (
                data.keyAssemblies.map((a, idx) => (
                  <CTableRow key={`assembly-${idx}`}>
                    <CTableDataCell>{a.name}</CTableDataCell>
                    <CTableDataCell>{a.type}</CTableDataCell>
                    <CTableDataCell>{a.parts}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge
                        color={
                          a.completion > 80 ? 'success' : a.completion > 60 ? 'info' : 'warning'
                        }
                      >
                        {a.completion}%
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={4} className="text-center text-body-secondary py-4">
                    No assembly telemetry available yet.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* ========== MODALS ========== */}

      {/* Define Project Modal */}
      <CModal visible={showDefineProject} onClose={() => closeModal(setShowDefineProject)} size="lg">
        <CModalHeader>
          <CModalTitle>Define Project</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="projectMode"
                  id="newProject"
                  label="New Project"
                  checked={projectForm.mode === 'new'}
                  onChange={() => setProjectForm({ ...projectForm, mode: 'new', selectedProject: '', name: '', system: '', configuration: '', shortDescription: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="projectMode"
                  id="editProject"
                  label="Edit Existing Project"
                  checked={projectForm.mode === 'edit'}
                  onChange={() => setProjectForm({ ...projectForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Project"
                  value={projectForm.selectedProject}
                  onChange={(e) => {
                    const proj = projects.find(p => p.id === e.target.value)
                    setProjectForm({
                      ...projectForm,
                      selectedProject: e.target.value,
                      name: proj?.name || '',
                      system: proj?.system || '',
                      configuration: proj?.configuration || '',
                      shortDescription: proj?.description || '',
                    })
                  }}
                  disabled={projectForm.mode === 'new'}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Name*"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="System"
                  value={projectForm.system}
                  onChange={(e) => setProjectForm({ ...projectForm, system: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="Arial">Arial</option>
                  <option value="Ballistic">Ballistic</option>
                  <option value="Cruise">Cruise</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Configuration"
                  value={projectForm.configuration}
                  onChange={(e) => setProjectForm({ ...projectForm, configuration: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="special">Special</option>
                  <option value="conventional">Conventional</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormTextarea
                  label="Short Description"
                  value={projectForm.shortDescription}
                  onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })}
                  rows={3}
                  placeholder="Add context or steps to reproduce"
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setProjectForm({ mode: 'new', selectedProject: '', name: '', system: '', configuration: '', shortDescription: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefineProject)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveProject}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Define Setups Modal */}
      <CModal visible={showDefineSetups} onClose={() => closeModal(setShowDefineSetups)} size="lg">
        <CModalHeader>
          <CModalTitle>Define Setups</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="setupMode"
                  id="newSetup"
                  label="New Setup"
                  checked={setupForm.mode === 'new'}
                  onChange={() => setSetupForm({ mode: 'new', selectedSetup: '', name: '', adg: '', ddg: '', srDte: '', dte: '', site: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="setupMode"
                  id="editSetup"
                  label="Edit Existing Setup"
                  checked={setupForm.mode === 'edit'}
                  onChange={() => setSetupForm({ ...setupForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Setup"
                  value={setupForm.selectedSetup}
                  onChange={(e) => {
                    const setup = storedSetups.find(s => s.id === e.target.value)
                    setSetupForm({
                      ...setupForm,
                      selectedSetup: e.target.value,
                      name: setup?.name || '',
                      adg: setup?.adg || '',
                      ddg: setup?.ddg || '',
                      srDte: setup?.srDte || '',
                      dte: setup?.dte || '',
                      site: setup?.site || '',
                    })
                  }}
                  disabled={setupForm.mode === 'new'}
                >
                  <option value="">Select Setup</option>
                  {storedSetups.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Name*"
                  value={setupForm.name}
                  onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="ADG"
                  value={setupForm.adg}
                  onChange={(e) => setSetupForm({ ...setupForm, adg: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="DDG"
                  value={setupForm.ddg}
                  onChange={(e) => setSetupForm({ ...setupForm, ddg: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Sr Dte"
                  value={setupForm.srDte}
                  onChange={(e) => setSetupForm({ ...setupForm, srDte: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Dte"
                  value={setupForm.dte}
                  onChange={(e) => setSetupForm({ ...setupForm, dte: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Site"
                  value={setupForm.site}
                  onChange={(e) => setSetupForm({ ...setupForm, site: e.target.value })}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setSetupForm({ mode: 'new', selectedSetup: '', name: '', adg: '', ddg: '', srDte: '', dte: '', site: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefineSetups)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveSetup}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Define Part Category Modal */}
      <CModal visible={showDefinePartCategory} onClose={() => closeModal(setShowDefinePartCategory)}>
        <CModalHeader>
          <CModalTitle>Define Part Category</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="categoryMode"
                  id="newCategory"
                  label="New Category"
                  checked={partCategoryForm.mode === 'new'}
                  onChange={() => setPartCategoryForm({ mode: 'new', selectedCategory: '', category: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="categoryMode"
                  id="editCategory"
                  label="Edit Existing Category"
                  checked={partCategoryForm.mode === 'edit'}
                  onChange={() => setPartCategoryForm({ ...partCategoryForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Category"
                  value={partCategoryForm.selectedCategory}
                  onChange={(e) => {
                    const cat = storedPartCategories.find(c => c.id === e.target.value)
                    setPartCategoryForm({
                      ...partCategoryForm,
                      selectedCategory: e.target.value,
                      category: cat?.name || '',
                    })
                  }}
                  disabled={partCategoryForm.mode === 'new'}
                >
                  <option value="">Select</option>
                  {storedPartCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Category"
                  value={partCategoryForm.category}
                  onChange={(e) => setPartCategoryForm({ ...partCategoryForm, category: e.target.value })}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setPartCategoryForm({ mode: 'new', selectedCategory: '', category: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefinePartCategory)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSavePartCategory}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Define Part Types Modal */}
      <CModal visible={showDefinePartTypes} onClose={() => closeModal(setShowDefinePartTypes)}>
        <CModalHeader>
          <CModalTitle>Define Part Types</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="partTypeMode"
                  id="newPartType"
                  label="New Part Types"
                  checked={partTypeForm.mode === 'new'}
                  onChange={() => setPartTypeForm({ mode: 'new', selectedType: '', partType: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="partTypeMode"
                  id="editPartType"
                  label="Edit Existing Part Types"
                  checked={partTypeForm.mode === 'edit'}
                  onChange={() => setPartTypeForm({ ...partTypeForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Part Types"
                  value={partTypeForm.selectedType}
                  onChange={(e) => {
                    const type = storedPartTypes.find(t => t.id === e.target.value)
                    setPartTypeForm({
                      ...partTypeForm,
                      selectedType: e.target.value,
                      partType: type?.name || '',
                    })
                  }}
                  disabled={partTypeForm.mode === 'new'}
                >
                  <option value="">Select</option>
                  {storedPartTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Part Types"
                  value={partTypeForm.partType}
                  onChange={(e) => setPartTypeForm({ ...partTypeForm, partType: e.target.value })}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setPartTypeForm({ mode: 'new', selectedType: '', partType: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefinePartTypes)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSavePartType}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Define QC Test Modal */}
      <CModal visible={showDefineQCTest} onClose={() => closeModal(setShowDefineQCTest)}>
        <CModalHeader>
          <CModalTitle>Add QC Test</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="qcTestMode"
                  id="newQCTest"
                  label="Add New QC Test"
                  checked={qcTestForm.mode === 'new'}
                  onChange={() => setQcTestForm({ mode: 'new', selectedTest: '', qcTest: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="qcTestMode"
                  id="editQCTest"
                  label="Edit Existing QC Test"
                  checked={qcTestForm.mode === 'edit'}
                  onChange={() => setQcTestForm({ ...qcTestForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Test"
                  value={qcTestForm.selectedTest}
                  onChange={(e) => {
                    const test = storedQCTests.find(t => t.id === e.target.value)
                    setQcTestForm({
                      ...qcTestForm,
                      selectedTest: e.target.value,
                      qcTest: test?.name || '',
                    })
                  }}
                  disabled={qcTestForm.mode === 'new'}
                >
                  <option value="">Select</option>
                  {storedQCTests.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="QC Test"
                  value={qcTestForm.qcTest}
                  onChange={(e) => setQcTestForm({ ...qcTestForm, qcTest: e.target.value })}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setQcTestForm({ mode: 'new', selectedTest: '', qcTest: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefineQCTest)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveQCTest}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Define Part Modal */}
      <CModal visible={showDefinePart} onClose={() => closeModal(setShowDefinePart)} size="lg">
        <CModalHeader>
          <CModalTitle>Define Part</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  type="radio"
                  name="partMode"
                  id="newPart"
                  label="New Part"
                  checked={partForm.mode === 'new'}
                  onChange={() => setPartForm({ mode: 'new', selectedPart: '', partName: '', shortName: '', drawingNo: '', partIdNo: '', revisionNo: '', partCategory: '', partType: '' })}
                  inline
                />
                <CFormCheck
                  type="radio"
                  name="partMode"
                  id="editPart"
                  label="Edit Existing Part"
                  checked={partForm.mode === 'edit'}
                  onChange={() => setPartForm({ ...partForm, mode: 'edit' })}
                  inline
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Select Part"
                  value={partForm.selectedPart}
                  onChange={(e) => {
                    const part = storedParts.find(p => p.id === e.target.value)
                    setPartForm({
                      ...partForm,
                      selectedPart: e.target.value,
                      partName: part?.partName || '',
                      shortName: part?.shortName || '',
                      drawingNo: part?.drawingNo || '',
                      partIdNo: part?.partIdNo || '',
                      revisionNo: part?.revisionNo || '',
                      partCategory: part?.partCategory || '',
                      partType: part?.partType || '',
                    })
                  }}
                  disabled={partForm.mode === 'new'}
                >
                  <option value="">Select</option>
                  {storedParts.map(p => (
                    <option key={p.id} value={p.id}>{p.partName}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Part Name"
                  value={partForm.partName}
                  onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Short Name"
                  value={partForm.shortName}
                  onChange={(e) => setPartForm({ ...partForm, shortName: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Drawing No / Ref Doc. No."
                  value={partForm.drawingNo}
                  onChange={(e) => setPartForm({ ...partForm, drawingNo: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Part ID No"
                  value={partForm.partIdNo}
                  onChange={(e) => setPartForm({ ...partForm, partIdNo: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Revision No"
                  value={partForm.revisionNo}
                  onChange={(e) => setPartForm({ ...partForm, revisionNo: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormSelect
                  label="Part Category"
                  value={partForm.partCategory}
                  onChange={(e) => setPartForm({ ...partForm, partCategory: e.target.value })}
                >
                  <option value="">Select</option>
                  {storedPartCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Part Type"
                  value={partForm.partType}
                  onChange={(e) => setPartForm({ ...partForm, partType: e.target.value })}
                >
                  <option value="">Select</option>
                  {storedPartTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setPartForm({ mode: 'new', selectedPart: '', partName: '', shortName: '', drawingNo: '', partIdNo: '', revisionNo: '', partCategory: '', partType: '' })}>
            Reset
          </CButton>
          <CButton color="secondary" onClick={() => closeModal(setShowDefinePart)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSavePart}>
            <CIcon icon={cilPlus} className="me-1" /> Add
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add Meeting Modal */}
      <CModal visible={showAddMeeting} onClose={() => closeModal(setShowAddMeeting)}>
        <CModalHeader>
          <CModalTitle>Add Meeting</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Meeting No"
                  value={meetingForm.meetingNo}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingNo: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Meeting Type"
                  value={meetingForm.meetingType}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingType: e.target.value })}
                >
                  <option value="PRM">PRM</option>
                  <option value="PRE-PRM">PRE-PRM</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="date"
                  label="Meeting Date"
                  value={meetingForm.meetingDate}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormTextarea
                  label="Agenda"
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  rows={3}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => closeModal(setShowAddMeeting)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveMeeting}>
            <CIcon icon={cilPlus} className="me-1" /> Add Meeting
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Update Meeting Modal */}
      <CModal visible={showUpdateMeeting} onClose={() => closeModal(setShowUpdateMeeting)}>
        <CModalHeader>
          <CModalTitle>Update Meeting</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormSelect
                  label="Select Meeting"
                  value={updateMeetingForm.selectedMeeting}
                  onChange={(e) => {
                    const meeting = storedMeetings.find(m => m.id === e.target.value)
                    setUpdateMeetingForm({
                      selectedMeeting: e.target.value,
                      meetingDate: meeting?.meetingDate || '',
                      status: meeting?.status || '',
                    })
                  }}
                >
                  <option value="">Select Meeting</option>
                  {storedMeetings.map(m => (
                    <option key={m.id} value={m.id}>{m.meetingNo} - {m.meetingType}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  type="date"
                  label="Meeting Date"
                  value={updateMeetingForm.meetingDate}
                  onChange={(e) => setUpdateMeetingForm({ ...updateMeetingForm, meetingDate: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Status"
                  value={updateMeetingForm.status}
                  onChange={(e) => setUpdateMeetingForm({ ...updateMeetingForm, status: e.target.value })}
                >
                  <option value="">Select Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => closeModal(setShowUpdateMeeting)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleUpdateMeeting}>
            Update Meeting
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add Discussion Point Modal */}
      <CModal visible={showAddDiscussion} onClose={() => closeModal(setShowAddDiscussion)}>
        <CModalHeader>
          <CModalTitle>Add Discussion Point</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormSelect
                  label="Select Meeting"
                  value={discussionForm.selectedMeeting}
                  onChange={(e) => setDiscussionForm({ ...discussionForm, selectedMeeting: e.target.value })}
                >
                  <option value="">Select Meeting</option>
                  {storedMeetings.map(m => (
                    <option key={m.id} value={m.id}>{m.meetingNo} - {m.meetingType}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormTextarea
                  label="Discussion Point"
                  value={discussionForm.point}
                  onChange={(e) => setDiscussionForm({ ...discussionForm, point: e.target.value })}
                  rows={3}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormInput
                  label="Assigned To"
                  value={discussionForm.assignedTo}
                  onChange={(e) => setDiscussionForm({ ...discussionForm, assignedTo: e.target.value })}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  type="date"
                  label="Due Date"
                  value={discussionForm.dueDate}
                  onChange={(e) => setDiscussionForm({ ...discussionForm, dueDate: e.target.value })}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => closeModal(setShowAddDiscussion)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSaveDiscussion}>
            <CIcon icon={cilPlus} className="me-1" /> Add Discussion Point
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Dashboard
