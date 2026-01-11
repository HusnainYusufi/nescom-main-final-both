import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import projectService from '../../../services/projectService'
import productionReviewService from '../../../services/productionReviewService'

const formatDate = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : ''

const ProductionReview = () => {
  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projects)
  const [projectOptions, setProjectOptions] = useState([])
  const [meetings, setMeetings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showAddMeeting, setShowAddMeeting] = useState(false)
  const [showUpdateMeeting, setShowUpdateMeeting] = useState(false)
  const [showDiscussion, setShowDiscussion] = useState(false)

  const [meetingForm, setMeetingForm] = useState({ meetingType: 'PRM', meetingDate: '' })
  const [updateForm, setUpdateForm] = useState({ meetingId: '', meetingDate: '' })
  const [discussionForm, setDiscussionForm] = useState({
    projectId: '',
    setId: '',
    meetingId: '',
    discussionPoint: '',
  })

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [projectData, meetingData] = await Promise.all([
          projects?.length ? Promise.resolve(projects) : projectService.getAll(),
          productionReviewService.getMeetings(),
        ])
        setProjectOptions(projectData || [])
        setMeetings(meetingData || [])
      } catch (err) {
        setError(err?.message || 'Unable to load production review data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projects])

  const selectedProject = useMemo(
    () => projectOptions.find((project) => (project._id || project.id) === discussionForm.projectId),
    [projectOptions, discussionForm.projectId],
  )

  const setOptions = useMemo(() => selectedProject?.sets || [], [selectedProject])

  const prmMeetings = useMemo(
    () => meetings.filter((meeting) => meeting.meetingType === 'PRM'),
    [meetings],
  )

  const handleAddMeeting = async (event) => {
    event.preventDefault()
    if (!meetingForm.meetingDate) {
      setError('Meeting date is required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const created = await productionReviewService.addMeeting({
        meetingType: meetingForm.meetingType,
        meetingDate: meetingForm.meetingDate,
      })
      setMeetings((prev) => [created, ...prev])
      setMeetingForm({ meetingType: 'PRM', meetingDate: '' })
      setShowAddMeeting(false)
    } catch (err) {
      setError(err?.message || 'Unable to add meeting.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMeeting = async (event) => {
    event.preventDefault()
    if (!updateForm.meetingId) {
      setError('Select a meeting to update.')
      return
    }
    if (!updateForm.meetingDate) {
      setError('Meeting date is required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const updated = await productionReviewService.updateMeeting(updateForm.meetingId, {
        meetingDate: updateForm.meetingDate,
      })
      setMeetings((prev) => prev.map((m) => (m._id === updated._id ? updated : m)))
      setUpdateForm({ meetingId: '', meetingDate: '' })
      setShowUpdateMeeting(false)
    } catch (err) {
      setError(err?.message || 'Unable to update meeting.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDiscussion = async (event) => {
    event.preventDefault()
    if (!discussionForm.projectId || !discussionForm.setId) {
      setError('Project and set are required.')
      return
    }
    if (!discussionForm.meetingId) {
      setError('PRM meeting is required.')
      return
    }
    if (!discussionForm.discussionPoint.trim()) {
      setError('Discussion point is required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await productionReviewService.addDiscussionPoint({
        project: discussionForm.projectId,
        set: discussionForm.setId,
        meeting: discussionForm.meetingId,
        discussionPoint: discussionForm.discussionPoint,
      })
      setDiscussionForm({ projectId: '', setId: '', meetingId: '', discussionPoint: '' })
      setShowDiscussion(false)
    } catch (err) {
      setError(err?.message || 'Unable to add discussion point.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow className="g-4">
      <CCol lg={4}>
        <CCard className="shadow-sm border-0">
          <CCardHeader className="bg-body-secondary fw-semibold">Production Review</CCardHeader>
          <CCardBody>
            {error && (
              <CAlert color="danger" className="mb-3">
                {error}
              </CAlert>
            )}
            <div className="d-grid gap-2">
              <CButton color="primary" onClick={() => setShowAddMeeting(true)}>
                Add Meeting
              </CButton>
              <CButton color="dark" onClick={() => setShowUpdateMeeting(true)}>
                Update Meeting
              </CButton>
              <CButton color="secondary" onClick={() => setShowDiscussion(true)}>
                Add Discussion Point
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol lg={8}>
        <CCard className="shadow-sm border-0">
          <CCardHeader className="bg-dark text-white fw-semibold">
            Review Workflow
          </CCardHeader>
          <CCardBody>
            <div className="text-body-secondary">
              Use the actions on the left to add PRM/PRE-PRM meetings, update meeting dates, and
              capture discussion points tied to the latest PRM.
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CModal alignment="center" visible={showAddMeeting} onClose={() => setShowAddMeeting(false)}>
        <CForm onSubmit={handleAddMeeting}>
          <CModalHeader closeButton>
            <CModalTitle>Add Meeting</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3">
              <CFormSelect
                label="Meeting Type"
                value={meetingForm.meetingType}
                onChange={(e) => setMeetingForm({ ...meetingForm, meetingType: e.target.value })}
              >
                <option value="PRM">PRM</option>
                <option value="PRE-PRM">PRE-PRM</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormInput
                type="date"
                label="Meeting Date"
                value={meetingForm.meetingDate}
                onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowAddMeeting(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Save'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal alignment="center" visible={showUpdateMeeting} onClose={() => setShowUpdateMeeting(false)}>
        <CForm onSubmit={handleUpdateMeeting}>
          <CModalHeader closeButton>
            <CModalTitle>Update Meeting</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3">
              <CFormSelect
                label="Meeting"
                value={updateForm.meetingId}
                onChange={(e) => {
                  const meetingId = e.target.value
                  const selected = meetings.find((meeting) => (meeting._id || meeting.id) === meetingId)
                  setUpdateForm({
                    meetingId,
                    meetingDate: selected?.meetingDate ? formatDate(selected.meetingDate) : '',
                  })
                }}
                required
              >
                <option value="">Select Meeting</option>
                {meetings.map((meeting) => (
                  <option key={meeting._id || meeting.id} value={meeting._id || meeting.id}>
                    {meeting.meetingNo} • {meeting.meetingType} • {formatDate(meeting.meetingDate)}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormInput
                type="date"
                label="Meeting Date"
                value={updateForm.meetingDate}
                onChange={(e) => setUpdateForm({ ...updateForm, meetingDate: e.target.value })}
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowUpdateMeeting(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Save'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal alignment="center" visible={showDiscussion} onClose={() => setShowDiscussion(false)}>
        <CForm onSubmit={handleAddDiscussion}>
          <CModalHeader closeButton>
            <CModalTitle>Add Discussion Point for upcoming PRM</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="mb-3">
              <CFormSelect
                label="Project"
                value={discussionForm.projectId}
                onChange={(e) =>
                  setDiscussionForm({
                    ...discussionForm,
                    projectId: e.target.value,
                    setId: '',
                  })
                }
                required
              >
                <option value="">Select project</option>
                {projectOptions.map((project) => (
                  <option key={project._id || project.id} value={project._id || project.id}>
                    {project.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormSelect
                label="Set"
                value={discussionForm.setId}
                onChange={(e) => setDiscussionForm({ ...discussionForm, setId: e.target.value })}
                disabled={!discussionForm.projectId}
                required
              >
                <option value="">Select set</option>
                {setOptions.map((set) => (
                  <option key={set._id || set.id} value={set._id || set.id}>
                    {set.name || 'Set'}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormSelect
                label="PRM"
                value={discussionForm.meetingId}
                onChange={(e) => setDiscussionForm({ ...discussionForm, meetingId: e.target.value })}
                required
              >
                <option value="">Select PRM</option>
                {prmMeetings.map((meeting) => (
                  <option key={meeting._id || meeting.id} value={meeting._id || meeting.id}>
                    {meeting.meetingNo} • {formatDate(meeting.meetingDate)}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormTextarea
                label="Discussion Point"
                rows={3}
                value={discussionForm.discussionPoint}
                onChange={(e) =>
                  setDiscussionForm({ ...discussionForm, discussionPoint: e.target.value })
                }
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowDiscussion(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : 'Save'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </CRow>
  )
}

export default ProductionReview
