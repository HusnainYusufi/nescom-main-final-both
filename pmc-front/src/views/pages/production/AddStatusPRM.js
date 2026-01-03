// src/views/pages/production/AddStatusPRM.js
import React, { useState } from 'react'
import {
  CContainer,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CAlert,
} from '@coreui/react'

const AddStatusPRM = () => {
  const [form, setForm] = useState({
    project: '',
    stage: '',
    remarks: '',
    progress: '',
  })
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSuccess(`Status updated successfully for "${form.project}"`)
    setForm({ project: '', stage: '', remarks: '', progress: '' })
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CCard className="shadow-sm border-0 rounded-4">
        <CCardHeader className="bg-primary text-white fw-bold">
          Add / Update Project Status (PRM)
        </CCardHeader>
        <CCardBody>
          {success && (
            <CAlert color="success" className="fw-semibold text-center">
              {success}
            </CAlert>
          )}

          <CForm onSubmit={handleSubmit}>
            <CFormSelect
              label="Select Project"
              name="project"
              value={form.project}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="Aerial Defense System">Aerial Defense System</option>
              <option value="Electric Car Platform">Electric Car Platform</option>
            </CFormSelect>

            <CFormSelect
              className="mt-3"
              label="Stage"
              name="stage"
              value={form.stage}
              onChange={handleChange}
            >
              <option value="">Select Stage</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="QA Review">QA Review</option>
              <option value="Completed">Completed</option>
            </CFormSelect>

            <CFormInput
              className="mt-3"
              label="Progress (%)"
              type="number"
              name="progress"
              min="0"
              max="100"
              value={form.progress}
              onChange={handleChange}
            />

            <CFormInput
              className="mt-3"
              label="Remarks"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
            />

            <div className="text-center mt-4">
              <CButton color="primary" className="px-5 rounded-pill" type="submit">
                Save Status
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>

      <style>
        {`
          .fade-in { animation: fadeIn 0.4s ease-in-out; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </CContainer>
  )
}

export default AddStatusPRM
