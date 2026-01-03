// src/views/pages/production/ProductionModule.js
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
  CBadge,
  CProgress,
  CCollapse,
  CAlert,
  CSpinner,
} from '@coreui/react'

const ProductionModule = () => {
  const [projects, setProjects] = useState([])
  const [expandedProject, setExpandedProject] = useState(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [form, setForm] = useState({
    projectId: '',
    productName: '',
    batchCode: '',
    estimatedCompletion: '',
  })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Simulated backend data for intranet offline environment
  useEffect(() => {
    setProjects([
      {
        id: '1',
        name: 'Aerial Defense System',
        progress: 80,
        status: 'In Progress',
        sets: [
          {
            id: 's1',
            name: 'Launcher Assembly',
            progress: 85,
            status: 'QA Review',
            assemblies: [
              {
                id: 'a1',
                name: 'Hydraulic Chamber',
                progress: 90,
                status: 'Completed',
              },
              {
                id: 'a2',
                name: 'Missile Bay Door',
                progress: 70,
                status: 'In Progress',
              },
            ],
          },
          {
            id: 's2',
            name: 'Guidance Control Set',
            progress: 60,
            status: 'Pending',
            assemblies: [],
          },
        ],
      },
      {
        id: '2',
        name: 'Electric Car Platform',
        progress: 50,
        status: 'In Progress',
        sets: [
          {
            id: 's3',
            name: 'Armor Fabrication Set',
            progress: 45,
            status: 'Pending',
            assemblies: [],
          },
        ],
      },
    ])
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'secondary'
      case 'In Progress':
        return 'info'
      case 'QA Review':
        return 'warning'
      case 'Completed':
        return 'success'
      default:
        return 'dark'
    }
  }

  const handleAddProduct = (e) => {
    e.preventDefault()
    if (!form.projectId || !form.productName) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAddingProduct(false)
      setSuccessMsg(
        `New product "${form.productName}" successfully added to ${projects.find(
          (p) => p.id === form.projectId,
        )?.name}.`,
      )
      setForm({
        projectId: '',
        productName: '',
        batchCode: '',
        estimatedCompletion: '',
      })
    }, 1000)
  }

  return (
    <CContainer fluid className="mt-4 fade-in">
      <CRow>
        <CCol>
          <h3 className="fw-bold text-primary mb-3">Production Dashboard</h3>
        </CCol>
      </CRow>

      {successMsg && (
        <CRow>
          <CCol>
            <CAlert color="success" className="fw-semibold text-center">
              {successMsg}
            </CAlert>
          </CCol>
        </CRow>
      )}

      {/* Add Product Section */}
      <CRow className="mb-4">
        <CCol>
          <CCard className="border-0 shadow-sm rounded-4">
            <CCardHeader className="bg-dark text-white d-flex justify-content-between align-items-center">
              <strong>Add New Product / Production Batch</strong>
              <CButton
                color={addingProduct ? 'danger' : 'warning'}
                className="text-white"
                size="sm"
                onClick={() => setAddingProduct(!addingProduct)}
              >
                {addingProduct ? 'Cancel' : 'Add New'}
              </CButton>
            </CCardHeader>
            <CCollapse visible={addingProduct}>
              <CCardBody>
                <CForm onSubmit={handleAddProduct}>
                  <CRow className="g-3">
                    <CCol md={4}>
                      <CFormSelect
                        label="Select Project"
                        value={form.projectId}
                        onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={4}>
                      <CFormInput
                        label="Product Name"
                        placeholder="Enter product name"
                        value={form.productName}
                        onChange={(e) => setForm({ ...form, productName: e.target.value })}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormInput
                        label="Batch Code"
                        placeholder="e.g. BX-2025-01"
                        value={form.batchCode}
                        onChange={(e) => setForm({ ...form, batchCode: e.target.value })}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormInput
                        type="date"
                        label="Estimated Completion"
                        value={form.estimatedCompletion}
                        onChange={(e) => setForm({ ...form, estimatedCompletion: e.target.value })}
                      />
                    </CCol>
                  </CRow>

                  <div className="text-center mt-4">
                    <CButton
                      color="primary"
                      className="rounded-pill px-5 fw-semibold"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <CSpinner size="sm" className="me-2" /> Saving...
                        </>
                      ) : (
                        'Save Product'
                      )}
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCollapse>
          </CCard>
        </CCol>
      </CRow>

      {/* Production Overview */}
      <CRow>
        {projects.map((proj) => (
          <CCol xs={12} className="mb-4" key={proj.id}>
            <CCard className="shadow-sm border-0 rounded-4">
              <CCardHeader
                className="bg-primary text-white d-flex justify-content-between align-items-center"
                onClick={() =>
                  setExpandedProject(expandedProject === proj.id ? null : proj.id)
                }
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <strong>{proj.name}</strong> &nbsp;
                  <CBadge color={getStatusColor(proj.status)}>{proj.status}</CBadge>
                </div>
                <span>{expandedProject === proj.id ? '▲' : '▼'}</span>
              </CCardHeader>

              <CCollapse visible={expandedProject === proj.id}>
                <CCardBody>
                  <CProgress
                    className="mb-3"
                    color={getStatusColor(proj.status)}
                    value={proj.progress}
                    animated
                    striped
                  />
                  {proj.sets.map((set) => (
                    <div key={set.id} className="mb-3 p-3 border rounded-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold text-dark">
                          {set.name} &nbsp;
                          <CBadge color={getStatusColor(set.status)}>{set.status}</CBadge>
                        </div>
                        <small className="text-muted">{set.progress}%</small>
                      </div>
                      <CProgress
                        className="mt-2 mb-3"
                        color={getStatusColor(set.status)}
                        value={set.progress}
                        animated
                      />
                      {set.assemblies.length > 0 ? (
                        <div>
                          {set.assemblies.map((asm) => (
                            <div
                              key={asm.id}
                              className="d-flex justify-content-between align-items-center border-bottom py-2"
                            >
                              <div>
                                <span className="fw-semibold">{asm.name}</span>
                              </div>
                              <div>
                                <CBadge color={getStatusColor(asm.status)} className="me-2">
                                  {asm.status}
                                </CBadge>
                                <small className="text-muted">{asm.progress}%</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <CAlert color="secondary" className="mb-0 py-2">
                          No assemblies added yet.
                        </CAlert>
                      )}
                    </div>
                  ))}
                </CCardBody>
              </CCollapse>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <style>
        {`
          .fade-in { animation: fadeIn 0.4s ease-in-out; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .card-header:hover {
            filter: brightness(1.05);
            transition: 0.2s;
          }
        `}
      </style>
    </CContainer>
  )
}

export default ProductionModule
