import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CAlert,
  CSpinner,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import projectService from '../../../services/projectService'
import productionReviewService from '../../../services/productionReviewService'

const AllProjectStatus = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const projects = useSelector((state) => state.projects)
  const [projectList, setProjectList] = useState([])
  const [discussionPoints, setDiscussionPoints] = useState([])
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [projectData, meetingData, discussionData] = await Promise.all([
          projects?.length ? Promise.resolve(projects) : projectService.getAll(),
          productionReviewService.getMeetings({ meetingType: 'PRM' }).catch(() => []),
          productionReviewService.getDiscussionPoints().catch(() => []),
        ])
        setProjectList(projectData || [])
        setMeetings(meetingData || [])
        setDiscussionPoints(discussionData || [])
      } catch (err) {
        setError(err?.message || 'Unable to load project status data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projects])

  const meetingMap = useMemo(() => {
    const map = new Map()
    meetings.forEach((meeting) => {
      map.set(meeting._id || meeting.id, meeting)
    })
    return map
  }, [meetings])

  const latestDiscussionBySet = useMemo(() => {
    const map = new Map()
    discussionPoints.forEach((point) => {
      const projectId = point.project?._id || point.project
      const setId = point.set?._id || point.set
      const meetingId = point.meeting?._id || point.meeting
      if (!projectId || !setId) return
      const meeting = meetingMap.get(meetingId) || point.meeting
      const meetingDate = meeting?.meetingDate ? new Date(meeting.meetingDate).getTime() : 0
      const key = `${projectId}-${setId}`
      const existing = map.get(key)
      if (!existing || meetingDate >= existing.meetingDate) {
        map.set(key, {
          discussionPoint: point.discussionPoint,
          meetingNo: meeting?.meetingNo || point.meeting?.meetingNo || '—',
          meetingDate,
        })
      }
    })
    return map
  }, [discussionPoints, meetingMap])

  const projectsByCategory = useMemo(() => {
    const grouped = new Map()
    projectList.forEach((project) => {
      const categoryName = project.category?.name || 'Uncategorized'
      if (!grouped.has(categoryName)) grouped.set(categoryName, [])
      grouped.get(categoryName).push(project)
    })
    return grouped
  }, [projectList])

  const handleSetClick = (projectId, setId) => {
    const params = new URLSearchParams()
    params.set('project', projectId)
    params.set('set', setId)
    navigate(`/production/project-summary?${params.toString()}`)
  }

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="bg-dark text-white fw-semibold">All Project Status</CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="danger" className="mb-3">
            {error}
          </CAlert>
        )}
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <CTable bordered responsive className="align-middle">
            <CTableHead color="dark">
              <CTableRow className="text-white text-center">
                <CTableHeaderCell>Project Category</CTableHeaderCell>
                <CTableHeaderCell>Project Details</CTableHeaderCell>
                <CTableHeaderCell>Set Details</CTableHeaderCell>
                <CTableHeaderCell>Discussion Points</CTableHeaderCell>
                <CTableHeaderCell>PRM No</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {projectList.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={5} className="text-center text-body-secondary py-4">
                    No projects found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                Array.from(projectsByCategory.entries()).map(([category, items]) =>
                  items.map((project) => {
                    const sets = project.sets || []
                    return (
                      <CTableRow key={`${category}-${project._id || project.id}`}>
                        <CTableDataCell className="fw-semibold">{category}</CTableDataCell>
                        <CTableDataCell>
                          <div className="fw-semibold">{project.name}</div>
                          <div className="small text-body-secondary">{project.code}</div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {sets.length === 0 ? (
                            <div className="text-body-secondary">No sets</div>
                          ) : (
                            sets.map((set) => (
                              <div key={set._id || set.id} className="mb-1">
                                <CButton
                                  color="link"
                                  className="p-0 fw-semibold"
                                  onClick={() => handleSetClick(project._id || project.id, set._id || set.id)}
                                >
                                  {set.name || 'Set'}
                                </CButton>
                              </div>
                            ))
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {sets.length === 0 ? (
                            <div className="text-body-secondary">—</div>
                          ) : (
                            sets.map((set) => {
                              const key = `${project._id || project.id}-${set._id || set.id}`
                              const discussion = latestDiscussionBySet.get(key)
                              return (
                                <div key={set._id || set.id} className="mb-1">
                                  {discussion?.discussionPoint || '—'}
                                </div>
                              )
                            })
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {sets.length === 0 ? (
                            <div className="text-body-secondary">—</div>
                          ) : (
                            sets.map((set) => {
                              const key = `${project._id || project.id}-${set._id || set.id}`
                              const discussion = latestDiscussionBySet.get(key)
                              return (
                                <div key={set._id || set.id} className="mb-1 fw-semibold">
                                  {discussion?.meetingNo || '—'}
                                </div>
                              )
                            })
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  }),
                )
              )}
            </CTableBody>
          </CTable>
        )}
      </CCardBody>
    </CCard>
  )
}

export default AllProjectStatus
