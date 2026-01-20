// src/views/pages/production/PartsRegistry.js
import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilTrash,
  cilMagnifyingGlass,
  cilCheckCircle,
  cilWarning,
} from '@coreui/icons'
import partService from '../../../services/partService'

const PART_TYPES = ['Mechanical', 'Electrical', 'Ablative', 'Composite']

const initialFormState = {
  name: '',
  code: '',
  partType: 'Mechanical',
  description: '',
  owner: '',
  status: 'Draft',
  // Mechanical fields
  designNumber: '',
  revisionNumber: '',
  revisionDate: '',
  // Non-mechanical fields
  partIdOrReference: '',
  // Qualification
  isQualified: false,
  qualificationReportName: '',
  qualificationReportUrl: '',
  // NCR
  ncrNumber: '',
  ncrReportName: '',
  ncrReportUrl: '',
}

const PartsRegistry = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parts, setParts] = useState([])
  const [filteredParts, setFilteredParts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPart, setEditingPart] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingPart, setDeletingPart] = useState(null)

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  const loadParts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await partService.getAll()
      setParts(data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadParts()
  }, [loadParts])

  useEffect(() => {
    let filtered = parts
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term) ||
          p.designNumber?.toLowerCase().includes(term) ||
          p.partIdOrReference?.toLowerCase().includes(term)
      )
    }
    if (filterType) {
      filtered = filtered.filter((p) => p.partType === filterType)
    }
    setFilteredParts(filtered)
  }, [parts, searchTerm, filterType])

  const openAddModal = () => {
    setEditingPart(null)
    setFormData(initialFormState)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (part) => {
    setEditingPart(part)
    setFormData({
      name: part.name || '',
      code: part.code || '',
      partType: part.partType || 'Mechanical',
      description: part.description || '',
      owner: part.owner || '',
      status: part.status || 'Draft',
      designNumber: part.designNumber || '',
      revisionNumber: part.revisionNumber || '',
      revisionDate: part.revisionDate ? part.revisionDate.slice(0, 10) : '',
      partIdOrReference: part.partIdOrReference || '',
      isQualified: part.isQualified || false,
      qualificationReportName: part.qualificationReport?.name || '',
      qualificationReportUrl: part.qualificationReport?.url || '',
      ncrNumber: part.ncr?.number || '',
      ncrReportName: part.ncr?.report?.name || '',
      ncrReportUrl: part.ncr?.report?.url || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPart(null)
    setFormData(initialFormState)
    setFormErrors({})
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.code.trim()) errors.code = 'Code is required'
    if (!formData.partType) errors.partType = 'Part type is required'

    if (formData.partType === 'Mechanical') {
      if (!formData.designNumber?.trim()) errors.designNumber = 'Design number is required for mechanical parts'
    } else {
      if (!formData.partIdOrReference?.trim()) errors.partIdOrReference = 'Part ID / Reference is required'
    }

    if (!formData.isQualified && !formData.ncrNumber?.trim()) {
      errors.ncrNumber = 'NCR number is required when part is not qualified'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        partType: formData.partType,
        description: formData.description?.trim() || '',
        owner: formData.owner?.trim() || '',
        status: formData.status || 'Draft',
        isQualified: formData.isQualified,
      }

      // Add type-specific fields
      if (formData.partType === 'Mechanical') {
        payload.designNumber = formData.designNumber?.trim() || ''
        payload.revisionNumber = formData.revisionNumber?.trim() || ''
        payload.revisionDate = formData.revisionDate || null
      } else {
        payload.partIdOrReference = formData.partIdOrReference?.trim() || ''
      }

      // Add qualification report if qualified
      if (formData.isQualified && formData.qualificationReportUrl) {
        payload.qualificationReport = {
          name: formData.qualificationReportName || 'Qualification Report',
          url: formData.qualificationReportUrl,
          uploadedAt: new Date(),
        }
      }

      // Add NCR if not qualified
      if (!formData.isQualified && formData.ncrNumber) {
        payload.ncr = {
          number: formData.ncrNumber,
          report: formData.ncrReportUrl
            ? {
                name: formData.ncrReportName || 'NCR Report',
                url: formData.ncrReportUrl,
                uploadedAt: new Date(),
              }
            : null,
        }
      }

      if (editingPart) {
        await partService.update(editingPart._id || editingPart.id, payload)
        setSuccess('Part updated successfully')
      } else {
        await partService.add(payload)
        setSuccess('Part created successfully')
      }

      closeModal()
      loadParts()
    } catch (err) {
      setError(err?.message || 'Failed to save part')
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteConfirm = (part) => {
    setDeletingPart(part)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!deletingPart) return

    setSubmitting(true)
    setError('')
    try {
      await partService.delete(deletingPart._id || deletingPart.id)
      setSuccess('Part deleted successfully')
      setShowDeleteConfirm(false)
      setDeletingPart(null)
      loadParts()
    } catch (err) {
      setError(err?.message || 'Failed to delete part')
    } finally {
      setSubmitting(false)
    }
  }

  const getPartTypeColor = (type) => {
    switch (type) {
      case 'Mechanical':
        return 'primary'
      case 'Electrical':
        return 'warning'
      case 'Ablative':
        return 'danger'
      case 'Composite':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <CContainer fluid className="py-5 text-center">
        <CSpinner color="primary" />
        <p className="mt-2">Loading parts registry...</p>
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="py-3">
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}
      {success && (
        <CAlert color="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </CAlert>
      )}

      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 className="mb-0">Parts Registry</h5>
            <small className="text-muted">Manage parts with qualification and NCR tracking</small>
          </div>
          <CButton color="primary" onClick={openAddModal}>
            <CIcon icon={cilPlus} className="me-1" /> Add Part
          </CButton>
        </CCardHeader>
        <CCardBody>
          {/* Filters */}
          <CRow className="mb-3 g-2">
            <CCol md={6} lg={4}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilMagnifyingGlass} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search by name, code, design number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={4} lg={3}>
              <CFormSelect value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Part Types</option>
                {PART_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} lg={2}>
              <CBadge color="secondary" className="p-2">
                {filteredParts.length} parts
              </CBadge>
            </CCol>
          </CRow>

          {/* Table */}
          <CTable hover responsive bordered className="align-middle">
            <CTableHead className="table-dark">
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Code</CTableHeaderCell>
                <CTableHeaderCell>Part Type</CTableHeaderCell>
                <CTableHeaderCell>Design / Part ID</CTableHeaderCell>
                <CTableHeaderCell>Revision</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Qualified</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filteredParts.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                    No parts found. Click "Add Part" to create one.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                filteredParts.map((part) => (
                  <CTableRow key={part._id || part.id}>
                    <CTableDataCell className="fw-medium">{part.name}</CTableDataCell>
                    <CTableDataCell>
                      <code>{part.code}</code>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={getPartTypeColor(part.partType)}>{part.partType}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      {part.partType === 'Mechanical'
                        ? part.designNumber || '—'
                        : part.partIdOrReference || '—'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {part.partType === 'Mechanical' ? (
                        <span>
                          {part.revisionNumber || '—'}
                          {part.revisionDate && (
                            <small className="text-muted d-block">
                              {formatDate(part.revisionDate)}
                            </small>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      {part.isQualified ? (
                        <CIcon icon={cilCheckCircle} className="text-success" size="lg" />
                      ) : (
                        <span>
                          <CIcon icon={cilWarning} className="text-warning" size="lg" />
                          {part.ncr?.number && (
                            <small className="d-block text-muted">NCR: {part.ncr.number}</small>
                          )}
                        </span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={part.status === 'Active' ? 'success' : 'secondary'}>
                        {part.status}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(part)}
                        title="Edit"
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteConfirm(part)}
                        title="Delete"
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* Add/Edit Modal */}
      <CModal visible={showModal} onClose={closeModal} size="lg" backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingPart ? 'Edit Part' : 'Add New Part'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              {/* Basic Info */}
              <CCol md={6}>
                <CFormInput
                  label="Part Name *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  invalid={!!formErrors.name}
                  feedbackInvalid={formErrors.name}
                />
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Part Code *"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  invalid={!!formErrors.code}
                  feedbackInvalid={formErrors.code}
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Part Type *"
                  value={formData.partType}
                  onChange={(e) => handleInputChange('partType', e.target.value)}
                  invalid={!!formErrors.partType}
                  feedbackInvalid={formErrors.partType}
                >
                  {PART_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormInput
                  label="Owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="e.g., ADG, DDG, Sr Dte..."
                />
              </CCol>
              <CCol md={6}>
                <CFormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </CFormSelect>
              </CCol>
              <CCol md={12}>
                <CFormTextarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                />
              </CCol>

              {/* Mechanical-specific fields */}
              {formData.partType === 'Mechanical' && (
                <>
                  <CCol xs={12}>
                    <hr />
                    <h6 className="text-primary">Mechanical Part Details</h6>
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      label="Design Number *"
                      value={formData.designNumber}
                      onChange={(e) => handleInputChange('designNumber', e.target.value)}
                      invalid={!!formErrors.designNumber}
                      feedbackInvalid={formErrors.designNumber}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      label="Revision Number"
                      value={formData.revisionNumber}
                      onChange={(e) => handleInputChange('revisionNumber', e.target.value)}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="date"
                      label="Revision Date"
                      value={formData.revisionDate}
                      onChange={(e) => handleInputChange('revisionDate', e.target.value)}
                    />
                  </CCol>
                </>
              )}

              {/* Non-mechanical fields */}
              {formData.partType !== 'Mechanical' && (
                <>
                  <CCol xs={12}>
                    <hr />
                    <h6 className="text-warning">{formData.partType} Part Details</h6>
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      label="Part ID / Reference Number *"
                      value={formData.partIdOrReference}
                      onChange={(e) => handleInputChange('partIdOrReference', e.target.value)}
                      invalid={!!formErrors.partIdOrReference}
                      feedbackInvalid={formErrors.partIdOrReference}
                    />
                  </CCol>
                </>
              )}

              {/* Qualification Section */}
              <CCol xs={12}>
                <hr />
                <h6 className="text-success">Qualification Status</h6>
              </CCol>
              <CCol md={12}>
                <CFormCheck
                  label="Part is Qualified"
                  checked={formData.isQualified}
                  onChange={(e) => handleInputChange('isQualified', e.target.checked)}
                />
              </CCol>

              {formData.isQualified && (
                <>
                  <CCol md={6}>
                    <CFormInput
                      label="Qualification Report Name"
                      value={formData.qualificationReportName}
                      onChange={(e) => handleInputChange('qualificationReportName', e.target.value)}
                      placeholder="e.g., QR-2024-001"
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      label="Qualification Report URL"
                      value={formData.qualificationReportUrl}
                      onChange={(e) => handleInputChange('qualificationReportUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </CCol>
                </>
              )}

              {/* NCR Section (when not qualified) */}
              {!formData.isQualified && (
                <>
                  <CCol xs={12}>
                    <hr />
                    <h6 className="text-danger">NCR (Non-Conformance Report)</h6>
                    <small className="text-muted">Required when part is not qualified</small>
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      label="NCR Number *"
                      value={formData.ncrNumber}
                      onChange={(e) => handleInputChange('ncrNumber', e.target.value)}
                      invalid={!!formErrors.ncrNumber}
                      feedbackInvalid={formErrors.ncrNumber}
                      placeholder="e.g., NCR-2024-001"
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      label="NCR Report Name"
                      value={formData.ncrReportName}
                      onChange={(e) => handleInputChange('ncrReportName', e.target.value)}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormInput
                      label="NCR Report URL"
                      value={formData.ncrReportUrl}
                      onChange={(e) => handleInputChange('ncrReportUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </CCol>
                </>
              )}
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeModal} disabled={submitting}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CSpinner size="sm" /> : editingPart ? 'Update Part' : 'Add Part'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <CModalHeader>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete <strong>{deletingPart?.name}</strong>? This action cannot
          be undone.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={submitting}
          >
            Cancel
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? <CSpinner size="sm" /> : 'Delete'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}

export default PartsRegistry
