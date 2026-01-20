// src/views/pages/production/BuildTree.js
import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CFormSelect,
  CRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import projectService from '../../../services/projectService'
import partService from '../../../services/partService'

const BuildTree = () => {
  const dispatch = useDispatch()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [sets, setSets] = useState([])
  const [selectedSetId, setSelectedSetId] = useState('')
  const [setNoInput, setSetNoInput] = useState('')
  const [drawingNoSearch, setDrawingNoSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [treeParts, setTreeParts] = useState([])
  const [parentPartId, setParentPartId] = useState('')
  const [partToRemove, setPartToRemove] = useState('')
  
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    code: '',
    drawingNo: '',
    partIdNo: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectService.getAll()
        setProjects(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load projects.')
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) {
      setSets([])
      setSelectedSetId('')
      return
    }
    const loadSets = async () => {
      try {
        const project = projects.find((p) => (p._id || p.id) === selectedProjectId)
        if (project?.sets) {
          setSets(project.sets || [])
        } else {
          setSets([])
        }
      } catch (err) {
        setError(err?.message || 'Unable to load sets.')
      }
    }
    loadSets()
  }, [selectedProjectId, projects])

  useEffect(() => {
    if (!selectedProjectId || !selectedSetId) {
      setTreeParts([])
      return
    }
    const loadTree = async () => {
      setLoading(true)
      try {
        const tree = await partService.getTree(selectedProjectId, selectedSetId)
        setTreeParts(tree || [])
      } catch (err) {
        setError(err?.message || 'Unable to load tree.')
      } finally {
        setLoading(false)
      }
    }
    loadTree()
  }, [selectedProjectId, selectedSetId])

  const handleSetNoChange = (value) => {
    setSetNoInput(value)
    // Find set by name or number
    const matchingSet = sets.find((set) => 
      set.name?.toLowerCase().includes(value.toLowerCase()) ||
      set._id?.toString().includes(value) ||
      set.id?.toString().includes(value)
    )
    if (matchingSet) {
      setSelectedSetId(matchingSet._id || matchingSet.id)
    }
  }

  const handleDrawingNoSearch = async (value) => {
    setDrawingNoSearch(value)
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    try {
      const results = await partService.searchByDrawingNo(value)
      setSearchResults(results || [])
    } catch (err) {
      setSearchResults([])
    }
  }

  const allPartsInTree = useMemo(() => {
    const flatten = (parts) => {
      let result = []
      parts.forEach((part) => {
        result.push(part)
        if (part.children && part.children.length > 0) {
          result = result.concat(flatten(part.children))
        }
      })
      return result
    }
    return flatten(treeParts)
  }, [treeParts])

  const handleAddPart = async () => {
    if (!selectedProjectId || !selectedSetId) {
      setError('Please select a project and set.')
      return
    }
    if (!newPartForm.name || !newPartForm.code) {
      setError('Part name and code are required.')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const payload = {
        ...newPartForm,
        project: selectedProjectId,
        set: selectedSetId,
        parentPart: parentPartId || null,
      }
      
      await partService.addToTree(payload)
      setSuccess('Part added successfully!')
      setNewPartForm({ name: '', code: '', drawingNo: '', partIdNo: '' })
      setParentPartId('')
      setDrawingNoSearch('')
      setSearchResults([])
      
      // Reload tree
      const tree = await partService.getTree(selectedProjectId, selectedSetId)
      setTreeParts(tree || [])
    } catch (err) {
      setError(err?.message || 'Failed to add part.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePart = async () => {
    if (!partToRemove) {
      setError('Please select a part to remove.')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      await partService.removeFromTree(partToRemove)
      setSuccess('Part removed successfully!')
      setPartToRemove('')
      
      // Reload tree
      const tree = await partService.getTree(selectedProjectId, selectedSetId)
      setTreeParts(tree || [])
    } catch (err) {
      setError(err?.message || 'Failed to remove part.')
    } finally {
      setLoading(false)
    }
  }

  const renderTree = (parts, level = 0) => {
    if (!parts || parts.length === 0) {
      return <div className="text-body-secondary ms-3">No parts in tree</div>
    }
    
    return (
      <div className="ms-3">
        {parts.map((part) => (
          <div key={part._id || part.id} className="mb-2">
            <div className="d-flex align-items-center">
              <div style={{ marginLeft: `${level * 20}px` }}>
                <strong>{part.name}</strong>
                {part.drawingNo && <span className="text-body-secondary ms-2">({part.drawingNo})</span>}
                {part.partIdNo && <span className="text-body-secondary ms-2">ID: {part.partIdNo}</span>}
              </div>
            </div>
            {part.children && part.children.length > 0 && renderTree(part.children, level + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <CContainer fluid className="py-4">
      <CRow className="g-4">
        <CCol xs={12}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-body-secondary fw-semibold">Build Tree</CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3" onClose={() => setError('')}>
                  {error}
                </CAlert>
              )}
              {success && (
                <CAlert color="success" className="mb-3" onClose={() => setSuccess('')}>
                  {success}
                </CAlert>
              )}
              
              <CRow className="g-3 mb-4">
                <CCol md={6}>
                  <CFormSelect
                    label="Project*"
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value)
                      setSelectedSetId('')
                      setTreeParts([])
                    }}
                  >
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project._id || project.id} value={project._id || project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    label="Select Set"
                    value={selectedSetId}
                    onChange={(e) => setSelectedSetId(e.target.value)}
                    disabled={!selectedProjectId}
                  >
                    <option value="">Select Set</option>
                    {sets.map((set) => (
                      <option key={set._id || set.id} value={set._id || set.id}>
                        {set.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Enter Set No"
                    value={setNoInput}
                    onChange={(e) => handleSetNoChange(e.target.value)}
                    placeholder="Enter set number"
                  />
                </CCol>
              </CRow>

              <hr className="my-4" />

              <h5 className="mb-3">Add Part to Tree</h5>
              <CRow className="g-3 mb-4">
                <CCol md={6}>
                  <CFormInput
                    label="Search Part By Drawing No"
                    value={drawingNoSearch}
                    onChange={(e) => handleDrawingNoSearch(e.target.value)}
                    placeholder="Type drawing number to search"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2">
                      <CFormSelect
                        onChange={(e) => {
                          const selected = searchResults.find((p) => (p._id || p.id) === e.target.value)
                          if (selected) {
                            setNewPartForm({
                              name: selected.name || '',
                              code: selected.code || '',
                              drawingNo: selected.drawingNo || '',
                              partIdNo: selected.partIdNo || '',
                            })
                            setDrawingNoSearch(selected.drawingNo || '')
                            setSearchResults([])
                          }
                        }}
                      >
                        <option value="">Select from results</option>
                        {searchResults.map((part) => (
                          <option key={part._id || part.id} value={part._id || part.id}>
                            {part.name} - {part.drawingNo || part.code}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>
                  )}
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    label="Parent of this Part"
                    value={parentPartId}
                    onChange={(e) => setParentPartId(e.target.value)}
                    disabled={!selectedProjectId || !selectedSetId}
                  >
                    <option value="">None (Root level)</option>
                    {allPartsInTree.map((part) => (
                      <option key={part._id || part.id} value={part._id || part.id}>
                        {part.name} {part.drawingNo && `(${part.drawingNo})`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Part Name*"
                    value={newPartForm.name}
                    onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Part Code*"
                    value={newPartForm.code}
                    onChange={(e) => setNewPartForm({ ...newPartForm, code: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Drawing No / Ref Doc. No."
                    value={newPartForm.drawingNo}
                    onChange={(e) => setNewPartForm({ ...newPartForm, drawingNo: e.target.value })}
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    label="Part ID No"
                    value={newPartForm.partIdNo}
                    onChange={(e) => setNewPartForm({ ...newPartForm, partIdNo: e.target.value })}
                  />
                </CCol>
                <CCol xs={12}>
                  <CButton color="primary" onClick={handleAddPart} disabled={loading}>
                    {loading ? <CSpinner size="sm" /> : 'Add'}
                  </CButton>
                </CCol>
              </CRow>

              <hr className="my-4" />

              <h5 className="mb-3">Tree View</h5>
              {loading && !treeParts.length ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <div className="border rounded p-3" style={{ minHeight: '200px', backgroundColor: '#f8f9fa' }}>
                  {treeParts.length > 0 ? (
                    renderTree(treeParts)
                  ) : (
                    <div className="text-center text-body-secondary py-5">
                      No parts in tree. Add parts using the form above.
                    </div>
                  )}
                </div>
              )}

              <hr className="my-4" />

              <h5 className="mb-3">Remove Part</h5>
              <CRow className="g-3">
                <CCol md={8}>
                  <CFormSelect
                    label="Select Part to Remove"
                    value={partToRemove}
                    onChange={(e) => setPartToRemove(e.target.value)}
                    disabled={!selectedProjectId || !selectedSetId || allPartsInTree.length === 0}
                  >
                    <option value="">Select</option>
                    {allPartsInTree.map((part) => (
                      <option key={part._id || part.id} value={part._id || part.id}>
                        {part.name} {part.drawingNo && `(${part.drawingNo})`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="d-flex align-items-end">
                  <CButton color="danger" onClick={handleRemovePart} disabled={loading || !partToRemove}>
                    {loading ? <CSpinner size="sm" /> : 'Remove'}
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default BuildTree
