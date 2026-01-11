import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CCollapse,
  CContainer,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CListGroup,
  CListGroupItem,
  CModal,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowCircleRight, cilCloudUpload, cilPaperclip, cilPlus } from '@coreui/icons'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import qualificationTestService from '../../../services/qualificationTestService'
import projectService from '../../../services/projectService'

const mergeProjectsById = (existing = [], incoming = []) => {
  const map = new Map()
  ;[...existing, ...incoming].forEach((p) => {
    const id = p.id || p._id
    if (!id) return
    map.set(id, { ...p, id })
  })
  return Array.from(map.values())
}

const QualificationTestsOnParts = () => {
  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)
  const [searchParams, setSearchParams] = useSearchParams()

  const [qualificationData, setQualificationData] = useState({})
  const [projectsList, setProjectsList] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [expandedSets, setExpandedSets] = useState({})
  const [expandedParts, setExpandedParts] = useState({})
  const [selectedPartId, setSelectedPartId] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    order: '',
    qcWeight: '',
    remarks: '',
    document: '',
    ncr: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  const searchKey = searchParams.toString()

  useEffect(() => {
    const loadTests = async () => {
      setLoading(true)
      setError(null)
      try {
        const [data, backendProjects] = await Promise.all([
          qualificationTestService.getAll(),
          projectService.getAll().catch(() => []),
        ])
        const allProjects = mergeProjectsById(
          projects,
          backendProjects.length ? backendProjects : projects,
        )
        setProjectsList(allProjects)
        const grouped = {}
        allProjects.forEach((p) => {
          const projectId = p.id || p._id
          if (projectId) grouped[projectId] = { sets: [] }
        })

        data.forEach((test, idx) => {
          const projectId = test.project?._id || test.project
          if (!grouped[projectId]) grouped[projectId] = { sets: [] }
          const setId = test.assembly?._id || test.assembly || 'unassigned-set'
          const setName = test.assembly?.name || 'Unassigned Set'
          if (!grouped[projectId].sets.find((s) => s.id === setId)) {
            grouped[projectId].sets.push({ id: setId, name: setName, parts: [] })
          }

          const targetSet = grouped[projectId].sets.find((s) => s.id === setId)
          const partId = test.part?._id || test.part || `part-${idx}`
          const partCode = test.part?.code || test.part?.partId || partId
          let partRef = targetSet.parts.find((p) => p.id === partId)
          if (!partRef) {
            partRef = {
              id: partId,
              code: partCode,
              revision: test.part?.revision || '—',
              description: test.part?.description || test.part?.name || 'Part',
              remarks: test.remarks || '—',
              tests: [],
            }
            targetSet.parts.push(partRef)
          }

          partRef.tests.push({
            id: test._id || `test-${idx}`,
            name: test.title || 'Qualification Test',
            document: test.document?.name || test.document?.url || '',
            order: test.order || partRef.tests.length + 1,
            qcWeight: test.qcWeight || '—',
            ncr: (test.status || '').toLowerCase().includes('ncr'),
            remarks: test.remarks || '—',
          })
        })

        setQualificationData(grouped)
        if (!selectedProjectId) {
          const fromUrl = searchParams.get('project')
          if (fromUrl) {
            setSelectedProjectId(fromUrl)
            dispatch({ type: 'setActiveProject', projectId: fromUrl })
          } else if (activeProjectId) {
            setSelectedProjectId(activeProjectId)
          } else if (allProjects.length) {
            const fallback = allProjects[0].id
            setSelectedProjectId(fallback)
            dispatch({ type: 'setActiveProject', projectId: fallback })
          }
        }
      } catch (err) {
        setQualificationData({})
        setError(err?.message || 'Unable to load qualification tests.')
      } finally {
        setLoading(false)
      }
    }

    loadTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, dispatch, projects, searchKey])

  const availableSets = useMemo(
    () => qualificationData[selectedProjectId]?.sets || [],
    [qualificationData, selectedProjectId],
  )

  const selectedPart = useMemo(() => {
    for (const set of availableSets) {
      const found = set.parts.find((part) => part.id === selectedPartId)
      if (found) return found
    }
    return null
  }, [availableSets, selectedPartId])

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId)
    setSelectedPartId('')
    setExpandedSets({})
    setExpandedParts({})
    const params = new URLSearchParams(searchParams)
    if (projectId) {
      params.set('project', projectId)
      dispatch({ type: 'setActiveProject', projectId })
    } else {
      params.delete('project')
    }
    setSearchParams(params)
  }

  const toggleSet = (setId) => {
    setExpandedSets((prev) => ({ ...prev, [setId]: !prev[setId] }))
  }

  const togglePart = (partId) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }))
    setSelectedPartId(partId)
  }

  const findSetIdForPart = (projectId, partId) => {
    const project = qualificationData[projectId]
    if (!project) return ''
    for (const set of project.sets) {
      if (set.parts.find((p) => p.id === partId)) return set.id
    }
    return ''
  }

  const handleUploadDocument = (setId, partId, testId, event) => {
    const file = event.target.files?.[0]
    if (!file) return

    handleAttachDocument(setId, partId, testId, file.name)

    // Reset the input so the same file can be selected again if needed
    event.target.value = ''
  }

  const handleAttachDocument = (setId, partId, testId, document) => {
    setQualificationData((prev) => {
      const next = { ...prev }
      const project = next[selectedProjectId]
      if (!project) return prev
      project.sets = project.sets.map((set) => {
        if (set.id !== setId) return set
        return {
          ...set,
          parts: set.parts.map((part) => {
            if (part.id !== partId) return part
            return {
              ...part,
              tests: part.tests.map((test) => (test.id === testId ? { ...test, document } : test)),
            }
          }),
        }
      })
      return { ...next }
    })
  }

  const handleAddTest = async (e) => {
    e.preventDefault()
    if (!selectedPartId) return

    try {
      setLoading(true)
      const assemblyId = findSetIdForPart(selectedProjectId, selectedPartId)
      const payload = {
        title: form.name || 'Qualification Test',
        status: form.ncr ? 'NCR' : 'Pending',
        owner: 'Quality',
        date: new Date().toISOString(),
        remarks: form.remarks || `Order ${form.order || '1'} | Weight ${form.qcWeight || '—'}`,
        document: form.document ? { name: form.document, url: '', size: 0, type: '' } : undefined,
        project: selectedProjectId,
        part: selectedPartId,
        assembly: assemblyId !== 'unassigned-set' ? assemblyId : undefined,
      }
      const created = await qualificationTestService.add(payload)
      const newTest = {
        id: created._id,
        name: created.title || form.name || 'Qualification Test',
        document: created.document?.name || created.document?.url || form.document || '',
        order: form.order || created.order || '1',
        qcWeight: form.qcWeight || created.qcWeight || '—',
        ncr: (created.status || '').toLowerCase().includes('ncr'),
        remarks: created.remarks || form.remarks || '—',
      }

      setQualificationData((prev) => {
        const next = { ...prev }
        const project = next[selectedProjectId] || { sets: [] }
        if (!project.sets.length) project.sets = []
        let setRef = project.sets.find((s) => s.id === (assemblyId || 'unassigned-set'))
        if (!setRef) {
          setRef = {
            id: assemblyId || 'unassigned-set',
            name: assemblyId ? 'Assembly Set' : 'Unassigned Set',
            parts: [],
          }
          project.sets.push(setRef)
        }
        let partRef = setRef.parts.find((p) => p.id === selectedPartId)
        if (!partRef) {
          partRef = {
            id: selectedPartId,
            code: selectedPart?.code || selectedPartId,
            revision: '—',
            description: 'Part',
            remarks: payload.remarks || '—',
            tests: [],
          }
          setRef.parts.push(partRef)
        }
        partRef.tests.push(newTest)
        next[selectedProjectId] = project
        return next
      })

      setShowAddModal(false)
      setForm({ name: '', order: '', qcWeight: '', remarks: '', document: '', ncr: false })
    } catch (err) {
      setError(err?.message || 'Failed to add test.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CContainer fluid className="py-4">
      <CRow className="g-3">
        <CCol lg={3}>
          <CCard className="shadow-sm border-0 h-100">
            <CCardHeader className="bg-body-secondary fw-semibold">Selection Tree View</CCardHeader>
            <CCardBody>
              <CFormSelect
                label="Project"
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
              >
                <option value="">Select Project</option>
                {projectsList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </CFormSelect>
              <div className="mt-3 small text-uppercase text-body-secondary">Configuration</div>
              <CListGroup className="mt-2">
                {availableSets.map((set) => (
                  <React.Fragment key={set.id}>
                    <CListGroupItem
                      action
                      className="d-flex justify-content-between align-items-center"
                      onClick={() => toggleSet(set.id)}
                    >
                      <span>
                        <CIcon icon={cilArrowCircleRight} className="me-2 text-primary" />
                        {set.name}
                      </span>
                      <CBadge color="light" className="text-primary">
                        {set.parts.length}
                      </CBadge>
                    </CListGroupItem>
                    <CCollapse visible={!!expandedSets[set.id]}>
                      <CListGroup className="border-start border-2 ms-3">
                        {set.parts.map((part) => (
                          <CListGroupItem
                            key={part.id}
                            action
                          active={selectedPartId === part.id}
                          className="d-flex justify-content-between align-items-center"
                          onClick={() => togglePart(part.id)}
                        >
                            <span>{part.code || part.id}</span>
                            <CBadge color="warning" className="text-dark">
                              Rev {part.revision}
                            </CBadge>
                          </CListGroupItem>
                        ))}
                      </CListGroup>
                    </CCollapse>
                  </React.Fragment>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={9}>
          <CCard className="shadow-sm border-0 mb-3">
            <CCardHeader className="bg-body-secondary d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">Qualification Tests on Parts</div>
                <div className="small text-body-secondary">Attach QC reports to part revisions</div>
              </div>
              <div className="d-flex gap-2">
                <CFormSelect
                  size="sm"
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  disabled={!availableSets.length}
                >
                  <option value="">Select Part</option>
                  {availableSets
                    .flatMap((set) => set.parts)
                    .map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.code || part.id} — Rev {part.revision}
                      </option>
                    ))}
                </CFormSelect>
                <CButton
                  color="light"
                  size="sm"
                  className="text-primary fw-semibold"
                  disabled={!selectedPartId}
                  onClick={() => setShowAddModal(true)}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  Add QC Test
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}
              {loading && (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <CSpinner size="sm" />
                  <span>Loading qualification tests...</span>
                </div>
              )}
              <CRow className="g-3 mb-3">
                <CCol md={6}>
                  <CFormInput
                    label="Part ID"
                    value={selectedPart?.code || selectedPart?.id || ''}
                    readOnly
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput label="Part Revision" value={selectedPart?.revision || ''} readOnly />
                </CCol>
              </CRow>
              <CTable hover responsive bordered align="middle" className="mb-0">
                <CTableHead color="dark">
                  <CTableRow>
                    <CTableHeaderCell scope="col">Part ID*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Revision ID*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Description*</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Remarks</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {availableSets.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={4} className="text-center text-body-secondary py-4">
                        Select a project to view qualification tests on parts.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {availableSets
                    .flatMap((set) => set.parts)
                    .map((part) => (
                      <React.Fragment key={part.id}>
                        <CTableRow
                          active={part.id === selectedPartId}
                          onClick={() => togglePart(part.id)}
                          role="button"
                        >
                          <CTableDataCell className="fw-semibold">
                            {part.code || part.id}
                          </CTableDataCell>
                          <CTableDataCell>{part.revision}</CTableDataCell>
                          <CTableDataCell>{part.description}</CTableDataCell>
                          <CTableDataCell>{part.remarks}</CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell colSpan={4} className="p-0">
                            <CCollapse visible={!!expandedParts[part.id]}>
                              <div className="p-3 bg-body-secondary">
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                  <div className="fw-semibold">QC Tests</div>
                                  <CBadge color="secondary">{part.tests.length} entries</CBadge>
                                </div>
                                <CTable
                                  bordered
                                  small
                                  responsive
                                  align="middle"
                                  className="mb-0 bg-white"
                                >
                                  <CTableHead color="light">
                                    <CTableRow>
                                      <CTableHeaderCell scope="col">QC Test*</CTableHeaderCell>
                                      <CTableHeaderCell scope="col">Document</CTableHeaderCell>
                                      <CTableHeaderCell scope="col">Order*</CTableHeaderCell>
                                      <CTableHeaderCell scope="col">QC Weight</CTableHeaderCell>
                                      <CTableHeaderCell scope="col">Remarks</CTableHeaderCell>
                                      <CTableHeaderCell scope="col">NCR</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    <CTableRow
                                      role="button"
                                      onClick={() => {
                                        setSelectedPartId(part.id)
                                        setShowAddModal(true)
                                      }}
                                    >
                                      <CTableDataCell
                                        colSpan={6}
                                        className="fw-semibold text-primary"
                                      >
                                        Please click here to add new row...
                                      </CTableDataCell>
                                    </CTableRow>
                                    {part.tests.map((test) => (
                                      <CTableRow key={test.id}>
                                        <CTableDataCell>{test.name}</CTableDataCell>
                                        <CTableDataCell>
                                          <div className="d-flex align-items-center gap-2 flex-wrap">
                                            <CButton
                                              color="link"
                                              className="p-0"
                                              onClick={() =>
                                                handleAttachDocument(
                                                  availableSets.find((set) =>
                                                    set.parts.includes(part),
                                                  )?.id || '',
                                                  part.id,
                                                  test.id,
                                                  test.document || `QC_Attachment_${test.id}.pdf`,
                                                )
                                              }
                                            >
                                              <CIcon icon={cilPaperclip} className="me-2" />
                                              {test.document ? test.document : 'Attach Doc'}
                                            </CButton>
                                            <div>
                                              <CFormInput
                                                type="file"
                                                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.txt,image/*"
                                                id={`upload-${part.id}-${test.id}`}
                                                className="d-none"
                                                onChange={(e) =>
                                                  handleUploadDocument(
                                                    availableSets.find((set) =>
                                                      set.parts.includes(part),
                                                    )?.id || '',
                                                    part.id,
                                                    test.id,
                                                    e,
                                                  )
                                                }
                                              />
                                              <CButton
                                                color="secondary"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  document
                                                    .getElementById(`upload-${part.id}-${test.id}`)
                                                    ?.click()
                                                }
                                              >
                                                <CIcon icon={cilCloudUpload} className="me-2" />
                                                Upload Report
                                              </CButton>
                                            </div>
                                          </div>
                                        </CTableDataCell>
                                        <CTableDataCell>{test.order}</CTableDataCell>
                                        <CTableDataCell>{test.qcWeight}</CTableDataCell>
                                        <CTableDataCell>{test.remarks || '—'}</CTableDataCell>
                                        <CTableDataCell>
                                          <CBadge
                                            color={test.ncr ? 'danger' : 'success'}
                                            className="text-white"
                                          >
                                            {test.ncr ? 'Yes' : 'No'}
                                          </CBadge>
                                        </CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </div>
                            </CCollapse>
                          </CTableDataCell>
                        </CTableRow>
                      </React.Fragment>
                    ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal
        alignment="center"
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        scrollable
        backdrop="static"
      >
        <CForm onSubmit={handleAddTest}>
          <CCard className="mb-0 border-0">
            <CCardHeader className="fw-semibold">Add QC Test</CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    label="QC Test Name*"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Document"
                    placeholder="e.g., Test_Report.pdf"
                    value={form.document}
                    onChange={(e) => setForm({ ...form, document: e.target.value })}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Order*"
                    type="number"
                    min="1"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="QC Weight"
                    type="number"
                    step="0.01"
                    value={form.qcWeight}
                    onChange={(e) => setForm({ ...form, qcWeight: e.target.value })}
                  />
                </CCol>
                <CCol xs={12}>
                  <CFormInput
                    label="Remarks"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </CCol>
                <CCol xs={12} className="d-flex align-items-center">
                  <CFormCheck
                    id="ncrFlag"
                    label="NCR Raised"
                    checked={form.ncr}
                    onChange={(e) => setForm({ ...form, ncr: e.target.checked })}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
          <div className="d-flex justify-content-end gap-2 p-3">
            <CButton color="secondary" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={!selectedPartId}>
              <CIcon icon={cilPlus} className="me-2" />
              Add Test
            </CButton>
          </div>
        </CForm>
      </CModal>
    </CContainer>
  )
}

export default QualificationTestsOnParts
