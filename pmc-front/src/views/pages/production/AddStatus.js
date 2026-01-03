// src/views/pages/production/AddStatus.js
import React, { useState, useEffect } from 'react'
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
  CFormTextarea,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
} from '@coreui/react'

const AddStatus = () => {
  const [form, setForm] = useState({
    projectId: '',
    setId: '',
    statusStage: '',
    remarks: '',
  })
  const [projects, setProjects] = useState([])
  const [sets, setSets] = useState([])
  const [loadingSets, setLoadingSets] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errors, setErrors] = useState({})

  // Simulated offline data
  useEffect(() => {
    setProjects([
      { id: '1', name: 'Aerial Defense System' },
      { id: '2', name: 'Electric Car Platform' },
      { id: '3', name: 'Cruise Launcher Initiative' },
    ])
  }, [])

  const handleProjectChange = (e) => {
    const val = e.target.value
    setForm({ ...form, projectId: val, setId: '' })
    if (!val) return
    setLoadingSets(true)
    setTimeout(() => {
      setSets([
        { id: 's1', name: 'Main Launcher Assembly' },
        { id: 's2', name: 'Guidance Control Set' },
        { id: 's3', name: 'Target Tracking Unit' },
      ])
      setLoadingSets(false)
    }, 700)
  }

  const getStatusColor = (stage) => {
    switch (stage) {
      case 'Pending':
        return 'secondary'
      case 'In Progress':
        return 'info'
      case 'Completed':
        return 'success'
      case 'Halted':
        return 'danger'
      case 'QA Review':
        return 'warning'
      default:
        return 'dark'
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.projectId) errs.projectId = 'Select a project'
    if (!form.setId) errs.setId = 'Select a set'
    if (!form.statusStage) errs.statusStage = 'Select a status stage'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg(`Status updated successfully for selected project and set.`)
      setForm({ projectId: '', setId: '', statusStage: '', remarks: '' })
    }, 900)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={6}>
          <CCard className="shadow-sm border-0 rounded-4 p-3">
            <CCardHeader className="bg-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Add Status
            </CCardHeader>

            <CCardBody>
              {successMsg && (
                <CAlert color="success" className="text-center fw-semibold">
                  {successMsg}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormSelect
                      label="Select Project"
                      value={form.projectId}
                      onChange={handleProjectChange}
                      invalid={!!errors.projectId}
                      feedbackInvalid={errors.projectId}
                    >
                      <option value="">Select Project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      label="Select Set"
                      value={form.setId}
                      onChange={(e) => setForm({ ...form, setId: e.target.value })}
                      invalid={!!errors.setId}
                      feedbackInvalid={errors.setId}
                      disabled={loadingSets}
                    >
                      <option value="">
                        {loadingSets ? 'Loading Sets...' : 'Select a Set'}
                      </option>
                      {sets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      label="Status Stage"
                      value={form.statusStage}
                      onChange={(e) => setForm({ ...form, statusStage: e.target.value })}
                      invalid={!!errors.statusStage}
                      feedbackInvalid={errors.statusStage}
                    >
                      <option value="">Select Status</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="QA Review">QA Review</option>
                      <option value="Halted">Halted</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    {form.statusStage && (
                      <div className="mt-2 text-center">
                        <span className="fw-semibold text-muted small">Status Tag</span>
                        <br />
                        <CBadge color={getStatusColor(form.statusStage)} className="px-4 py-2 fs-6">
                          {form.statusStage}
                        </CBadge>
                      </div>
                    )}
                  </CCol>

                  <CCol md={12}>
                    <CFormTextarea
                      label="Remarks"
                      rows={3}
                      placeholder="Add status notes or observations"
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    />
                  </CCol>
                </CRow>

                <div className="text-center mt-4">
                  <CButton
                    color="warning"
                    className="text-white fw-semibold rounded-pill px-5 py-2"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Updating...
                      </>
                    ) : (
                      'Save Status'
                    )}
                  </CButton>
                </div>
              </CForm>
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
            from { opacity: 0; transform: translateY(10px); }
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

export default AddStatus
