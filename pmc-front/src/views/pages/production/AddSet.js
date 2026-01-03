// src/views/pages/production/AddSet.js
import React, { useState, useEffect } from 'react'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'

const AddSet = () => {
  const [form, setForm] = useState({
    projectId: '',
    setDetails: '',
  })
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')

  // Simulate fetching project list locally
  useEffect(() => {
    setLoadingProjects(true)
    setTimeout(() => {
      setProjects([
        { id: '1', name: 'Aerial Defense System' },
        { id: '2', name: 'Electric Car Platform' },
        { id: '3', name: 'Cruise Launcher Initiative' },
      ])
      setLoadingProjects(false)
    }, 600)
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.projectId) newErrors.projectId = 'Select a project'
    if (!form.setDetails.trim()) newErrors.setDetails = 'Enter set details'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg(`Set "${form.setDetails}" added successfully under selected project.`)
      setForm({ projectId: '', setDetails: '' })
    }, 900)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={6}>
          <CCard className="shadow-sm border-0 rounded-4 p-3">
            <CCardHeader className="bg-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Add Set
            </CCardHeader>

            <CCardBody>
              {successMsg && (
                <CAlert color="success" className="text-center fw-semibold">
                  {successMsg}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                {/* Project Dropdown */}
                <CFormSelect
                  label="Select Project"
                  name="projectId"
                  value={form.projectId}
                  onChange={handleChange}
                  invalid={!!errors.projectId}
                  feedbackInvalid={errors.projectId}
                  className="mb-3"
                  disabled={loadingProjects}
                >
                  <option value="">
                    {loadingProjects ? 'Loading Projects...' : 'Select a Project'}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </CFormSelect>

                {/* Set Details */}
                <CFormInput
                  label="Set Details"
                  name="setDetails"
                  placeholder="Enter main set name"
                  value={form.setDetails}
                  onChange={handleChange}
                  invalid={!!errors.setDetails}
                  feedbackInvalid={errors.setDetails}
                  className="mb-4"
                />

                <div className="text-center">
                  <CButton
                    color="warning"
                    className="text-white fw-semibold rounded-pill px-5 py-2"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Set'
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
          .form-label {
            font-weight: 600;
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

export default AddSet
