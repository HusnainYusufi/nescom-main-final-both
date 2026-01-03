// src/views/pages/executive/ExecutiveDashboard.js
import React, { useEffect, useState } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CAlert,
  CBadge,
} from '@coreui/react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'

const ExecutiveDashboard = () => {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
  })

  const [projectProgress, setProjectProgress] = useState([])
  const [financialStatus, setFinancialStatus] = useState([])
  const [alerts, setAlerts] = useState([])

  // Mock offline data (replace with backend or Power BI API)
  useEffect(() => {
    setSummary({
      totalProjects: 8,
      activeProjects: 5,
      completedProjects: 3,
      totalBudget: 7_200_000,
      totalSpent: 5_460_000,
    })

    setProjectProgress([
      { name: 'Aerial Defense', progress: 80 },
      { name: 'Electric Car Platform', progress: 60 },
      { name: 'Cruise Launcher', progress: 45 },
      { name: 'Radar Vision', progress: 90 },
    ])

    setFinancialStatus([
      { project: 'Aerial Defense', budget: 1_500_000, spent: 1_200_000 },
      { project: 'Electric Car Platform', budget: 900_000, spent: 800_000 },
      { project: 'Cruise Launcher', budget: 1_200_000, spent: 1_050_000 },
      { project: 'Radar Vision', budget: 800_000, spent: 650_000 },
    ])

    setAlerts([
      { type: 'Budget Overrun', project: 'Cruise Launcher', severity: 'danger' },
      { type: 'Delay Alert', project: 'Electric Car Platform', severity: 'warning' },
    ])
  }, [])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  const totalSpentPercent = ((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="mb-4">
        <CCol>
          <h3 className="fw-bold text-primary">Executive Dashboard & Reporting</h3>
          <p className="text-muted small">
            Real-time performance summary of all projects, budgets, and KPIs
          </p>
        </CCol>
      </CRow>

      {/* Top Summary Cards */}
      <CRow className="g-4">
        <CCol md={3}>
          <CCard className="shadow-sm border-0 rounded-4 stat-card bg-light">
            <CCardBody>
              <h6 className="fw-bold text-secondary mb-1">Total Projects</h6>
              <h3 className="fw-bolder text-primary">{summary.totalProjects}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0 rounded-4 stat-card bg-light">
            <CCardBody>
              <h6 className="fw-bold text-secondary mb-1">Active Projects</h6>
              <h3 className="fw-bolder text-info">{summary.activeProjects}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0 rounded-4 stat-card bg-light">
            <CCardBody>
              <h6 className="fw-bold text-secondary mb-1">Completed Projects</h6>
              <h3 className="fw-bolder text-success">{summary.completedProjects}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0 rounded-4 stat-card bg-light">
            <CCardBody>
              <h6 className="fw-bold text-secondary mb-1">Budget Utilization</h6>
              <h3 className={`fw-bolder ${totalSpentPercent > 85 ? 'text-danger' : 'text-warning'}`}>
                {totalSpentPercent}%
              </h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Charts Row */}
      <CRow className="mt-4 g-4">
        {/* Progress Chart */}
        <CCol lg={6}>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardHeader className="fw-bold bg-primary text-white">
              Project Progress Overview
            </CCardHeader>
            <CCardBody style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="progress" fill="#00C49F" name="Progress (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Financial Pie Chart */}
        <CCol lg={6}>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardHeader className="fw-bold bg-dark text-white">
              Financial Distribution
            </CCardHeader>
            <CCardBody style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialStatus}
                    dataKey="spent"
                    nameKey="project"
                    outerRadius={100}
                    label
                  >
                    {financialStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Financial Comparison Chart */}
      <CRow className="mt-4">
        <CCol>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardHeader className="fw-bold bg-warning text-dark">
              Budget vs Expenditure Trends
            </CCardHeader>
            <CCardBody style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="project" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="budget" stroke="#8884d8" name="Budget" />
                  <Line type="monotone" dataKey="spent" stroke="#82ca9d" name="Spent" />
                </LineChart>
              </ResponsiveContainer>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Alerts & Notifications */}
      <CRow className="mt-4">
        <CCol>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardHeader className="fw-bold bg-danger text-white">Critical Alerts</CCardHeader>
            <CCardBody>
              {alerts.length === 0 ? (
                <CAlert color="success" className="text-center">
                  All systems operational — no alerts
                </CAlert>
              ) : (
                alerts.map((a, i) => (
                  <CAlert
                    key={i}
                    color={a.severity}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>
                      <strong>{a.type}:</strong> {a.project}
                    </span>
                    <CBadge color={a.severity} className="text-uppercase">
                      {a.severity}
                    </CBadge>
                  </CAlert>
                ))
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <style>
        {`
          .fade-in { animation: fadeIn 0.4s ease-in-out; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .stat-card:hover { transform: scale(1.02); transition: 0.3s; }
        `}
      </style>
    </CContainer>
  )
}

export default ExecutiveDashboard
