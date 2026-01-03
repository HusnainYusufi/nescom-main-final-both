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

const AddAssyParts = () => {
  const [form, setForm] = useState({
    projectId: '',
    setId: '',
  })
  const [projects, setProjects] = useState([])
  const [sets, setSets] = useState([])
  const [structures, setStructures] = useState([
    { id: 'st-1', name: '', details: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [loadingSets, setLoadingSets] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')
  const [parts, setParts] = useState([
    { category: '', partName: '', quantity: '', unit: '', description: '', file: null, structureId: '' },
  ])
  const [activeStep, setActiveStep] = useState(0)

  const steps = ['Project', 'Set', 'Structures', 'Assemblies']

  // Mock projects for offline LAN testing
  useEffect(() => {
    setProjects([
      { id: '1', name: 'Aerial Defense System' },
        { id: '2', name: 'Electric Car Platform' },
      { id: '3', name: 'Cruise Launcher Initiative' },
    ])
  }, [])

  const handleProjectChange = (e) => {
    const value = e.target.value
    setForm({ ...form, projectId: value, setId: '' })
    if (!value) return
    setLoadingSets(true)
    setTimeout(() => {
      setSets([
        { id: 's1', name: 'Main Launcher Assembly' },
        { id: 's2', name: 'Guidance Control Set' },
      ])
      setLoadingSets(false)
    }, 700)
  }

  const handlePartChange = (index, field, value) => {
    const updated = [...parts]
    updated[index][field] = value
    setParts(updated)
  }

  const addPartRow = () => {
    setParts([
      ...parts,
      { category: '', partName: '', quantity: '', unit: '', description: '', file: null, structureId: '' },
    ])
  }

  const removePartRow = (index) => {
    setParts(parts.filter((_, i) => i !== index))
  }

  const handleStructureChange = (index, field, value) => {
    const updated = [...structures]
    updated[index][field] = value
    setStructures(updated)
  }

  const addStructureRow = () => {
    const id = `st-${Date.now()}`
    setStructures([...structures, { id, name: '', details: '' }])
  }

  const removeStructureRow = (index) => {
    setStructures(structures.filter((_, i) => i !== index))
  }

  const validateStep = (stepIndex) => {
    const errs = {}

    if (stepIndex === 0 && !form.projectId) errs.projectId = 'Select a project'
    if (stepIndex === 1 && !form.setId) errs.setId = 'Select a set'
    if (
      stepIndex === 2 &&
      (!structures.length || structures.some((item) => !item.name.trim()))
    ) {
      errs.structures = 'Add at least one structure name'
    }
    if (stepIndex === 3 && structures.length === 0) {
      errs.structures = 'Please add a structure first'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateStep(activeStep)) return

    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1)
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg(`Assembly parts successfully added under selected project and set.`)
      setForm({ projectId: '', setId: '' })
      setParts([
        { category: '', partName: '', quantity: '', unit: '', description: '', file: null, structureId: '' },
      ])
      setStructures([{ id: 'st-1', name: '', details: '' }])
      setActiveStep(0)
    }, 1000)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow className="justify-content-center">
        <CCol xs={12} md={10} lg={8}>
          <CCard className="shadow-lg border-0 rounded-4 bg-dark text-light p-3">
            <CCardHeader className="bg-gradient-primary text-white text-center fw-bold fs-5 rounded-3 py-3">
              Add Assembly Parts
            </CCardHeader>

            <CCardBody>
              {successMsg && (
                <CAlert color="success" className="text-center fw-semibold">
                  {successMsg}
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                <div className="mb-4 stepper">
                  {steps.map((step, index) => (
                    <div key={step} className={`step ${activeStep === index ? 'active' : ''}`}>
                      <div className="step-circle">{index + 1}</div>
                      <span className="step-label">{step}</span>
                    </div>
                  ))}
                </div>

                {activeStep === 0 && (
                  <CRow className="g-3 mb-3">
                    <CCol md={12}>
                      <CFormSelect
                        label={<span className="text-light">Select Project</span>}
                        className="bg-secondary border-0 text-light"
                        name="projectId"
                        value={form.projectId}
                        onChange={handleProjectChange}
                        invalid={!!errors.projectId}
                        feedbackInvalid={errors.projectId}
                      >
                        <option value="">Select a Project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>
                )}

                {activeStep === 1 && (
                  <CRow className="g-3 mb-3">
                    <CCol md={12}>
                      <CFormSelect
                        label={<span className="text-light">Select Set</span>}
                        className="bg-secondary border-0 text-light"
                        name="setId"
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
                  </CRow>
                )}

                {activeStep === 2 && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold text-info mb-0">Structures</h6>
                      <CButton
                        color="info"
                        variant="outline"
                        className="rounded-pill px-3 text-light border-light"
                        size="sm"
                        onClick={addStructureRow}
                      >
                        + Add Structure
                      </CButton>
                    </div>
                    {errors.structures && (
                      <div className="text-danger small mb-2">{errors.structures}</div>
                    )}
                    {structures.map((structure, index) => (
                      <div
                        key={structure.id}
                        className="p-3 mb-3 rounded-3 bg-secondary text-light fade-in-fast border border-dark-subtle"
                      >
                        <CRow className="g-3 align-items-end">
                          <CCol md={6}>
                            <CFormInput
                              label={<span className="text-light">Structure Name</span>}
                              className="bg-dark text-light border-0"
                              value={structure.name}
                              onChange={(e) => handleStructureChange(index, 'name', e.target.value)}
                              placeholder="e.g. Frame, Housing, Carrier"
                            />
                          </CCol>
                          <CCol md={6}>
                            <CFormInput
                              label={<span className="text-light">Notes</span>}
                              className="bg-dark text-light border-0"
                              value={structure.details}
                              onChange={(e) => handleStructureChange(index, 'details', e.target.value)}
                              placeholder="Optional details or specs"
                            />
                          </CCol>
                        </CRow>

                        {structures.length > 1 && (
                          <div className="d-flex justify-content-end mt-3">
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              className="text-white border-light rounded-pill px-3 py-1 remove-btn"
                              onClick={() => removeStructureRow(index)}
                            >
                              Remove Structure
                            </CButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="mt-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-semibold text-info mb-0">Assemblies</h6>
                      <CButton
                        color="info"
                        variant="outline"
                        className="rounded-pill px-3 text-light border-light"
                        size="sm"
                        onClick={addPartRow}
                      >
                        + Add Assembly
                      </CButton>
                    </div>
                    {errors.structures && (
                      <div className="text-danger small mb-2">{errors.structures}</div>
                    )}
                    {parts.map((part, i) => (
                      <div
                        key={i}
                        className="p-3 mb-3 rounded-3 bg-secondary text-light fade-in-fast border border-dark-subtle"
                      >
                        <CRow className="g-3 align-items-end">
                          <CCol md={4}>
                            <CFormSelect
                              label={<span className="text-light">Structure</span>}
                              className="bg-dark border-0 text-light"
                              value={part.structureId}
                              onChange={(e) => handlePartChange(i, 'structureId', e.target.value)}
                            >
                              <option value="">Select structure</option>
                              {structures.map((structure) => (
                                <option key={structure.id} value={structure.id}>
                                  {structure.name || 'Untitled Structure'}
                                </option>
                              ))}
                            </CFormSelect>
                          </CCol>

                          <CCol md={4}>
                            <CFormInput
                              label={<span className="text-light">Assembly Name</span>}
                              className="bg-dark text-light border-0"
                              value={part.partName}
                              onChange={(e) => handlePartChange(i, 'partName', e.target.value)}
                              placeholder="e.g. Bearing, Capacitor"
                            />
                          </CCol>

                          <CCol md={4}>
                            <CFormSelect
                              label={<span className="text-light">Category</span>}
                              className="bg-dark border-0 text-light"
                              value={part.category}
                              onChange={(e) => handlePartChange(i, 'category', e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Mechanical">Mechanical</option>
                              <option value="Electrical">Electrical</option>
                              <option value="Chemical">Chemical</option>
                              <option value="Optical">Optical</option>
                            </CFormSelect>
                          </CCol>

                          <CCol md={3}>
                            <CFormInput
                              label={<span className="text-light">Qty</span>}
                              type="number"
                              className="bg-dark text-light border-0"
                              value={part.quantity}
                              onChange={(e) => handlePartChange(i, 'quantity', e.target.value)}
                            />
                          </CCol>

                          <CCol md={3}>
                            <CFormInput
                              label={<span className="text-light">Unit</span>}
                              className="bg-dark text-light border-0"
                              placeholder="e.g. pcs"
                              value={part.unit}
                              onChange={(e) => handlePartChange(i, 'unit', e.target.value)}
                            />
                          </CCol>

                          <CCol md={3}>
                            <CFormInput
                              type="file"
                              label={<span className="text-light">Attach File</span>}
                              className="bg-dark text-light border-0"
                              onChange={(e) => handlePartChange(i, 'file', e.target.files[0])}
                            />
                          </CCol>

                          <CCol md={3}>
                            <CFormInput
                              label={<span className="text-light">Notes</span>}
                              className="bg-dark text-light border-0"
                              value={part.description}
                              onChange={(e) => handlePartChange(i, 'description', e.target.value)}
                              placeholder="Short specs"
                            />
                          </CCol>
                        </CRow>

                        {parts.length > 1 && (
                          <div className="d-flex justify-content-end mt-3">
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              className="text-white border-light rounded-pill px-3 py-1 remove-btn"
                              onClick={() => removePartRow(i)}
                            >
                              Remove Assembly
                            </CButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div>
                    {activeStep > 0 && (
                      <CButton
                        color="secondary"
                        className="rounded-pill px-4 fw-semibold text-light border-light me-2"
                        type="button"
                        onClick={() => setActiveStep((prev) => prev - 1)}
                      >
                        Back
                      </CButton>
                    )}
                  </div>
                  <CButton
                    color={activeStep === steps.length - 1 ? 'warning' : 'info'}
                    className={`${activeStep === steps.length - 1 ? 'text-dark' : 'text-light'} fw-bold rounded-pill px-5 py-2 shadow-sm`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <CSpinner size="sm" className="me-2" /> Saving...
                      </>
                    ) : activeStep === steps.length - 1 ? (
                      'Save Assemblies'
                    ) : (
                      'Next Step'
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
          .fade-in { animation: fadeIn 0.4s ease-in-out; }
          .fade-in-fast { animation: fadeIn 0.3s ease-in-out; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .bg-dark, .bg-secondary {
            background-color: #1e1e2f !important;
          }
          .bg-secondary {
            background-color: #2a2a3d !important;
          }

          .text-light::placeholder {
            color: #ccc !important;
          }

          .remove-btn {
            transition: all 0.2s ease-in-out;
          }
          .remove-btn:hover {
            background-color: #ff4d4d !important;
            border-color: #ff4d4d !important;
            color: #fff !important;
            transform: scale(1.05);
          }

          .btn-warning:hover {
            background-color: #f4b400 !important;
            color: #000 !important;
            transition: 0.3s;
          }

          .stepper {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-bottom: 1rem;
          }
          .step {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 12px;
            background: #26263a;
            border: 1px solid #2f2f46;
            opacity: 0.8;
            transition: all 0.2s ease-in-out;
          }
          .step.active {
            border-color: #3fb4ff;
            box-shadow: 0 0 0 1px #3fb4ff;
            opacity: 1;
          }
          .step-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3fb4ff, #8c7cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0d0d16;
            font-weight: 700;
          }
          .step-label {
            font-weight: 600;
            color: #d9e3f0;
          }
        `}
      </style>
    </CContainer>
  )
}

export default AddAssyParts
