import React from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
} from '@coreui/react'
import {
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
  CChartPolarArea,
  CChartRadar,
} from '@coreui/react-chartjs'

const kpiHighlights = [
  {
    label: 'Total Output',
    value: '128.4k Units',
    delta: '+8.4%',
    status: 'success',
    progress: 84,
    note: 'Plantwide production this month',
  },
  {
    label: 'On-time Delivery',
    value: '94.2%',
    delta: '+1.6%',
    status: 'info',
    progress: 94,
    note: 'Orders shipped on schedule',
  },
  {
    label: 'Quality Yield',
    value: '97.1%',
    delta: '+0.8%',
    status: 'primary',
    progress: 97,
    note: 'First-pass acceptance rate',
  },
  {
    label: 'Downtime',
    value: '2.1 hrs',
    delta: '-12%',
    status: 'warning',
    progress: 58,
    note: 'Unplanned stoppages this week',
  },
]

const OfflineChartsDashboard = () => {
  const productionMix = {
    labels: ['Line A', 'Line B', 'Line C', 'Line D', 'Line E'],
    datasets: [
      {
        label: 'Units Built',
        backgroundColor: '#4e73df',
        data: [320, 280, 250, 210, 180],
      },
    ],
  }

  const throughputTrend = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Planned',
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.12)',
        pointBackgroundColor: '#4e73df',
        data: [180, 190, 200, 205, 210, 200, 195],
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Actual',
        borderColor: '#1cc88a',
        backgroundColor: 'rgba(28, 200, 138, 0.12)',
        pointBackgroundColor: '#1cc88a',
        data: [175, 185, 195, 198, 206, 192, 188],
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const defectDistribution = {
    labels: ['Welding', 'CNC', 'Paint', 'Assembly', 'Packaging'],
    datasets: [
      {
        label: 'Defects',
        backgroundColor: ['#e74a3b', '#f6c23e', '#36b9cc', '#4e73df', '#858796'],
        data: [18, 12, 9, 7, 5],
      },
    ],
  }

  const shipmentSplit = {
    labels: ['Defense', 'Energy', 'Aerospace', 'Automotive'],
    datasets: [
      {
        backgroundColor: ['#1cc88a', '#4e73df', '#36b9cc', '#f6c23e'],
        data: [42, 25, 18, 15],
      },
    ],
  }

  const capacityBalance = {
    labels: ['Fabrication', 'Machining', 'Assembly', 'QA', 'Logistics'],
    datasets: [
      {
        backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
        data: [28, 24, 18, 15, 15],
      },
    ],
  }

  const resilienceRadar = {
    labels: ['Safety', 'Inventory', 'Automation', 'Skills', 'Maintenance', 'Supply Risk'],
    datasets: [
      {
        label: 'Current',
        backgroundColor: 'rgba(78, 115, 223, 0.2)',
        borderColor: '#4e73df',
        pointBackgroundColor: '#4e73df',
        data: [88, 72, 68, 80, 75, 65],
      },
      {
        label: 'Target',
        backgroundColor: 'rgba(28, 200, 138, 0.2)',
        borderColor: '#1cc88a',
        pointBackgroundColor: '#1cc88a',
        data: [92, 78, 75, 84, 80, 70],
      },
    ],
  }

  return (
    <CRow className="g-4">
      <CCol xs={12}>
        <CCard className="mb-2">
          <CCardBody>
            <h3 className="mb-1">Offline Analytics Dashboard</h3>
            <p className="text-medium-emphasis mb-0">
              Curated, offline-ready charts for fast operational insights without live data calls.
            </p>
          </CCardBody>
        </CCard>
      </CCol>

      {kpiHighlights.map((kpi) => (
        <CCol xs={12} md={6} xl={3} key={kpi.label}>
          <CCard className="h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis text-uppercase fw-semibold fs-6">
                    {kpi.label}
                  </div>
                  <div className="fs-4 fw-bold">{kpi.value}</div>
                </div>
                <CBadge color={kpi.status}>{kpi.delta}</CBadge>
              </div>
              <p className="text-medium-emphasis mt-2 mb-2">{kpi.note}</p>
              <CProgress thin color={kpi.status} value={kpi.progress} />
            </CCardBody>
          </CCard>
        </CCol>
      ))}

      <CCol xs={12} lg={7}>
        <CCard className="h-100">
          <CCardHeader>Throughput Trend vs Plan</CCardHeader>
          <CCardBody>
            <CChartLine data={throughputTrend} />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12} lg={5}>
        <CCard className="h-100">
          <CCardHeader>Production Mix by Line</CCardHeader>
          <CCardBody>
            <CChartBar data={productionMix} />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12} md={6} xl={4}>
        <CCard className="h-100">
          <CCardHeader>Defect Distribution</CCardHeader>
          <CCardBody>
            <CChartDoughnut data={defectDistribution} />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12} md={6} xl={4}>
        <CCard className="h-100">
          <CCardHeader>Shipment Portfolio</CCardHeader>
          <CCardBody>
            <CChartPie data={shipmentSplit} />
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12} md={12} xl={4}>
        <CCard className="h-100">
          <CCardHeader>Capacity Balance</CCardHeader>
          <CCardBody>
            <CChartPolarArea data={capacityBalance} />
          </CCardBody>
        </CCard>
      </CCol>

      <CCol xs={12}>
        <CCard className="h-100">
          <CCardHeader>Operational Resilience</CCardHeader>
          <CCardBody>
            <CChartRadar data={resilienceRadar} />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default OfflineChartsDashboard
