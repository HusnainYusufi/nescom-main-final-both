// src/views/pages/finance/FinancialDashboard.js
import React, { useState, useEffect, useMemo } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormSelect,
  CFormInput,
  CButton,
  CAlert,
  CBadge,
  CProgress,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
} from '@coreui/react'

const FinancialDashboard = () => {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState({
    type: '',
    amount: '',
    remarks: '',
  })
  const [budget, setBudget] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Simulated Data for Offline Intranet Environment
  useEffect(() => {
    setProjects([
      {
        id: '1',
        name: 'Aerial Defense System',
        budget: 1500000,
        expenses: [
          { id: 1, type: 'Materials', amount: 350000, remarks: 'High-grade alloys', approved: true },
          { id: 2, type: 'Labor', amount: 120000, remarks: 'Specialist assembly staff', approved: true },
        ],
      },
      {
        id: '2',
        name: 'Electric Car Platform',
        budget: 900000,
        expenses: [
          { id: 1, type: 'Research', amount: 80000, remarks: 'Material impact analysis', approved: false },
        ],
      },
    ])
  }, [])

  useEffect(() => {
    const selected = projects.find((p) => p.id === selectedProject)
    if (selected) {
      setBudget(selected.budget)
      setExpenses(selected.expenses)
    } else {
      setBudget(0)
      setExpenses([])
    }
  }, [selectedProject, projects])

  const handleAddExpense = (e) => {
    e.preventDefault()
    if (!selectedProject || !form.type || !form.amount) return
    setLoading(true)
    setTimeout(() => {
      const newExpense = {
        id: Date.now(),
        type: form.type,
        amount: Number(form.amount),
        remarks: form.remarks,
        approved: false,
      }
      setExpenses([...expenses, newExpense])
      setForm({ type: '', amount: '', remarks: '' })
      setSuccessMsg('Expense added successfully (awaiting approval).')
      setLoading(false)
    }, 600)
  }

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses],
  )
  const utilization = budget > 0 ? (totalExpenses / budget) * 100 : 0
  const remaining = budget - totalExpenses

  const getBadgeColor = (approved) => (approved ? 'success' : 'warning')

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={10}>
          <CCard className="shadow-sm border-0 rounded-4">
            <CCardHeader className="bg-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Financial Resource Management
            </CCardHeader>
            <CCardBody>
              {successMsg && (
                <CAlert color="success" className="text-center fw-semibold">
                  {successMsg}
                </CAlert>
              )}

              {/* Select Project */}
              <CForm className="mb-4">
                <CRow className="g-3 align-items-end">
                  <CCol md={6}>
                    <CFormSelect
                      label="Select Project"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="">Select a Project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  {selectedProject && (
                    <CCol md={6}>
                      <CAlert color="info" className="mb-0 text-center">
                        <strong>Budget:</strong> {budget.toLocaleString()} SAR &nbsp; | &nbsp;
                        <strong>Spent:</strong> {totalExpenses.toLocaleString()} SAR &nbsp; | &nbsp;
                        <strong>Remaining:</strong> {remaining.toLocaleString()} SAR
                      </CAlert>
                    </CCol>
                  )}
                </CRow>
              </CForm>

              {/* Progress Bar */}
              {selectedProject && (
                <CProgress
                  className="mb-4"
                  color={utilization < 80 ? 'success' : utilization < 100 ? 'warning' : 'danger'}
                  value={utilization}
                  animated
                  striped
                >
                  {utilization.toFixed(1)}% Used
                </CProgress>
              )}

              {/* Expense Form */}
              {selectedProject && (
                <CForm onSubmit={handleAddExpense}>
                  <CRow className="g-3">
                    <CCol md={4}>
                      <CFormSelect
                        label="Expense Type"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option value="">Select Type</option>
                        <option value="Materials">Materials</option>
                        <option value="Labor">Labor</option>
                        <option value="Research">Research</option>
                        <option value="Transport">Transport</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </CFormSelect>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        label="Amount (SAR)"
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormInput
                        label="Remarks"
                        placeholder="Details or note"
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      />
                    </CCol>
                    <CCol md={1} className="d-flex align-items-end">
                      <CButton
                        color="warning"
                        className="text-white rounded-pill px-3"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <CSpinner size="sm" />
                          </>
                        ) : (
                          'Add'
                        )}
                      </CButton>
                    </CCol>
                  </CRow>
                </CForm>
              )}

              {/* Expense Table */}
              {selectedProject && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Expense Records</h6>
                  {expenses.length === 0 ? (
                    <CAlert color="secondary">No expenses added yet.</CAlert>
                  ) : (
                    <CTable hover responsive bordered>
                      <CTableHead color="light">
                        <CTableRow>
                          <CTableHeaderCell>Type</CTableHeaderCell>
                          <CTableHeaderCell>Amount (SAR)</CTableHeaderCell>
                          <CTableHeaderCell>Remarks</CTableHeaderCell>
                          <CTableHeaderCell>Status</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {expenses.map((exp) => (
                          <CTableRow key={exp.id}>
                            <CTableDataCell>{exp.type}</CTableDataCell>
                            <CTableDataCell>{exp.amount.toLocaleString()}</CTableDataCell>
                            <CTableDataCell>{exp.remarks || '—'}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={getBadgeColor(exp.approved)}>
                                {exp.approved ? 'Approved' : 'Pending'}
                              </CBadge>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  )}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <style>
        {`
          .fade-in {
            animation: fadeIn 0.4s ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .btn-warning:hover {
            background-color: #f4b400 !important;
            transition: 0.3s;
          }
        `}
      </style>
    </CContainer>
  )
}

export default FinancialDashboard
