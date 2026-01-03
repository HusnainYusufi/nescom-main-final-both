// src/views/pages/production/CreateProject.js
import React, { useState } from 'react'
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
} from '@coreui/react'

const CreateProject = () => {
  const [form, setForm] = useState({
    title: '',
    category: '',
    type: '',
  })
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.category) newErrors.category = 'Select a category'
    if (!form.type) newErrors.type = 'Select a type'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg(`Project "${form.title}" added successfully!`)
      setForm({ title: '', category: '', type: '' })
    }, 800)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={6}>
          <CCard className="shadow-sm border-0 rounded-4 p-3">
            <CCardHeader className="bg-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Create Project
            </CCardHeader>

            <CCardBody>
              {successMsg && (
                <CAlert color="success" className="text-center fw-semibold">
                  {successMsg}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <CFormInput
                  label="Title"
                  name="title"
                  placeholder="Enter project title"
                  value={form.title}
                  onChange={handleChange}
                  invalid={!!errors.title}
                  feedbackInvalid={errors.title}
                  className="mb-3"
                />

                <CFormSelect
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  invalid={!!errors.category}
                  feedbackInvalid={errors.category}
                  className="mb-3"
                >
                  <option value="">Select Category</option>
                  <option value="Standard">Standard</option>
                  <option value="Custom">Custom</option>
                  <option value="Extended">Extended</option>
                </CFormSelect>

                <CFormSelect
                  label="Type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  invalid={!!errors.type}
                  feedbackInvalid={errors.type}
                  className="mb-4"
                >
                  <option value="">Select Type</option>
                  <option value="Prototype">Prototype</option>
                  <option value="Pilot">Pilot</option>
                  <option value="Operational">Operational</option>
                </CFormSelect>

                <div className="text-center">
                  <CButton
                    color="warning"
                    className="text-white fw-semibold rounded-pill px-5 py-2"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Project'}
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

export default CreateProject
