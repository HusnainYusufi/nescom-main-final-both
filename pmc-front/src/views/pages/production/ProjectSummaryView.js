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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFactory, cilWarning, cilMediaPlay } from '@coreui/icons'
import { TourProvider, useTour } from '@reactour/tour'

const ProjectSummaryInner = () => {
  const { setIsOpen } = useTour()
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    // 💡 Simulated Dummy Data – representing what comes from your project, set, status, and assembly forms
    setSummary({
      project: {
        name: 'Aerial Defense System – Main Launcher Set',
        code: 'ADS-ML-2025',
        manager: 'Engr. Usman Khalid',
        startDate: '2025-09-20',
        deadline: '2025-12-15',
        priority: 'High',
      },
      sets: [
        { name: 'Launcher Base', code: 'SET-LB', completion: 85, currentStatus: 'Integration' },
        { name: 'Control Unit', code: 'SET-CU', completion: 70, currentStatus: 'Testing Phase' },
        { name: 'Power Subsystem', code: 'SET-PS', completion: 50, currentStatus: 'Fabrication' },
      ],
      assemblies: [
        {
          type: 'Mechanical',
          parts: [
            { name: 'Frame Assembly', prm: 'Approved', prePrm: 'Approved', status: 'Installed' },
            { name: 'Hydraulic Coupling', prm: 'In Progress', prePrm: 'Approved', status: 'Assembly Ongoing' },
            { name: 'Cooling Duct', prm: 'Pending', prePrm: 'Pending', status: 'Fabrication' },
          ],
        },
        {
          type: 'Electrical',
          parts: [
            { name: 'Control Board', prm: 'Approved', prePrm: 'Approved', status: 'Connected' },
            { name: 'Sensor Array', prm: 'In Progress', prePrm: 'Approved', status: 'Testing' },
            { name: 'Relay Module', prm: 'Pending', prePrm: 'Pending', status: 'Awaiting Supply' },
          ],
        },
      ],
      qualification: [
        { stage: 'Subsystem Qualification', result: 'Passed', remarks: 'Meets all functional specs' },
        { stage: 'Final Integration Test', result: 'Pending', remarks: 'Scheduled for next sprint' },
      ],
      issues: [
        { title: 'Thermal Sensor Drift', severity: 'High', owner: 'R&D - Electronics' },
        { title: 'Pressure Valve Leak', severity: 'Medium', owner: 'Mechanical QA' },
      ],
    })
  }, [])

  if (!summary) return null

  const project = summary.project

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
          {/* ─── Project Info ─── */}
          <CRow className="mb-3 tour-project">
            <CCol md={6}>
              <CAlert color="light" className="shadow-sm">
                <strong>Start Date:</strong> {project.startDate}
              </CAlert>
            </CCol>
            <CCol md={6}>
              <CAlert color="light" className="shadow-sm">
                <strong>Deadline:</strong> {project.deadline}
              </CAlert>
            </CCol>
          </CRow>

          {/* ─── Sets ─── */}
          <h6 className="fw-bold text-info border-bottom pb-1 mb-2 tour-sets">Project Sets</h6>
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
              {summary.sets.map((set, i) => (
                <CTableRow key={i}>
                  <CTableDataCell>{set.name}</CTableDataCell>
                  <CTableDataCell>{set.code}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={set.completion > 80 ? 'success' : set.completion > 60 ? 'info' : 'warning'}>
                      {set.completion}%
                    </CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{set.currentStatus}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>

          {/* ─── Assemblies ─── */}
          {summary.assemblies.map((a, index) => (
            <div key={index} className="mb-4">
              <h6 className={`fw-bold ${a.type === 'Mechanical' ? 'text-warning' : 'text-info'} border-bottom pb-1 mb-2`} data-tour={a.type.toLowerCase()}>
                {a.type} Assemblies
              </h6>
              <CTable bordered hover responsive className="align-middle shadow-sm">
                <CTableHead color="dark">
                  <CTableRow className="text-center text-white">
                    <CTableHeaderCell>Part Name</CTableHeaderCell>
                    <CTableHeaderCell>PRM</CTableHeaderCell>
                    <CTableHeaderCell>Pre-PRM</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {a.parts.map((p, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>{p.name}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge
                          color={
                            p.prm === 'Approved'
                              ? 'success'
                              : p.prm === 'In Progress'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {p.prm}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={p.prePrm === 'Approved' ? 'success' : 'secondary'}>
                          {p.prePrm}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="fw-semibold">{p.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          ))}

          {/* ─── Qualification ─── */}
          <h6 className="fw-bold text-primary border-bottom pb-1 mb-2 tour-qual">
            Qualification Results
          </h6>
          <CTable bordered hover responsive className="align-middle shadow-sm mb-4">
            <CTableHead color="dark">
              <CTableRow className="text-center text-white">
                <CTableHeaderCell>Stage</CTableHeaderCell>
                <CTableHeaderCell>Result</CTableHeaderCell>
                <CTableHeaderCell>Remarks</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {summary.qualification.map((q, i) => (
                <CTableRow key={i}>
                  <CTableDataCell>{q.stage}</CTableDataCell>
                  <CTableDataCell>
                    <CBadge color={q.result === 'Passed' ? 'success' : 'secondary'}>{q.result}</CBadge>
                  </CTableDataCell>
                  <CTableDataCell>{q.remarks}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>

          {/* ─── Critical Issues ─── */}
          <h6 className="fw-bold text-danger border-bottom pb-1 mb-2 tour-issues">
            Critical Issues
          </h6>
          {summary.issues.map((issue, i) => (
            <CAlert
              key={i}
              color={issue.severity === 'High' ? 'danger' : 'warning'}
              className="d-flex align-items-center shadow-sm mb-2"
            >
              <CIcon icon={cilWarning} className="me-2" />
              <strong>{issue.title}</strong>
              <span className="ms-auto small text-light">
                Owner: {issue.owner}
              </span>
            </CAlert>
          ))}
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
  { selector: '.tour-project', content: 'These alerts show basic project dates and milestones.' },
  { selector: '.tour-sets', content: 'Each set under the project with current completion percentage.' },
  { selector: '[data-tour="mechanical"]', content: 'Mechanical assemblies and their PRM status.' },
  { selector: '[data-tour="electrical"]', content: 'Electrical assemblies and progress.' },
  { selector: '.tour-qual', content: 'Qualification results for each subsystem stage.' },
  { selector: '.tour-issues', content: 'List of critical issues raised by various departments.' },
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
