import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import projectService from '../../../services/projectService'
import partService from '../../../services/partService'
import qualificationTestService from '../../../services/qualificationTestService'

const QualificationDocuments = () => {
  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projects)

  const [projectsList, setProjectsList] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingParts, setLoadingParts] = useState(false)
  const [parts, setParts] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    project: '',
    setId: '',
    assemblyId: '',
    partItem: '',
    partId: '',
    partCode: '',
    documentType: '',
    remarks: '',
    document: null,
  })

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const loadProjects = async () => {
      if (projects?.length) {
        setProjectsList(projects)
        return
      }
      setLoadingProjects(true)
      try {
        const data = await projectService.getAll()
        setProjectsList(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load projects.')
      } finally {
        setLoadingProjects(false)
      }
    }
    loadProjects()
  }, [projects])

  const selectedProject = useMemo(
    () => projectsList.find((p) => (p._id || p.id) === form.project) || null,
    [projectsList, form.project],
  )

  const setOptions = useMemo(() => selectedProject?.sets || [], [selectedProject])

  const assemblyOptions = useMemo(() => {
    if (!form.setId) return []
    const selectedSet = setOptions.find((set) => (set._id || set.id) === form.setId)
    if (!selectedSet) return []
    const allAssemblies = [
      ...(selectedSet.assemblies || []),
      ...(selectedSet.structures || []).flatMap((structure) => structure.assemblies || []),
    ]
    const deduped = new Map()
    allAssemblies.forEach((asm) => {
      const id = asm?._id || asm?.id || asm
      if (!id) return
      if (!deduped.has(id)) {
        deduped.set(id, asm)
      }
    })
    return Array.from(deduped.values())
  }, [form.setId, setOptions])

  useEffect(() => {
    const loadParts = async () => {
      if (!form.project || !form.assemblyId) {
        setParts([])
        return
      }
      setLoadingParts(true)
      try {
        const data = await partService.getAll({
          project: form.project,
          assembly: form.assemblyId,
        })
        setParts(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load parts.')
      } finally {
        setLoadingParts(false)
      }
    }
    loadParts()
  }, [form.project, form.assemblyId])

  const partItemLabel = (part) =>
    part?.name || part?.code || part?.partId || part?.shortName || 'Part'
  const partIdLabel = (part) =>
    part?.code || part?.partId || part?._id || part?.id || 'ID'

  const partItemOptions = useMemo(() => {
    const deduped = new Map()
    parts.forEach((part) => {
      const label = partItemLabel(part)
      if (!label || deduped.has(label)) return
      deduped.set(label, part)
    })
    return Array.from(deduped.keys())
  }, [parts])

  const partIdOptions = useMemo(() => {
    if (!form.partItem) return []
    return parts.filter((part) => partItemLabel(part) === form.partItem)
  }, [form.partItem, parts])

  const handlePartIdChange = (value) => {
    const selectedPart = parts.find((part) => (part._id || part.id) === value)
    setForm((prev) => ({
      ...prev,
      partId: value,
      partCode: selectedPart ? partIdLabel(selectedPart) : '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.project || !form.setId || !form.assemblyId || !form.partItem || !form.partId) {
      setError('Project, set, assembly, part item, and part ID are required.')
      return
    }
    if (!form.partCode.trim()) {
      setError('Part ID is required.')
      return
    }
    if (!form.documentType) {
      setError('Document type is required.')
      return
    }
    setSaving(true)
    try {
      let uploadedDocument = null
      if (form.document) {
        uploadedDocument = await qualificationTestService.upload(form.document)
      }
      const payload = {
        title: `${form.documentType} Document`,
        status: 'Submitted',
        owner: 'Quality',
        date: new Date().toISOString(),
        remarks: form.remarks || undefined,
        documentType: form.documentType,
        partId: form.partCode.trim(),
        document: uploadedDocument || undefined,
        project: form.project,
        part: form.partId,
        assembly: form.assemblyId,
      }
      await qualificationTestService.add(payload)
      setSuccess('Qualification document saved successfully.')
      setForm({
        project: form.project,
        setId: form.setId,
        assemblyId: form.assemblyId,
        partItem: '',
        partId: '',
        partCode: '',
        documentType: '',
        remarks: '',
        document: null,
      })
    } catch (err) {
      setError(err?.message || 'Failed to save qualification document.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CContainer fluid className="py-4">
      <CRow className="justify-content-center">
        <CCol xl={8}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-body-secondary fw-semibold">
              Qualification Documents
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}
              {success && (
                <CAlert color="success" className="mb-3">
                  {success}
                </CAlert>
              )}
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormSelect
                      label="Project*"
                      value={form.project}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          project: e.target.value,
                          setId: '',
                          assemblyId: '',
                          partItem: '',
                          partId: '',
                          partCode: '',
                        })
                      }
                      required
                    >
                      <option value="">
                        {loadingProjects ? 'Loading projects...' : 'Select project'}
                      </option>
                      {projectsList.map((project) => (
                        <option key={project._id || project.id} value={project._id || project.id}>
                          {project.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Set*"
                      value={form.setId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          setId: e.target.value,
                          assemblyId: '',
                          partItem: '',
                          partId: '',
                          partCode: '',
                        })
                      }
                      required
                      disabled={!form.project}
                    >
                      <option value="">Select set</option>
                      {setOptions.map((set) => (
                        <option key={set._id || set.id} value={set._id || set.id}>
                          {set.name || 'Set'}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Assembly*"
                      value={form.assemblyId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          assemblyId: e.target.value,
                          partItem: '',
                          partId: '',
                          partCode: '',
                        })
                      }
                      required
                      disabled={!form.setId}
                    >
                      <option value="">Select assembly</option>
                      {assemblyOptions.map((assembly) => (
                        <option
                          key={assembly._id || assembly.id}
                          value={assembly._id || assembly.id}
                        >
                          {assembly.name || 'Assembly'}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Part / Item*"
                      value={form.partItem}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          partItem: e.target.value,
                          partId: '',
                          partCode: '',
                        }))
                      }
                      required
                      disabled={!form.assemblyId || loadingParts}
                    >
                      <option value="">
                        {loadingParts ? 'Loading parts...' : 'Select part item'}
                      </option>
                      {partItemOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Part ID*"
                      value={form.partId}
                      onChange={(e) => handlePartIdChange(e.target.value)}
                      required
                      disabled={!form.partItem || loadingParts}
                    >
                      <option value="">
                        {loadingParts ? 'Loading parts...' : 'Select part ID'}
                      </option>
                      {partIdOptions.map((part) => (
                        <option key={part._id || part.id} value={part._id || part.id}>
                          {partIdLabel(part)}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormSelect
                      label="Document Type*"
                      value={form.documentType}
                      onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                      required
                    >
                      <option value="">Select document type</option>
                      <option value="Quality Report">Quality Report</option>
                      <option value="NCR">NCR</option>
                      <option value="PDF">PDF</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      type="file"
                      label="Upload Document"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                      onChange={(e) => setForm({ ...form, document: e.target.files?.[0] || null })}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      label="Remarks"
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    />
                  </CCol>
                </CRow>
                <div className="d-flex justify-content-end mt-4">
                  <CButton color="primary" type="submit" disabled={saving}>
                    {saving ? <CSpinner size="sm" /> : 'Save'}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default QualificationDocuments
