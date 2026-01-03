// src/views/pages/production/ProjectTimelineBoard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import CIcon from '@coreui/icons-react'
import {
  cilClock,
  cilCommentBubble,
  cilPeople,
  cilList,
  cilSpeedometer,
  cilSwapHorizontal,
} from '@coreui/icons'
import {
  CAvatar,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
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
  CTooltip,
} from '@coreui/react'

const statusAccent = {
  Complete: 'success',
  'In Progress': 'info',
  'At Risk': 'warning',
  Upcoming: 'secondary',
}

const healthTone = {
  'On Track': 'success',
  Guarded: 'warning',
  Watch: 'danger',
}

const statusScore = {
  Draft: 30,
  'In Configuration': 45,
  'In Production': 75,
  Complete: 100,
  'Pending QC': 60,
  'In Review': 55,
}

const mapStatusToTimeline = (status = '') => {
  const normalized = status.toLowerCase()
  if (normalized.includes('complete')) return 'Complete'
  if (normalized.includes('production')) return 'In Progress'
  if (normalized.includes('pending') || normalized.includes('review')) return 'At Risk'
  if (normalized.includes('configuration')) return 'Upcoming'
  return 'Upcoming'
}

const deriveProjectFromStore = (project) => {
  const sets = project.sets || []
  const statuses = []
  let structuresCount = 0
  let assembliesCount = 0

  sets.forEach((set) => {
    if (set.status) statuses.push(set.status)
    ;(set.assemblies || []).forEach((assembly) => {
      assembliesCount += 1
      if (assembly.status) statuses.push(assembly.status)
    })
    ;(set.structures || []).forEach((structure) => {
      structuresCount += 1
      if (structure.status) statuses.push(structure.status)
      ;(structure.assemblies || []).forEach((assembly) => {
        assembliesCount += 1
        if (assembly.status) statuses.push(assembly.status)
      })
    })
  })

  const progress = statuses.length
    ? Math.min(
        100,
        Math.round(
          statuses.reduce((sum, status) => sum + (statusScore[status] || 40), 0) / statuses.length,
        ),
      )
    : 15

  const milestones = sets.flatMap((set) => [
    {
      id: `${project.id}-${set.id}`,
      date: set.status || '—',
      title: set.name,
      status: mapStatusToTimeline(set.status),
      owner: project.owner || 'Owner',
      detail: `${(set.structures || []).length} structures • ${(set.assemblies || []).length} assemblies • ${(set.qcReports || []).length} QC files`,
    },
    ...(set.structures || []).map((structure) => ({
      id: `${project.id}-${set.id}-${structure.name}`,
      date: structure.status || '—',
      title: `${structure.name} assemblies (${structure.assemblies?.length || 0})`,
      status: mapStatusToTimeline(structure.status),
      owner: project.owner || 'Owner',
      detail: `${structure.qcReports?.length || 0} QC logs • ${(structure.assemblies || []).reduce(
        (sum, assembly) => sum + (assembly.qcReports?.length || 0),
        0,
      )} assembly attachments`,
    })),
  ])

  const health = progress >= 75 ? 'On Track' : progress >= 50 ? 'Guarded' : 'Watch'
  const focusAreas = sets.length ? sets.map((set) => set.name) : ['Production readiness']
  const defaultComments = [
    {
      id: `${project.id}-quality`,
      author: 'Quality',
      role: 'Quality',
      text: `${sets.length} set(s) with ${structuresCount} structures and ${assembliesCount} assemblies tracked.`,
      time: 'Today',
    },
  ]

  return {
    ...project,
    progress,
    health,
    stage: project.stage || project.status || 'Not started',
    summary: project.description || 'No description shared yet for this project.',
    focusAreas,
    milestones,
    comments: project.comments?.length ? project.comments : defaultComments,
    structuresCount,
    assembliesCount,
  }
}
const ProjectTimelineBoard = () => {
  const dispatch = useDispatch()
  const projectsFromStore = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [pendingProjectId, setPendingProjectId] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(true)
  const [commentForm, setCommentForm] = useState({
    author: '',
    role: 'Contributor',
    text: '',
  })

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const derivedProjects = projectsFromStore.map(deriveProjectFromStore)
    setProjects((previous) => {
      const previousComments = Object.fromEntries(
        previous.map((project) => [project.id, project.comments]),
      )
      return derivedProjects.map((project) => ({
        ...project,
        comments: previousComments[project.id] || project.comments,
      }))
    })

    if (projectsFromStore.length) {
      const fallbackId = activeProjectId || selectedProjectId || projectsFromStore[0].id
      setPendingProjectId((current) => current || fallbackId)
      setSelectedProjectId((current) => current || fallbackId)
    }
  }, [projectsFromStore, activeProjectId, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  )

  const selectedSetsCount = selectedProject?.sets?.length ?? 0
  const selectedStructuresCount = selectedProject?.structuresCount ?? 0
  const selectedAssembliesCount = selectedProject?.assembliesCount ?? 0

  const handleCommentSubmit = (event) => {
    event.preventDefault()
    if (!selectedProject || !commentForm.author.trim() || !commentForm.text.trim()) {
      return
    }

    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProjectId
          ? {
              ...project,
              comments: [
                {
                  id: `${project.id}-${Date.now()}`,
                  ...commentForm,
                  time: 'Just now',
                },
                ...project.comments,
              ],
            }
          : project,
      ),
    )

    setCommentForm({ author: '', role: 'Contributor', text: '' })
  }

  const handleProjectConfirm = () => {
    setSelectedProjectId(pendingProjectId)
    setShowProjectModal(false)
  }

  const closeModal = () => {
    setShowProjectModal(false)
    setPendingProjectId(selectedProjectId ?? projects[0]?.id ?? null)
  }

  const reopenModal = () => {
    setPendingProjectId(selectedProjectId ?? projects[0]?.id ?? null)
    setShowProjectModal(true)
  }

  return (
    <CContainer fluid className="py-4 timeline-surface">
      <CModal
        size="lg"
        alignment="center"
        visible={showProjectModal}
        backdrop="static"
        aria-labelledby="project-picker-title"
      >
        <CModalHeader className="border-0 px-4 pt-4">
          <CModalTitle id="project-picker-title" className="fw-bold">
            Select a project to load its timeline
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="px-4 pb-2">
          <p className="text-body-secondary mb-3">
            Choose the initiative you want to brief. We will pre-fill the milestones, health, and
            discussion feed for that team.
          </p>
          <CFormSelect
            label="Project"
            value={pendingProjectId}
            onChange={(event) => setPendingProjectId(event.target.value)}
            className="bg-dark text-white border-0"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.code})
              </option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter className="border-0 px-4 pb-4 d-flex justify-content-end">
          <CButton
            color="secondary"
            variant="outline"
            onClick={closeModal}
            disabled={!selectedProjectId}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            className="px-4"
            onClick={handleProjectConfirm}
            disabled={!pendingProjectId}
          >
            Load timeline
          </CButton>
        </CModalFooter>
      </CModal>

      <div className="timeline-hero rounded-4 shadow-lg p-4 p-md-5 mb-4 text-white">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4">
          <div className="d-flex align-items-center gap-3">
            <span className="timeline-hero__icon d-inline-flex align-items-center justify-content-center rounded-circle">
              <CIcon icon={cilList} size="lg" />
            </span>
            <div>
              <p className="text-uppercase small mb-1 opacity-75">Product timelines</p>
              <h3 className="fw-bold mb-2">Centralized delivery & discussion board</h3>
              <p className="mb-0 text-white-50">
                {selectedProject
                  ? `${selectedSetsCount} sets • ${selectedStructuresCount} structures • ${selectedAssembliesCount} assemblies in view.`
                  : 'Pick your project to review milestones, surface risks early, and keep conversations aligned in one place.'}
              </p>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <CBadge color="light" textColor="dark" className="px-3 py-2 rounded-pill">
              <CIcon icon={cilSpeedometer} className="me-2" /> Delivery health
            </CBadge>
            <CBadge color="warning" textColor="dark" className="px-3 py-2 rounded-pill">
              <CIcon icon={cilCommentBubble} className="me-2" /> Discussions
            </CBadge>
            <CBadge color="info" className="px-3 py-2 rounded-pill">
              <CIcon icon={cilPeople} className="me-2" /> Stakeholders
            </CBadge>
            <CButton color="light" variant="outline" onClick={reopenModal} className="text-white">
              <CIcon icon={cilSwapHorizontal} className="me-2" /> Change project
            </CButton>
          </div>
        </div>
      </div>

      <CRow className="g-4">
        <CCol lg={4}>
          <CCard className="timeline-card h-100">
            <CCardHeader className="timeline-card__header">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-uppercase small text-white-50 mb-1">Selected project</p>
                  <h6 className="fw-bold mb-0">Delivery capsule</h6>
                </div>
                <CBadge color="primary" shape="rounded-pill" className="px-3">
                  {projects.length} Active
                </CBadge>
              </div>
            </CCardHeader>
            <CCardBody className="timeline-card__body">
              {selectedProject ? (
                <div className="p-3 p-lg-2">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <CAvatar color="primary" textColor="white" size="lg">
                      {selectedProject.name.charAt(0)}
                    </CAvatar>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <h6 className="fw-semibold mb-0 text-white">{selectedProject.name}</h6>
                        <CBadge color={healthTone[selectedProject.health]} className="px-3">
                          {selectedProject.health}
                        </CBadge>
                      </div>
                      <p className="mb-2 text-white-50 small">{selectedProject.summary}</p>
                    </div>
                  </div>
                  <div className="bg-body-secondary rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-white-50">Stage</span>
                      <span className="fw-semibold text-white">{selectedProject.stage}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small text-white-50">Progress</span>
                      <span className="fw-semibold text-white">{selectedProject.progress}%</span>
                    </div>
                    <CProgress
                      thin
                      color="primary"
                      value={selectedProject.progress}
                      className="timeline-progress"
                    />
                    <div className="d-flex justify-content-between small text-white-50 mt-3">
                      <span>{selectedSetsCount} sets</span>
                      <span>{selectedStructuresCount} structures</span>
                      <span>{selectedAssembliesCount} assemblies</span>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedProject.focusAreas.map((area) => (
                      <CBadge key={area} color="light" className="text-primary border">
                        {area}
                      </CBadge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-white-50 py-5">
                  <p className="mb-2 fw-semibold">Pick a project to load details</p>
                  <CButton color="primary" onClick={reopenModal}>
                    Open project picker
                  </CButton>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={8}>
          <CCard className="timeline-card h-100">
            <CCardHeader className="timeline-card__header d-flex align-items-center justify-content-between">
              <div>
                <p className="text-uppercase small text-white-50 mb-1">Timeline</p>
                <h6 className="fw-bold mb-0">Milestones & decisions</h6>
              </div>
              <CBadge color="info" className="px-3">
                <CIcon icon={cilClock} className="me-2" /> {selectedSetsCount} sets /{' '}
                {selectedAssembliesCount} assemblies
              </CBadge>
            </CCardHeader>
            <CCardBody className="timeline-card__body">
              {selectedProject ? (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {(selectedProject.sets || []).map((set) => (
                      <CBadge key={set.id} color="light" className="border text-white">
                        {set.name} • {set.structures?.length || 0} structures
                      </CBadge>
                    ))}
                  </div>
                  <div className="timeline-flow">
                    {selectedProject.milestones.map((milestone, idx) => (
                      <div key={milestone.id} className="timeline-item pb-4">
                        <div className="timeline-dot" />
                        <div
                          className="timeline-line"
                          hidden={idx === selectedProject.milestones.length - 1}
                        />
                        <div className="timeline-content">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <strong className="text-white">{milestone.title}</strong>
                              <CTooltip content={`Owner: ${milestone.owner}`} placement="bottom">
                                <CBadge color={statusAccent[milestone.status]} className="px-3">
                                  {milestone.status}
                                </CBadge>
                              </CTooltip>
                            </div>
                            <span className="small text-white-50">{milestone.date}</span>
                          </div>
                          <p className="mb-1 text-white-50 small">{milestone.detail}</p>
                          <p className="small text-white-50 mb-0">Owner: {milestone.owner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-white-50 py-4">
                  Select a project to view its timeline.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard className="timeline-card h-100">
            <CCardHeader className="timeline-card__header">
              <div className="d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0">Post an update</h6>
                <CBadge color="light" textColor="dark">
                  Visible to project team
                </CBadge>
              </div>
            </CCardHeader>
            <CCardBody className="timeline-card__body">
              <CForm className="d-grid gap-3" onSubmit={handleCommentSubmit}>
                <CFormInput
                  label="Name"
                  placeholder="e.g. QA Lead / System Owner"
                  value={commentForm.author}
                  disabled={!selectedProject}
                  onChange={(event) =>
                    setCommentForm((current) => ({ ...current, author: event.target.value }))
                  }
                />
                <CFormSelect
                  label="Role"
                  value={commentForm.role}
                  disabled={!selectedProject}
                  onChange={(event) =>
                    setCommentForm((current) => ({ ...current, role: event.target.value }))
                  }
                  options={[
                    { label: 'Contributor', value: 'Contributor' },
                    { label: 'PMO', value: 'PMO' },
                    { label: 'Engineering', value: 'Engineering' },
                    { label: 'Quality', value: 'Quality' },
                    { label: 'Operations', value: 'Operations' },
                  ]}
                />
                <CFormTextarea
                  label="Comment"
                  rows={3}
                  value={commentForm.text}
                  disabled={!selectedProject}
                  placeholder="Capture decisions, risks, or blockers for the team"
                  onChange={(event) =>
                    setCommentForm((current) => ({ ...current, text: event.target.value }))
                  }
                />
                <CButton
                  type="submit"
                  color="primary"
                  disabled={!selectedProject}
                  className="d-flex align-items-center justify-content-center"
                >
                  <CIcon icon={cilCommentBubble} className="me-2" />
                  Add update to board
                </CButton>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={8}>
          <CCard className="timeline-card h-100">
            <CCardHeader className="timeline-card__header d-flex align-items-center justify-content-between">
              <div>
                <p className="text-uppercase small text-white-50 mb-1">Discussion feed</p>
                <h6 className="fw-bold mb-0">Decisions & notes</h6>
              </div>
              <CBadge color="secondary" textColor="dark" className="px-3">
                {selectedProject?.comments.length ?? 0} updates
              </CBadge>
            </CCardHeader>
            <CCardBody className="timeline-card__body">
              <div className="d-grid gap-3">
                {selectedProject ? (
                  selectedProject.comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-3 bg-body">
                      <div className="d-flex align-items-start gap-3">
                        <CAvatar color="primary" textColor="white">
                          {comment.author.charAt(0)}
                        </CAvatar>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-semibold">{comment.author}</span>
                              <CBadge
                                color="light"
                                textColor="dark"
                                className="text-uppercase small"
                              >
                                {comment.role}
                              </CBadge>
                            </div>
                            <span className="text-body-secondary small">{comment.time}</span>
                          </div>
                          <p className="mb-0 text-body-secondary">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white-50 py-4">
                    Select a project to load its discussion feed.
                  </div>
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default ProjectTimelineBoard
