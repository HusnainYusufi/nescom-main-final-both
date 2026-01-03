// src/views/pages/production/CreateMeeting.js
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
  CFormTextarea,
} from '@coreui/react'

const CreateMeeting = () => {
  const [form, setForm] = useState({
    meetingType: '',
    meetingNo: '',
    date: '',
    projectId: '',
    remarks: '',
  })
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Mock project list for offline LAN testing
  useEffect(() => {
    setTimeout(() => {
      setProjects([
        { id: '1', name: 'Aerial Defense System' },
        { id: '2', name: 'Electric Car Platform' },
        { id: '3', name: 'Cruise Launcher Initiative' },
      ])
      setLoadingProjects(false)
    }, 500)
  }, [])

  // Auto-generate meeting number when type changes
  useEffect(() => {
    if (!form.meetingType) return
    const prefix = form.meetingType.replace('-', '').toUpperCase()
    const randomNum = Math.floor(100 + Math.random() * 900)
    setForm((f) => ({ ...f, meetingNo: `${prefix}-${randomNum}` }))
  }, [form.meetingType])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.meetingType) newErrors.meetingType = 'Select meeting type'
    if (!form.meetingNo.trim()) newErrors.meetingNo = 'Meeting No. required'
    if (!form.date) newErrors.date = 'Select meeting date'
    if (!form.projectId) newErrors.projectId = 'Select project'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSuccessMsg(
        `Meeting "${form.meetingNo}" (${form.meetingType}) created successfully!`,
      )
      setForm({
        meetingType: '',
        meetingNo: '',
        date: '',
        projectId: '',
        remarks: '',
      })
    }, 900)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={7}>
          <CCard className="shadow-sm border-0 rounded-4 p-3">
            <CCardHeader className="bg-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Create Meeting
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
                      label="Meeting Type"
                      name="meetingType"
                      value={form.meetingType}
                      onChange={handleChange}
                      invalid={!!errors.meetingType}
                      feedbackInvalid={errors.meetingType}
                    >
                      <option value="">Select Type</option>
                      <option value="PRM">PRM</option>
                      <option value="Pre-PRM">Pre-PRM</option>
                      <option value="IHD">IHD</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      label="Meeting No."
                      name="meetingNo"
                      placeholder="Auto-generated"
                      value={form.meetingNo}
                      onChange={handleChange}
                      invalid={!!errors.meetingNo}
                      feedbackInvalid={errors.meetingNo}
                      disabled
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      type="date"
                      label="Meeting Date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      invalid={!!errors.date}
                      feedbackInvalid={errors.date}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      label="Select Project"
                      name="projectId"
                      value={form.projectId}
                      onChange={handleChange}
                      invalid={!!errors.projectId}
                      feedbackInvalid={errors.projectId}
                      disabled={loadingProjects}
                    >
                      <option value="">
                        {loadingProjects ? 'Loading Projects…' : 'Select a Project'}
                      </option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormTextarea
                      label="Remarks (optional)"
                      name="remarks"
                      rows={3}
                      placeholder="Add any meeting notes or agenda here"
                      value={form.remarks}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>

                <div className="text-center mt-4">
                  <CButton
                    color="warning"
                    className="text-white fw-semibold rounded-pill px-5 py-2"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Creating…
                      </>
                    ) : (
                      'Create Meeting'
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
          .form-label { font-weight: 600; }
          .btn-warning:hover {
            background-color: #f4b400 !important;
            transition: 0.3s;
          }
        `}
      </style>
    </CContainer>
  )
}

export default CreateMeeting
