// src/views/pages/production/ProjectLifecycleWizard.js
import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCallout,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CListGroup,
  CListGroupItem,
  CProgress,
  CRow,
} from '@coreui/react'

const ProjectLifecycleWizard = () => {
  const steps = useMemo(
    () => [
      { key: 'basics', title: 'Project Basics', summary: 'Type, owner, and description' },
      { key: 'config', title: 'Configurations', summary: 'Reusable templates and notes' },
      { key: 'sets', title: 'Sets', summary: 'Groupings that collect assemblies' },
      { key: 'assemblies', title: 'Assemblies & Parts', summary: 'Assemblies within each set' },
      { key: 'review', title: 'Review', summary: 'Confirm the lifecycle inputs' },
    ],
    [],
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    basics: {
      name: '',
      type: '',
      owner: '',
      description: '',
    },
    config: {
      template: '',
      reuseNotes: '',
      lifecycleStage: '',
    },
    sets: [
      {
        id: 1,
        name: 'Set 1',
        notes: 'Starter set for intake',
      },
    ],
    assemblies: [
      {
        id: 1,
        setName: 'Set 1',
        assemblyName: 'Assembly A',
        assemblyType: 'Assembly',
        parts: 'Frame, wiring harness',
      },
    ],
    alerts: {
      submitted: false,
    },
  })

  const currentKey = steps[currentStep].key

  const handleBasicChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [name]: value,
      },
    }))
  }

  const handleConfigChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [name]: value,
      },
    }))
  }

  const handleSetChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sets: prev.sets.map((set) => (set.id === id ? { ...set, [field]: value } : set)),
    }))
  }

  const handleAssemblyChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      assemblies: prev.assemblies.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const addSet = () => {
    setFormData((prev) => ({
      ...prev,
      sets: [
        ...prev.sets,
        {
          id: prev.sets.length + 1,
          name: `Set ${prev.sets.length + 1}`,
          notes: '',
        },
      ],
    }))
  }

  const addAssembly = () => {
    setFormData((prev) => ({
      ...prev,
      assemblies: [
        ...prev.assemblies,
        {
          id: prev.assemblies.length + 1,
          setName: prev.sets[0]?.name || 'Set 1',
          assemblyName: '',
          assemblyType: 'Assembly',
          parts: '',
        },
      ],
    }))
  }

  const removeSet = (id) => {
    setFormData((prev) => ({
      ...prev,
      sets: prev.sets.filter((set) => set.id !== id),
    }))
  }

  const removeAssembly = (id) => {
    setFormData((prev) => ({
      ...prev,
      assemblies: prev.assemblies.filter((item) => item.id !== id),
    }))
  }

  const goToStep = (direction) => {
    setCurrentStep((prev) => {
      const next = prev + direction
      if (next < 0) return 0
      if (next >= steps.length) return steps.length - 1
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setFormData((prev) => ({
      ...prev,
      alerts: {
        submitted: true,
      },
    }))
  }

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100)

  const renderBasics = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CFormInput
          label="Project Name"
          name="name"
          placeholder="Example: Composite Structure Upgrade"
          value={formData.basics.name}
          onChange={handleBasicChange}
        />
      </CCol>
      <CCol md={6}>
        <CFormSelect
          label="Project Type"
          name="type"
          value={formData.basics.type}
          onChange={handleBasicChange}
        >
          <option value="">Select type</option>
          <option value="standard">Standard</option>
          <option value="custom">Custom</option>
        </CFormSelect>
      </CCol>
      <CCol md={6}>
        <CFormInput
          label="Owner / Lead"
          name="owner"
          placeholder="Name of responsible lead"
          value={formData.basics.owner}
          onChange={handleBasicChange}
        />
      </CCol>
      <CCol md={12}>
        <CFormTextarea
          label="Summary"
          name="description"
          placeholder="High-level description of the project scope"
          value={formData.basics.description}
          onChange={handleBasicChange}
          rows={3}
        />
      </CCol>
    </CRow>
  )

  const renderConfig = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CFormSelect
          label="Configuration Template"
          name="template"
          value={formData.config.template}
          onChange={handleConfigChange}
        >
          <option value="">Select a template</option>
          <option value="baseline">Baseline configuration</option>
          <option value="lightweight">Lightweight build</option>
          <option value="extended">Extended feature set</option>
        </CFormSelect>
      </CCol>
      <CCol md={6}>
        <CFormSelect
          label="Lifecycle Stage"
          name="lifecycleStage"
          value={formData.config.lifecycleStage}
          onChange={handleConfigChange}
        >
          <option value="">Choose stage</option>
          <option value="discovery">Discovery</option>
          <option value="design">Design</option>
          <option value="production">Production-ready</option>
        </CFormSelect>
      </CCol>
      <CCol md={12}>
        <CFormTextarea
          label="Reuse notes"
          name="reuseNotes"
          placeholder="Document reusable configurations, assemblies, or parts that can be shared"
          value={formData.config.reuseNotes}
          onChange={handleConfigChange}
          rows={3}
        />
      </CCol>
      <CCol>
        <CCallout color="info" className="mb-0">
          Capture the reusable items here so they can be auto-suggested later when the backend is
          connected.
        </CCallout>
      </CCol>
    </CRow>
  )

  const renderSets = () => (
    <CRow className="g-3">
      {formData.sets.map((set) => (
        <CCol md={6} key={set.id}>
          <CCard className="h-100 shadow-sm">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{set.name}</h6>
                  <p className="text-body-secondary small mb-0">
                    Each set groups assemblies for a lifecycle stage.
                  </p>
                </div>
                <CBadge color="primary">Reusable</CBadge>
              </div>

              <CFormInput
                label="Set name"
                value={set.name}
                onChange={(event) => handleSetChange(set.id, 'name', event.target.value)}
                className="mb-3"
              />

              <CFormTextarea
                label="Notes"
                value={set.notes}
                onChange={(event) => handleSetChange(set.id, 'notes', event.target.value)}
                rows={2}
              />

              {formData.sets.length > 1 && (
                <div className="text-end mt-3">
                  <CButton color="secondary" size="sm" variant="ghost" onClick={() => removeSet(set.id)}>
                    Remove set
                  </CButton>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      ))}

      <CCol xs={12}>
        <CButton color="primary" variant="outline" onClick={addSet}>
          Add another set
        </CButton>
      </CCol>
    </CRow>
  )

  const renderAssemblies = () => (
    <CRow className="g-3">
      {formData.assemblies.map((item) => (
        <CCol md={6} key={item.id}>
          <CCard className="h-100 shadow-sm">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{item.assemblyName || `Assembly ${item.id}`}</h6>
                  <p className="text-body-secondary small mb-0">Attach assemblies to sets to auto-fetch parts.</p>
                </div>
                <CBadge color="success">Auto-fetch</CBadge>
              </div>

              <CFormSelect
                label="Linked set"
                value={item.setName}
                onChange={(event) => handleAssemblyChange(item.id, 'setName', event.target.value)}
                className="mb-3"
              >
                {formData.sets.map((set) => (
                  <option key={set.id} value={set.name}>
                    {set.name}
                  </option>
                ))}
              </CFormSelect>

              <CFormInput
                label="Assembly name"
                value={item.assemblyName}
                onChange={(event) => handleAssemblyChange(item.id, 'assemblyName', event.target.value)}
                className="mb-3"
                placeholder="Example: Control module"
              />

              <CFormSelect
                label="Assembly type"
                value={item.assemblyType}
                onChange={(event) => handleAssemblyChange(item.id, 'assemblyType', event.target.value)}
                className="mb-3"
              >
                <option value="Assembly">Assembly</option>
                <option value="Sub-assembly">Sub-assembly</option>
              </CFormSelect>

              <CFormTextarea
                label="Parts"
                value={item.parts}
                onChange={(event) => handleAssemblyChange(item.id, 'parts', event.target.value)}
                rows={2}
                placeholder="List the parts included here"
              />

              {formData.assemblies.length > 1 && (
                <div className="text-end mt-3">
                  <CButton
                    color="secondary"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAssembly(item.id)}
                  >
                    Remove assembly
                  </CButton>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      ))}

      <CCol xs={12}>
        <CButton color="primary" variant="outline" onClick={addAssembly}>
          Add another assembly
        </CButton>
      </CCol>
    </CRow>
  )

  const renderReview = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CCard className="h-100 shadow-sm">
          <CCardHeader>Project overview</CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem>
                <strong>Name:</strong> {formData.basics.name || 'Not set'}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Type:</strong> {formData.basics.type || 'Not set'}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Owner:</strong> {formData.basics.owner || 'Not set'}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Summary:</strong> {formData.basics.description || 'Not set'}
              </CListGroupItem>
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={6}>
        <CCard className="h-100 shadow-sm">
          <CCardHeader>Configuration & reuse</CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem>
                <strong>Template:</strong> {formData.config.template || 'Not set'}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Lifecycle stage:</strong> {formData.config.lifecycleStage || 'Not set'}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Reuse notes:</strong> {formData.config.reuseNotes || 'Not set'}
              </CListGroupItem>
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={6}>
        <CCard className="h-100 shadow-sm mt-2">
          <CCardHeader>Sets</CCardHeader>
          <CCardBody>
            <CListGroup flush>
              {formData.sets.map((set) => (
                <CListGroupItem key={set.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{set.name}</strong>
                      <div className="small text-body-secondary">{set.notes || 'No notes added'}</div>
                    </div>
                    <CBadge color="primary">Reusable</CBadge>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md={6}>
        <CCard className="h-100 shadow-sm mt-2">
          <CCardHeader>Assemblies</CCardHeader>
          <CCardBody>
            <CListGroup flush>
              {formData.assemblies.map((assembly) => (
                <CListGroupItem key={assembly.id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{assembly.assemblyName || `Assembly ${assembly.id}`}</strong>
                      <div className="small text-body-secondary">
                        {assembly.assemblyType} • {assembly.setName}
                      </div>
                      <div className="small text-body-secondary">Parts: {assembly.parts || 'Not listed'}</div>
                    </div>
                    <CBadge color="success">Auto-fetch</CBadge>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )

  const renderStepContent = () => {
    switch (currentKey) {
      case 'basics':
        return renderBasics()
      case 'config':
        return renderConfig()
      case 'sets':
        return renderSets()
      case 'assemblies':
        return renderAssemblies()
      case 'review':
        return renderReview()
      default:
        return null
    }
  }

  return (
    <CContainer fluid className="mt-4">
      <CRow className="justify-content-center">
        <CCol lg={10}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">Project lifecycle</h4>
                  <p className="text-body-secondary mb-0">
                    Multi-step flow to capture the project, its sets, and reusable assemblies.
                  </p>
                </div>
                <CBadge color="warning" className="text-dark">
                  Frontend-only preview
                </CBadge>
              </div>
              <CProgress height={10} color="primary" value={progressValue} className="mb-3" />
              <div className="d-flex flex-wrap gap-3 mb-3">
                {steps.map((step, index) => (
                  <div key={step.key} className={`step-chip ${index === currentStep ? 'active' : ''}`}>
                    <span className="step-index">{index + 1}</span>
                    <div>
                      <div className="fw-semibold">{step.title}</div>
                      <div className="small text-body-secondary">{step.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CCardHeader>
            <CCardBody>
              {formData.alerts.submitted && (
                <CAlert color="success" className="fw-semibold">
                  Project lifecycle captured locally. Wire this stepper to your backend to persist it.
                </CAlert>
              )}

              <CForm onSubmit={handleSubmit}>
                {renderStepContent()}

                <div className="d-flex justify-content-between align-items-center mt-4">
                  <CButton
                    color="secondary"
                    variant="ghost"
                    disabled={currentStep === 0}
                    onClick={() => goToStep(-1)}
                  >
                    Back
                  </CButton>

                  <div className="d-flex gap-2">
                    {currentStep < steps.length - 1 && (
                      <CButton color="primary" onClick={() => goToStep(1)}>
                        Next
                      </CButton>
                    )}
                    {currentStep === steps.length - 1 && (
                      <CButton color="success" type="submit">
                        Save lifecycle
                      </CButton>
                    )}
                  </div>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <style>
        {`
          .step-chip {
            display: flex;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            min-width: 180px;
            align-items: center;
            background: #fafbfc;
          }

          .step-chip.active {
            border-color: #3b82f6;
            background: #eef2ff;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
          }

          .step-index {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
          }
        `}
      </style>
    </CContainer>
  )
}

export default ProjectLifecycleWizard
