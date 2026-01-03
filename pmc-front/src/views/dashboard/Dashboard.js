// src/views/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react'
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
import MainChart from './MainChart'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    // Mock dummy data for PMC Production Dashboard (focused only on production)
    setTimeout(() => {
      setData({
        kpis: {
          activeProjects: 12,
          totalSets: 58,
          totalComponents: 186,
          totalAssemblies: 92,
          totalParts: 431,
        },
        efficiencyTrend: [
          { date: '2025-10-28', efficiency: 72 },
          { date: '2025-10-29', efficiency: 75 },
          { date: '2025-10-30', efficiency: 78 },
          { date: '2025-10-31', efficiency: 83 },
          { date: '2025-11-01', efficiency: 81 },
          { date: '2025-11-02', efficiency: 84 },
          { date: '2025-11-03', efficiency: 88 },
        ],
        topProjects: [
          { name: 'Aerial Defense System', progress: '85%', leadEngineer: 'Eng. Saad Qureshi' },
          { name: 'Radar Control Unit', progress: '70%', leadEngineer: 'Eng. Zara Mehmood' },
          { name: 'Cruise Launcher Mk-II', progress: '62%', leadEngineer: 'Eng. Khalid Bashir' },
          { name: 'Thermal Imaging Core', progress: '55%', leadEngineer: 'Eng. Mariam Ali' },
        ],
        keyAssemblies: [
          { name: 'FEC', type: 'Structure', parts: 25, completion: 88 },
          { name: 'TCS', type: 'Structure', parts: 19, completion: 81 },
          { name: 'Main Wiring', type: 'Electrical', parts: 42, completion: 74 },
          { name: 'Guidance Module', type: 'GNC', parts: 33, completion: 68 },
        ],
      })
      setLoading(false)
    }, 800)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  const k = data.kpis
  const chart = {
    title: 'Production Efficiency (Past 7 Days)',
    labels: data.efficiencyTrend.map((d) =>
      new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    ),
    datasets: [
      {
        label: 'Efficiency %',
        data: data.efficiencyTrend.map((p) => p.efficiency),
        colorVar: 'success',
        fill: true,
      },
    ],
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol xs={12}>
          <CAlert color="dark" className="d-flex justify-content-between align-items-center mb-0 text-white">
            <span className="fw-semibold">Welcome to Production Management Dashboard</span>
            <span className="text-body-secondary small">{new Date().toLocaleString()}</span>
          </CAlert>
        </CCol>
      </CRow>

      {/* KPI CARDS */}
      <CRow className="mb-4">
        <CCol sm={6} lg={2}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-body-secondary small">Active Projects</div>
                <div className="fs-3 fw-semibold">{k.activeProjects}</div>
              </div>
              <div className="p-2 bg-primary text-white rounded">
                <CIcon icon={cilFactory} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={2}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-body-secondary small">Total Sets</div>
                <div className="fs-3 fw-semibold">{k.totalSets}</div>
              </div>
              <div className="p-2 bg-info text-white rounded">
                <CIcon icon={cilLayers} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={2}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-body-secondary small">Components</div>
                <div className="fs-3 fw-semibold">{k.totalComponents}</div>
              </div>
              <div className="p-2 bg-success text-white rounded">
                <CIcon icon={cilBolt} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={2}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-body-secondary small">Assemblies</div>
                <div className="fs-3 fw-semibold">{k.totalAssemblies}</div>
              </div>
              <div className="p-2 bg-warning text-white rounded">
                <CIcon icon={cilSettings} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={2}>
          <CCard className="border-0 shadow-sm">
            <CCardBody className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-body-secondary small">Parts</div>
                <div className="fs-3 fw-semibold">{k.totalParts}</div>
              </div>
              <div className="p-2 bg-danger text-white rounded">
                <CIcon icon={cilChartLine} size="xl" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* EFFICIENCY CHART */}
      <CCard className="mb-4 border-0 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{chart.title}</h5>
          <CButton color="primary" variant="outline" size="sm">
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
              {data.topProjects.map((p) => (
                <CTableRow key={p.name}>
                  <CTableDataCell>{p.name}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color="success">{p.progress}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{p.leadEngineer}</CTableDataCell>
                </CTableRow>
              ))}
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
              {data.keyAssemblies.map((a) => (
                <CTableRow key={a.name}>
                  <CTableDataCell>{a.name}</CTableDataCell>
                  <CTableDataCell>{a.type}</CTableDataCell>
                  <CTableDataCell>{a.parts}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge
                      color={
                        a.completion > 80
                          ? 'success'
                          : a.completion > 60
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {a.completion}%
                    </CBadge>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default Dashboard
