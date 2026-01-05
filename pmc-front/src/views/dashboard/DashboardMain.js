// src/views/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFactory,
  cilSettings,
  cilBolt,
  cilCloudDownload,
  cilLayers,
  cilChartLine,
} from '@coreui/icons'
import { jsPDF } from 'jspdf'
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
  const normalized = status.toLowerCase()
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
  structures.map((structure, idx) => ({
    id: structure?._id?.toString() || `structure-${idx}`,
    name: structure?.name || `Structure ${idx + 1}`,
    status: structure?.status || 'Draft',
    assemblies: structure?.assemblies || [],
  }))

const normalizeProjects = (projects = []) =>
  projects.map((project, index) => {
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
      system: project?.system || 'Systems',
      projectType: project?.type || 'Special',
      category:
        (typeof project?.category === 'object' ? project?.category?.name : project?.category) ||
        'General',
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
  return days.map(({ date, key }) => {
    const bucket = buckets.get(key)
    if (bucket?.count) {
      previousEfficiency = Math.min(98, Math.max(30, Math.round(bucket.total / bucket.count)))
    } else {
      previousEfficiency = Math.max(30, Math.min(98, previousEfficiency - 2 + Math.random() * 4))
    }

    return {
      date: key,
      efficiency: previousEfficiency,
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
      )
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
      name: project.name,
      progress: `${progress}%`,
      leadEngineer: project.owner || 'Program Office',
    }
  })

  const flattenedAssemblies = projects.flatMap((project) =>
    (project.sets || []).flatMap((set) => set.assemblies || []),
  )

  const keyAssemblies = flattenedAssemblies.slice(0, 6).map((assembly, idx) => ({
    name: assembly.name,
    type: assembly.type || 'Assembly',
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

const Dashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

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
        dispatch({
          type: 'set',
          projects: normalizedProjects,
          activeProjectId: normalizedProjects[0]?.id || null,
          activeModule: 'dashboard',
        })
      } catch (err) {
        if (!mounted) return
        console.error('Failed to load dashboard', err)
        setError(err?.message || 'Unable to load dashboard data.')
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

  const handleExportReport = () => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('PMC Production Report', 14, 18)
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

    doc.setFont(undefined, 'bold')
    doc.text('KPIs', 14, 36)
    doc.setFont(undefined, 'normal')
    const kpiLines = Object.entries(data.kpis).map(
      ([label, value]) => `${label.replace(/([A-Z])/g, ' $1')}: ${value}`,
    )
    kpiLines.forEach((line, idx) => doc.text(line, 14, 44 + idx * 6))

    doc.setFont(undefined, 'bold')
    doc.text('Top Projects', 14, 70)
    doc.setFont(undefined, 'normal')
    data.topProjects.forEach((proj, idx) => {
      doc.text(
        `${idx + 1}. ${proj.name} - ${proj.progress} (${proj.leadEngineer})`,
        14,
        78 + idx * 6,
      )
    })

    doc.setFont(undefined, 'bold')
    doc.text('Key Assemblies', 14, 106)
    doc.setFont(undefined, 'normal')
    data.keyAssemblies.forEach((asm, idx) => {
      doc.text(
        `${idx + 1}. ${asm.name} | ${asm.type} | Parts: ${asm.parts} | ${asm.completion}%`,
        14,
        114 + idx * 6,
      )
    })

    const blobUrl = doc.output('bloburl')
    window.open(blobUrl, '_blank', 'noopener')
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
          <CButton color="primary" variant="outline" size="sm" onClick={handleExportReport}>
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
          <strong>Top Performing Projects</strong>
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
                data.topProjects.map((p) => (
                  <CTableRow key={p.name}>
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
                data.keyAssemblies.map((a) => (
                  <CTableRow key={a.name}>
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
    </>
  )
}

export default Dashboard
