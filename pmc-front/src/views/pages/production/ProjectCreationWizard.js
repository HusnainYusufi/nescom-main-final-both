// src/views/pages/production/ProjectCreationWizard.js
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  CProgress,
  CRow,
  CSpinner,
} from '@coreui/react'
import projectService from '../../../services/projectService'
import projectCategoryService from '../../../services/projectCategoryService'
import assemblyService from '../../../services/assemblyService'
import structureService from '../../../services/structureService'

const ProjectCreationWizard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const existingProjects = useSelector((state) => state.projects)
  const [categories, setCategories] = useState([])
  const [categoryInput, setCategoryInput] = useState('')
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [backendProjects, setBackendProjects] = useState([])
  const [loadingInit, setLoadingInit] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const assemblyLibrary = useMemo(() => {
    const collected = []
    const sourceProjects = backendProjects.length ? backendProjects : existingProjects
    sourceProjects.forEach((project) => {
      ;(project.sets || []).forEach((set, setIdx) => {
        ;(set.assemblies || []).forEach((assembly, idx) => {
          const name = typeof assembly === 'string' ? assembly : assembly?.name
          collected.push({
            id: `${project._id || project.id || project.code}-${set._id || set.id || setIdx}-${idx}`,
            name: name || 'Assembly',
            type: assembly?.type || 'Assembly',
            description: assembly?.description || 'Imported from existing project',
            source: `${project.name} / ${set.name || 'Set'}`,
          })
        })
      })
    })
    return collected
  }, [backendProjects, existingProjects])

  const steps = useMemo(
    () => [
      { key: 'basics', title: 'Project details', summary: 'Name, code, category, and type' },
      {
        key: 'sets',
        title: 'Sets & templates',
        summary: 'Add sets or import from existing projects',
      },
      {
        key: 'structures',
        title: 'Structures & assemblies',
        summary: 'Capture structures and assemblies per set',
      },
      {
        key: 'review',
        title: 'Review & create',
        summary: 'Confirm details before creating the project',
      },
    ],
    [],
  )

  const [currentStep, setCurrentStep] = useState(0)
  const [projectForm, setProjectForm] = useState({
    name: '',
    code: '',
    category: '',
    projectType: '',
    visibility: true,
    description: '',
  })
  const [sets, setSets] = useState([
    {
      id: 'set-1',
      backendId: null,
      name: 'Set 1',
      description: 'Default starter set',
      structures: [],
      assemblies: [],
    },
  ])
  const [assemblyInventory, setAssemblyInventory] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [alert, setAlert] = useState('')
  const [errors, setErrors] = useState({})
  const [createdProject, setCreatedProject] = useState(null)
  const [showCreateConfirmation, setShowCreateConfirmation] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState('')
  const isEditing = Boolean(editingProjectId)

  useEffect(() => {
    const loadInitial = async () => {
      setLoadingInit(true)
      try {
        const [cats, projects] = await Promise.all([
          projectCategoryService.getAll().catch(() => []),
          projectService.getAll().catch(() => []),
        ])
        setCategories(cats || [])
        if (cats?.length && projectForm.category) {
          const selected = cats.find((c) => c._id === projectForm.category)
          if (selected) setCategoryInput(selected.name || selected.title || '')
        }
        setBackendProjects(projects || [])
      } catch (err) {
        setAlert(err?.message || 'Unable to load categories or projects for the wizard.')
      } finally {
        setLoadingInit(false)
      }
    }
    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const editId = searchParams.get('edit')
    setEditingProjectId(editId || '')
  }, [searchParams])

  const formatAssemblyType = useCallback((type) => {
    const normalized = (type || '').toLowerCase()
    if (normalized === 'sub-assembly' || normalized === 'sub assembly') return 'Sub-assembly'
    if (normalized === 'kit') return 'Kit'
    return 'Assembly'
  }, [])

  const progressValue = Math.round(((currentStep + 1) / steps.length) * 100)

  const stepStates = useMemo(
    () =>
      steps.map((step, index) => {
        if (index < currentStep) return { ...step, state: 'complete' }
        if (index === currentStep) return { ...step, state: 'active' }
        return { ...step, state: 'upcoming' }
      }),
    [currentStep, steps],
  )

  useEffect(() => {
    setAssemblyInventory((prev) => {
      const seen = new Set(prev.map((item) => item.id))
      const additions = assemblyLibrary.filter((item) => !seen.has(item.id))
      return additions.length ? [...prev, ...additions] : prev
    })
  }, [assemblyLibrary])

  useEffect(() => {
    if (!editingProjectId) return
    const sourceProjects = backendProjects.length ? backendProjects : existingProjects
    const project = sourceProjects.find(
      (item) => (item._id || item.id) === editingProjectId,
    )
    if (!project) return

    const categoryId =
      typeof project.category === 'object' ? project.category?._id : project.category
    const categoryLabel =
      typeof project.category === 'object'
        ? project.category?.name || project.category?.title || ''
        : project.category || ''

    setProjectForm({
      name: project.name || '',
      code: project.code || '',
      category: categoryId || '',
      projectType: project.type || '',
      visibility: true,
      description: project.shortDescription || project.description || '',
    })
    setCategoryInput(categoryLabel)

    const normalizedSets =
      project.sets?.map((set, setIdx) => ({
        id: set._id || set.id || `set-${setIdx + 1}`,
        backendId: set._id || set.id || null,
        name: set.name || `Set ${setIdx + 1}`,
        description: set.description || '',
        material: set.materialSpecs || '',
        structures:
          set.structures?.map((structure, sidx) => ({
            id: structure._id || structure.id || `st-${setIdx + 1}-${sidx + 1}`,
            name: structure.name || `Structure ${sidx + 1}`,
            material: structure.materialSpecs || '',
            description: structure.notes || '',
            assemblyIds: (structure.assemblies || []).map(
              (assembly) => assembly._id || assembly.id || assembly,
            ),
            backendId: structure._id || structure.id || null,
          })) || [],
        assemblies:
          set.assemblies?.map((assembly, aidx) => ({
            id: assembly._id || assembly.id || `as-${setIdx + 1}-${aidx + 1}`,
            name: assembly?.name || `Assembly ${aidx + 1}`,
            type: formatAssemblyType(assembly?.type),
            description: assembly?.notes || assembly?.description || '',
            source: 'Existing',
            saved: true,
            backendId: assembly?._id || assembly?.id || null,
          })) || [],
      })) || []

    if (normalizedSets.length) {
      setSets(normalizedSets)
    }
    setCurrentStep(0)
  }, [backendProjects, editingProjectId, existingProjects, formatAssemblyType])

  const updateSetField = (setId, field, value) => {
    setSets((prev) => prev.map((set) => (set.id === setId ? { ...set, [field]: value } : set)))
  }

  const handleCategoryInput = (value) => {
    setCategoryInput(value)
    const match = categories.find(
      (cat) => (cat.name || cat.title || '').toLowerCase() === value.toLowerCase(),
    )
    setProjectForm((prev) => ({ ...prev, category: match?._id || '' }))
    setErrors((prev) => ({ ...prev, category: '' }))
  }

  const filteredCategoryOptions = useMemo(() => {
    if (!categoryInput.trim()) return categories
    const query = categoryInput.toLowerCase()
    return categories.filter((cat) => (cat.name || cat.title || '').toLowerCase().includes(query))
  }, [categories, categoryInput])

  const ensureCategory = async () => {
    const name = categoryInput.trim()
    if (!name) {
      setProjectForm((prev) => ({ ...prev, category: '' }))
      return ''
    }
    const existing = categories.find(
      (cat) => (cat.name || cat.title || '').toLowerCase() === name.toLowerCase(),
    )
    if (existing) {
      setProjectForm((prev) => ({ ...prev, category: existing._id }))
      return existing._id
    }
    const created = await projectCategoryService.add({ name })
    const normalized = {
      _id: created._id || created.id,
      name: created.name || name,
      description: created.description || '',
    }
    setCategories((prev) => [normalized, ...prev])
    setProjectForm((prev) => ({ ...prev, category: normalized._id }))
    return normalized._id
  }

  const addSet = () => {
    const newId = `set-${Date.now()}`
    setSets((prev) => [
      ...prev,
      {
        id: newId,
        backendId: null,
        name: `Set ${prev.length + 1}`,
        description: '',
        structures: [],
        assemblies: [],
      },
    ])
  }

  const removeSet = (setId) => {
    setSets((prev) => prev.filter((set) => set.id !== setId))
  }

  const mergeCreatedProjectWithForm = (createdProject) => {
    const formSetsByIndex = sets
    const mergedSets =
      createdProject?.sets?.map((set, idx) => {
        const formSet = formSetsByIndex[idx] || {}
        const mergedAssemblies = (set.assemblies || []).map((asm, aidx) => {
          const formAsm = formSet.assemblies?.[aidx] || {}
          return {
            ...asm,
            backendId: asm._id || asm.id || formAsm.backendId || null,
            name: asm.name || formAsm.name || `Assembly ${aidx + 1}`,
            type: asm.type || formAsm.type || 'assembly',
            status: asm.status || 'Draft',
          }
        })
        const mergedStructures =
          (set.structures && set.structures.length ? set.structures : formSet.structures) || []
        return {
          ...set,
          id: set._id || set.id || formSet.id,
          backendId: set._id || set.id || formSet.backendId || null,
          name: set.name || formSet.name,
          description: set.description || formSet.description,
          structures: mergedStructures,
          assemblies: mergedAssemblies,
        }
      }) || formSetsByIndex

    return {
      ...createdProject,
      id: createdProject.id || createdProject._id,
      sets: mergedSets,
    }
  }

  const addStructure = (setId) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              structures: [
                ...set.structures,
                {
                  id: `st-${Date.now()}`,
                  name: `Structure ${set.structures.length + 1}`,
                  material: '',
                  assemblyIds: [],
                },
              ],
            }
          : set,
      ),
    )
  }

  const addAssembly = (setId) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              assemblies: [
                ...set.assemblies,
                {
                  id: `as-${Date.now()}`,
                  name: `Assembly ${set.assemblies.length + 1}`,
                  type: 'Assembly',
                  description: '',
                  source: 'Local',
                  saved: false,
                  backendId: null,
                },
              ],
            }
          : set,
      ),
    )
  }

  const removeAssembly = (setId, assemblyId) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? { ...set, assemblies: set.assemblies.filter((asm) => asm.id !== assemblyId) }
          : set,
      ),
    )
  }

  const updateStructureField = (setId, structureId, field, value) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              structures: set.structures.map((structure) =>
                structure.id === structureId ? { ...structure, [field]: value } : structure,
              ),
            }
          : set,
      ),
    )
  }

  const updateAssemblyField = (setId, assemblyId, field, value) => {
    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              assemblies: set.assemblies.map((assembly) =>
                assembly.id === assemblyId ? { ...assembly, [field]: value } : assembly,
              ),
            }
          : set,
      ),
    )
  }

  const addAssemblyFromInventory = (setId, inventoryId) => {
    const template = assemblyInventory.find((item) => item.id === inventoryId)
    if (!template) return

    setSets((prev) =>
      prev.map((set) =>
        set.id === setId
          ? {
              ...set,
              assemblies: [
                ...set.assemblies,
                {
                  id: `as-${Date.now()}`,
                  name: template.name,
                  type: template.type || 'Assembly',
                  description: template.description || '',
                  source: template.source || 'Inventory',
                  saved: true,
                  backendId: null,
                },
              ],
            }
          : set,
      ),
    )
  }

  const saveAssemblyToInventory = (assembly) => {
    if (!assembly.name) return
    const exists = assemblyInventory.some(
      (item) => item.name.toLowerCase() === assembly.name.toLowerCase(),
    )
    if (exists) return

    const newInventoryItem = {
      id: `inventory-${Date.now()}`,
      name: assembly.name,
      type: assembly.type || 'Assembly',
      description: assembly.description || 'Saved from project wizard',
      source: 'Wizard inventory',
    }
    setAssemblyInventory((prev) => [...prev, newInventoryItem])
  }

  const importSets = () => {
    const sourceProjects = backendProjects.length ? backendProjects : existingProjects
    const templateProject = sourceProjects.find(
      (project) => project.id === selectedProjectId || project._id === selectedProjectId,
    )
    if (!templateProject) {
      setAlert('Please select a project to import from first.')
      return
    }
    if (!templateProject.sets || templateProject.sets.length === 0) {
      setAlert('The selected project does not contain any sets to import yet.')
      return
    }

    const importedSets = templateProject.sets.map((set, index) => ({
      id: `import-${Date.now()}-${index + 1}`,
      backendId: null,
      name: set.name,
      description: `Imported from ${templateProject.name}`,
      structures: [],
      assemblies: (set.assemblies || []).map((asm, idx) => ({
        id: `as-${index + 1}-${idx + 1}`,
        name: typeof asm === 'string' ? asm : asm?.name || `Assembly ${idx + 1}`,
        type: (asm?.type || 'assembly').toLowerCase(),
        description: asm?.notes || `Imported from ${templateProject.name}`,
        source: 'Imported',
        saved: true,
      })),
    }))

    setSets((prev) => [...prev, ...importedSets])
    setAlert(
      `Imported ${importedSets.length} set(s) from ${templateProject.name} and appended to existing sets.`,
    )
  }

  const validateBasics = () => {
    const nextErrors = {}
    if (!projectForm.name.trim()) nextErrors.name = 'Project name is required'
    if (!projectForm.code.trim()) nextErrors.code = 'Project code is required'
    if (!projectForm.category) nextErrors.category = 'Select a category'
    if (!projectForm.projectType) nextErrors.projectType = 'Choose Special or Conventional'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const goToStep = (direction) => {
    if (direction > 0 && steps[currentStep].key === 'basics' && !validateBasics()) return
    setAlert('')
    setCurrentStep((prev) => {
      const next = prev + direction
      if (next < 0) return 0
      if (next >= steps.length) return steps.length - 1
      return next
    })
  }

  const handleSubmit = async () => {
    // Only create when explicitly triggered from the review step.
    if (steps[currentStep].key !== 'review') return
    setSubmitError('')
    if (!validateBasics()) return
    if (!sets.length) {
      setAlert('Add at least one set before creating the project.')
      return
    }

    setSubmitting(true)
    try {
      // Ensure category exists/selected
      let categoryId = projectForm.category
      if (!categoryId) {
        categoryId = await ensureCategory()
      }
      if (!categoryId) {
        setErrors((prev) => ({ ...prev, category: 'Select or create a category' }))
        throw new Error('Category is required')
      }

      // Create assemblies per set (reuse existing ids when editing)
      const assemblyIdMap = {}
      const assemblyLookup = new Map()
      for (const set of sets) {
        const ids = []
        for (const assembly of set.assemblies || []) {
          if (!assembly.name?.trim()) continue
          let resolvedId = assembly.backendId || null
          if (!resolvedId) {
            const payload = {
              name: assembly.name.trim(),
              type: (assembly.type || 'assembly').toLowerCase(),
              notes: assembly.description || '',
            }
            const created = await assemblyService.add(payload)
            resolvedId = created?._id || null
          }
          if (resolvedId) {
            ids.push(resolvedId)
            assemblyLookup.set(assembly.id, resolvedId)
          }
        }
        assemblyIdMap[set.id] = ids
      }

      // Create structures per set
      const structureIdMap = {}
      const allStructureIds = []
      for (const set of sets) {
        const ids = []
        for (const structure of set.structures || []) {
          if (!structure.name?.trim()) continue
          let resolvedId = structure.backendId || null
          if (!resolvedId) {
            const linkedAssemblies = (structure.assemblyIds || [])
              .map((assemblyId) => assemblyLookup.get(assemblyId))
              .filter(Boolean)
            const payload = {
              name: structure.name.trim(),
              materialSpecs: structure.material || '',
              notes: structure.description || '',
              assemblies: linkedAssemblies,
            }
            const created = await structureService.add(payload)
            resolvedId = created?._id || null
          }
          if (resolvedId) {
            ids.push(resolvedId)
            allStructureIds.push(resolvedId)
          }
        }
        structureIdMap[set.id] = ids
      }

      const payload = {
        name: projectForm.name.trim(),
        code: projectForm.code.trim(),
        category: categoryId,
        type: (projectForm.projectType || '').toLowerCase(),
        shortDescription: projectForm.description,
        sets: sets.map((set) => ({
          _id: set.backendId || undefined,
          name: set.name,
          description: set.description,
          materialSpecs: set.material || '',
          assemblies: assemblyIdMap[set.id] || [],
          structures: structureIdMap[set.id] || [],
        })),
        // keep top-level for backward compatibility / reporting
        structures: allStructureIds,
      }

      const saved = isEditing
        ? await projectService.update(editingProjectId, payload)
        : await projectService.add(payload)
      const enriched = mergeCreatedProjectWithForm(saved)

      if (isEditing) {
        dispatch({ type: 'updateProject', projectId: enriched.id || enriched._id, changes: enriched })
      } else {
        dispatch({ type: 'addProject', project: enriched })
      }
      setCreatedProject(enriched)
      projectService
        .getAll()
        .then((list) => {
          dispatch({
            type: 'set',
            projects: (list || []).map((p) => ({ ...p, id: p.id || p._id })),
            activeProjectId: enriched.id || enriched._id,
          })
        })
        .catch(() => {})
      setShowCreateConfirmation(true)
      setAlert('')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create project. Please try again.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const goToProjectTree = () => {
    if (!createdProject) return
    setShowCreateConfirmation(false)
    const pid = createdProject._id || createdProject.id
    navigate(`/production/treeview?project=${pid}`)
  }

  const renderBasics = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CFormInput
          label="Project name"
          name="name"
          placeholder="e.g., Guided Payload Upgrade"
          value={projectForm.name}
          onChange={(event) => {
            setProjectForm({ ...projectForm, name: event.target.value })
            setErrors({ ...errors, name: '' })
          }}
          invalid={!!errors.name}
          feedbackInvalid={errors.name}
        />
      </CCol>
      <CCol md={6}>
        <CFormInput
          label="Project code"
          name="code"
          placeholder="PX-400"
          value={projectForm.code}
          onChange={(event) => {
            setProjectForm({ ...projectForm, code: event.target.value })
            setErrors({ ...errors, code: '' })
          }}
          invalid={!!errors.code}
          feedbackInvalid={errors.code}
        />
      </CCol>
      <CCol md={6}>
        <div className="position-relative">
          <CFormInput
            label="Category"
            type="text"
            value={categoryInput}
            list="category-options"
            placeholder="Type to search or create"
            autoComplete="off"
            onFocus={() => setShowCategorySuggestions(true)}
            onChange={(event) => handleCategoryInput(event.target.value)}
            onBlur={() => {
              ensureCategory()
              setTimeout(() => setShowCategorySuggestions(false), 120)
            }}
            invalid={!!errors.category}
            feedbackInvalid={errors.category}
          />
          <datalist id="category-options">
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name || cat.title || ''} />
            ))}
          </datalist>
          {showCategorySuggestions && (
            <div
              className="position-absolute top-100 start-0 w-100 bg-white border rounded shadow-sm mt-1 z-3"
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                background: 'var(--cui-body-bg, #fff)',
                color: 'var(--cui-body-color, #212529)',
              }}
            >
              {filteredCategoryOptions.length > 0 ? (
                filteredCategoryOptions.map((cat) => {
                  const label = cat.name || cat.title || ''
                  return (
                    <div
                      key={cat._id}
                      role="button"
                      tabIndex={0}
                      className="w-100"
                      onMouseDown={(e) => e.preventDefault()}
                      style={{
                        background: 'var(--cui-body-bg, #fff)',
                        color: 'var(--cui-body-color, #212529)',
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setCategoryInput(label)
                        setProjectForm((prev) => ({ ...prev, category: cat._id }))
                        setErrors((prev) => ({ ...prev, category: '' }))
                        setShowCategorySuggestions(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setCategoryInput(label)
                          setProjectForm((prev) => ({ ...prev, category: cat._id }))
                          setErrors((prev) => ({ ...prev, category: '' }))
                          setShowCategorySuggestions(false)
                        }
                      }}
                    >
                      {label || 'Untitled category'}
                    </div>
                  )
                })
              ) : (
                <div
                  className="text-body-secondary small"
                  style={{ padding: '0.5rem 0.75rem', background: 'var(--cui-body-bg, #fff)' }}
                >
                  No categories found
                </div>
              )}
            </div>
          )}
        </div>
      </CCol>
      <CCol md={6}>
        <CFormSelect
          label="Project type"
          name="projectType"
          value={projectForm.projectType}
          onChange={(event) => {
            setProjectForm({ ...projectForm, projectType: event.target.value })
            setErrors({ ...errors, projectType: '' })
          }}
          invalid={!!errors.projectType}
          feedbackInvalid={errors.projectType}
        >
          <option value="">Select project type</option>
          <option value="special">Special</option>
          <option value="conventional">Conventional</option>
        </CFormSelect>
      </CCol>
      <CCol md={6}>
        <CFormCheck
          label="Show this project for reuse and set imports"
          checked={projectForm.visibility}
          onChange={(event) => setProjectForm({ ...projectForm, visibility: event.target.checked })}
        />
      </CCol>
      <CCol md={12}>
        <CFormTextarea
          label="Short description"
          name="description"
          placeholder="What are we building in this project?"
          value={projectForm.description}
          onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })}
          rows={3}
        />
      </CCol>
    </CRow>
  )

  const renderSets = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CFormSelect
          label="Import sets from existing project"
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
        >
          <option value="">Select project</option>
          {(backendProjects.length ? backendProjects : existingProjects).map((project) => (
            <option key={project._id || project.id} value={project._id || project.id}>
              {project.name} ({project.code})
            </option>
          ))}
        </CFormSelect>
        <CButton color="secondary" variant="outline" className="mt-2" onClick={importSets}>
          Import selected project sets
        </CButton>
      </CCol>
      <CCol md={6} className="d-flex align-items-end justify-content-md-end">
        <div className="text-md-end w-100">
          <p className="mb-2 text-body-secondary small">Start from blank or reuse a template.</p>
          <CButton color="primary" onClick={addSet}>
            Add a new set
          </CButton>
        </div>
      </CCol>
      {sets.map((set) => (
        <CCol md={6} key={set.id}>
          <CCard className="h-100 shadow-sm border-start border-4 border-primary">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{set.name}</h6>
                  <p className="text-body-secondary small mb-0">
                    Describe the set so teams know when to reuse it.
                  </p>
                </div>
                <div className="d-flex flex-column align-items-end gap-2">
                  <CBadge color="info">Reusable</CBadge>
                  <CButton
                    color="danger"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSet(set.id)}
                  >
                    Remove set
                  </CButton>
                </div>
              </div>
              <CFormInput
                label="Set name"
                value={set.name}
                onChange={(event) => updateSetField(set.id, 'name', event.target.value)}
                className="mb-3"
              />
              <CFormTextarea
                label="Purpose / description"
                value={set.description}
                onChange={(event) => updateSetField(set.id, 'description', event.target.value)}
                rows={2}
              />
            </CCardBody>
          </CCard>
        </CCol>
      ))}
    </CRow>
  )

  const renderStructures = () => (
    <CRow className="g-3">
      {sets.map((set) => {
        const existingAssemblyNames = assemblyInventory.map((item) => item.name.toLowerCase())
        return (
          <CCol xs={12} key={set.id}>
            <CCard className="shadow-sm composition-card">
              <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="mb-1">{set.name}</h6>
                  <p className="small text-body-secondary mb-0">
                    Capture structures and assemblies for this set. Pull from inventory or create
                    new ones on the fly.
                  </p>
                </div>
                <CBadge color="primary">Step 3</CBadge>
              </CCardHeader>
              <CCardBody>
                <CRow className="g-4">
                  <CCol md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="text-body-secondary mb-0">Structures</h6>
                      <CButton
                        color="secondary"
                        size="sm"
                        variant="outline"
                        onClick={() => addStructure(set.id)}
                      >
                        Add structure
                      </CButton>
                    </div>
                    <CRow className="g-2">
                      {set.structures.map((structure) => (
                        <CCol md={12} key={structure.id}>
                          <div className="p-3 border rounded-3 bg-body-tertiary h-100">
                            <CFormInput
                              label="Structure name"
                              value={structure.name}
                              placeholder="e.g., Control frame"
                              className="mb-2"
                              onChange={(event) =>
                                updateStructureField(
                                  set.id,
                                  structure.id,
                                  'name',
                                  event.target.value,
                                )
                              }
                            />
                            <CFormInput
                              label="Material / spec"
                              value={structure.material}
                              placeholder="Composite, metallic, etc."
                              onChange={(event) =>
                                updateStructureField(
                                  set.id,
                                  structure.id,
                                  'material',
                                  event.target.value,
                                )
                              }
                            />
                            <CFormSelect
                              label="Linked assemblies"
                              multiple
                              value={structure.assemblyIds || []}
                              onChange={(event) => {
                                const options = Array.from(event.target.selectedOptions).map(
                                  (option) => option.value,
                                )
                                updateStructureField(set.id, structure.id, 'assemblyIds', options)
                              }}
                              className="mt-2"
                            >
                              {set.assemblies.length === 0 && (
                                <option disabled value="">
                                  Add assemblies to link them
                                </option>
                              )}
                              {set.assemblies.map((assembly) => (
                                <option key={assembly.id} value={assembly.id}>
                                  {assembly.name || 'Assembly'}
                                </option>
                              ))}
                            </CFormSelect>
                          </div>
                        </CCol>
                      ))}
                      {set.structures.length === 0 && (
                        <CCol>
                          <CAlert color="light" className="text-center mb-0">
                            No structures yet. Add a structure to describe the core build items.
                          </CAlert>
                        </CCol>
                      )}
                    </CRow>
                  </CCol>

                  <CCol md={6}>
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <div>
                        <h6 className="text-body-secondary mb-0">Assemblies</h6>
                        <small className="text-body-secondary">
                          Reuse from inventory or create new.
                        </small>
                      </div>
                      <CButton
                        color="secondary"
                        size="sm"
                        variant="outline"
                        onClick={() => addAssembly(set.id)}
                      >
                        Add new assembly
                      </CButton>
                    </div>

                    <CFormSelect
                      size="sm"
                      className="mb-3"
                      value=""
                      onChange={(event) => addAssemblyFromInventory(set.id, event.target.value)}
                    >
                      <option value="">Pull an assembly from inventory</option>
                      {assemblyInventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.source}
                        </option>
                      ))}
                    </CFormSelect>

                    <CRow className="g-3">
                      {set.assemblies.map((assembly) => {
                        const alreadySaved = existingAssemblyNames.includes(
                          assembly.name?.toLowerCase(),
                        )
                        return (
                          <CCol md={12} key={assembly.id}>
                            <div className="p-3 border rounded-3 bg-body h-100 shadow-sm">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="mb-0">{assembly.name || 'New assembly'}</h6>
                                  <small className="text-body-secondary">
                                    {assembly.source || 'Local'}
                                  </small>
                                </div>
                                <CBadge
                                  color={assembly.saved || alreadySaved ? 'success' : 'secondary'}
                                >
                                  {assembly.saved || alreadySaved ? 'In inventory' : 'Draft'}
                                </CBadge>
                              </div>

                              <CRow className="g-2 mb-2">
                                <CCol md={8}>
                                  <CFormInput
                                    label="Assembly name"
                                    value={assembly.name}
                                    placeholder="e.g., Avionics rack"
                                    onChange={(event) =>
                                      updateAssemblyField(
                                        set.id,
                                        assembly.id,
                                        'name',
                                        event.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                                <CCol md={4}>
                                  <CFormSelect
                                    label="Type"
                                    value={assembly.type}
                                    onChange={(event) =>
                                      updateAssemblyField(
                                        set.id,
                                        assembly.id,
                                        'type',
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="Assembly">Assembly</option>
                                    <option value="Sub-assembly">Sub-assembly</option>
                                    <option value="Kit">Kit</option>
                                  </CFormSelect>
                                </CCol>
                                <CCol md={12}>
                                  <CFormTextarea
                                    label="Notes / parts"
                                    value={assembly.description || ''}
                                    placeholder="List key parts or notes for procurement"
                                    rows={2}
                                    onChange={(event) =>
                                      updateAssemblyField(
                                        set.id,
                                        assembly.id,
                                        'description',
                                        event.target.value,
                                      )
                                    }
                                  />
                                </CCol>
                              </CRow>

                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-body-secondary">
                                  Save frequently used assemblies to reuse later.
                                </small>
                                <CButton
                                  color="success"
                                  size="sm"
                                  disabled={!assembly.name || alreadySaved}
                                  onClick={() => {
                                    saveAssemblyToInventory(assembly)
                                    updateAssemblyField(set.id, assembly.id, 'saved', true)
                                  }}
                                >
                                  {alreadySaved ? 'Already in inventory' : 'Save to inventory'}
                                </CButton>
                              </div>
                              <div className="d-flex justify-content-end mt-2">
                                <CButton
                                  color="danger"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAssembly(set.id, assembly.id)}
                                >
                                  Remove
                                </CButton>
                              </div>
                            </div>
                          </CCol>
                        )
                      })}
                      {set.assemblies.length === 0 && (
                        <CCol>
                          <CAlert color="light" className="text-center mb-0">
                            No assemblies yet. Select from inventory or add a new one to get
                            started.
                          </CAlert>
                        </CCol>
                      )}
                    </CRow>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>
        )
      })}
    </CRow>
  )

  const renderReview = () => (
    <CRow className="g-3">
      <CCol md={6}>
        <CCard className="h-100 shadow-sm">
          <CCardHeader>Project overview</CCardHeader>
          <CCardBody>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <strong>Name:</strong> {projectForm.name || '—'}
              </li>
              <li className="mb-2">
                <strong>Code:</strong> {projectForm.code || '—'}
              </li>
              <li className="mb-2">
                <strong>Category:</strong> {projectForm.category || '—'}
              </li>
              <li className="mb-2">
                <strong>Project type:</strong> {projectForm.projectType || '—'}
              </li>
              <li className="mb-2">
                <strong>Visible for reuse:</strong> {projectForm.visibility ? 'Yes' : 'Hidden'}
              </li>
              <li>
                <strong>Description:</strong> {projectForm.description || '—'}
              </li>
            </ul>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol md={6}>
        <CCard className="h-100 shadow-sm">
          <CCardHeader>Sets and reuse plan</CCardHeader>
          <CCardBody>
            {sets.map((set) => (
              <div key={set.id} className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{set.name}</h6>
                    <p className="small text-body-secondary mb-1">
                      {set.description || 'No description added yet.'}
                    </p>
                    <p className="small mb-1">
                      <strong>Structures:</strong>{' '}
                      {set.structures.map((st) => st.name).join(', ') || '—'}
                    </p>
                    <p className="small mb-0">
                      <strong>Assemblies:</strong>{' '}
                      {set.assemblies.map((as) => as.name).join(', ') || '—'}
                    </p>
                  </div>
                  <CBadge color="success">Ready</CBadge>
                </div>
              </div>
            ))}
          </CCardBody>
        </CCard>
      </CCol>
      <CCol xs={12}>
        <CAlert color="warning" className="mb-0">
          This wizard creates the project via the backend API and then returns you to the Projects
          Tree. Default status is Draft; you can refine sets, structures, and assemblies later.
        </CAlert>
      </CCol>
    </CRow>
  )

  const renderStepContent = () => {
    switch (steps[currentStep].key) {
      case 'basics':
        return renderBasics()
      case 'sets':
        return renderSets()
      case 'structures':
        return renderStructures()
      case 'review':
        return renderReview()
      default:
        return null
    }
  }

  if (loadingInit) {
    return (
      <CContainer fluid className="py-5 text-center">
        <CSpinner color="primary" />
      </CContainer>
    )
  }

  return (
    <CContainer fluid className="mt-4">
      <CModal alignment="center" visible={showCreateConfirmation} backdrop="static">
        <CModalHeader>
          <CModalTitle className="fw-semibold">
            {isEditing ? 'Project updated' : 'Project created'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-2">
            <strong>{createdProject?.name}</strong> has been saved with its sets and assemblies. You
            can continue refining it here or open the hierarchy view next.
          </p>
          <p className="text-body-secondary mb-0">
            The project stays available for reuse and offline work. Choose where to go next.
          </p>
        </CModalBody>
        <CModalFooter className="justify-content-between">
          <CButton
            color="secondary"
            variant="ghost"
            onClick={() => setShowCreateConfirmation(false)}
          >
            Stay on wizard
          </CButton>
          <CButton color="primary" className="fw-semibold" onClick={goToProjectTree}>
            Open production tree view
          </CButton>
        </CModalFooter>
      </CModal>

      <CRow className="justify-content-center">
        <CCol lg={11} xl={11}>
          <CCard className="shadow-sm border-0 wizard-card">
            <CCardHeader className="wizard-card__header border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">{isEditing ? 'Update project' : 'Create a project'}</h4>
                  <p className="text-body-secondary mb-0">
                    Multi-step flow to add a project, sets, and reusable structures.
                  </p>
                </div>
                <CBadge color="warning" className="text-dark">
                  Guided wizard
                </CBadge>
              </div>
              <CProgress
                height={12}
                color="primary"
                value={progressValue}
                className="mb-3 wizard-progress"
              />
              <CRow className="g-3 mb-3 wizard-steps" role="list">
                {stepStates.map((step, index) => (
                  <CCol key={step.key} sm={6} lg={3} role="listitem">
                    <div className={`wizard-step wizard-step--${step.state}`}>
                      <div className="wizard-step__icon">
                        {step.state === 'complete' ? '✓' : index + 1}
                      </div>
                      <div className="wizard-step__content">
                        <span className="wizard-step__title">{step.title}</span>
                        <small className="text-body-secondary d-block">{step.summary}</small>
                      </div>
                    </div>
                  </CCol>
                ))}
              </CRow>
            </CCardHeader>
            <CCardBody>
              {alert && (
                <CAlert color="info" className="mb-3">
                  {alert}
                </CAlert>
              )}
              {submitError && (
                <CAlert color="danger" className="mb-3">
                  {submitError}
                </CAlert>
              )}
              <CForm
                onSubmit={(e) => {
                  // Block implicit Enter submits; creation is only via the button.
                  e.preventDefault()
                }}
              >
                {renderStepContent()}

                <div className="d-flex justify-content-between align-items-center pt-4 border-top mt-4">
                  <div>
                    <CButton
                      color="secondary"
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        currentStep === 0 || currentStep === 1
                          ? navigate('/production/treeview')
                          : goToStep(-1)
                      }
                    >
                      Back
                    </CButton>
                  </div>
                  {steps[currentStep].key === 'review' ? (
                    <CButton
                      color="warning"
                      className="text-dark fw-semibold"
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <CSpinner size="sm" />
                      ) : isEditing ? (
                        'Update project'
                      ) : (
                        'Create project'
                      )}
                    </CButton>
                  ) : (
                    <CButton color="primary" type="button" onClick={() => goToStep(1)}>
                      Next step
                    </CButton>
                  )}
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <style>
        {`
          .wizard-card {
            background: var(--cui-body-bg);
          }
          .wizard-card__header {
            background: transparent;
          }
          .wizard-progress {
            --cui-progress-bg: var(--cui-tertiary-bg);
          }
          .wizard-steps {
            --wizard-step-gap: 0.75rem;
          }
          .wizard-step {
            display: flex;
            gap: var(--wizard-step-gap);
            align-items: center;
            border: 1px solid var(--cui-border-color);
            border-radius: 0.75rem;
            padding: 0.75rem 0.85rem;
            background: var(--cui-body-bg);
            min-height: 80px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          }
          .wizard-step__icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            background: var(--cui-tertiary-bg);
            color: var(--cui-body-color);
          }
          .wizard-step__title {
            font-weight: 700;
            display: block;
          }
          .wizard-step--active {
            border-color: var(--cui-primary);
            box-shadow: 0 6px 18px rgba(0, 98, 204, 0.25);
          }
          .wizard-step--active .wizard-step__icon {
            background: var(--cui-primary);
            color: #fff;
          }
          .wizard-step--complete {
            border-color: var(--cui-success);
            background: rgba(25, 135, 84, 0.08);
          }
          .wizard-step--complete .wizard-step__icon {
            background: var(--cui-success);
            color: #fff;
          }
          .wizard-step--upcoming {
            opacity: 0.8;
          }
          .composition-card {
            border: 1px solid var(--cui-border-color);
          }
          .composition-card .bg-body-tertiary {
            background: var(--cui-tertiary-bg) !important;
          }
          .composition-card .bg-body {
            background: var(--cui-body-bg) !important;
          }
          @media (max-width: 767.98px) {
            .wizard-step {
              min-height: auto;
            }
          }
        `}
      </style>
    </CContainer>
  )
}

export default ProjectCreationWizard
