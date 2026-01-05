import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CRow,
  CSpinner,
} from '@coreui/react'
import projectService from '../../../services/projectService'

const ProjectDetails = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await projectService.getAll()
        setProjects(data || [])
      } catch (err) {
        setError(err?.message || 'Unable to load projects.')
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const filtered = useMemo(() => {
    if (!search) return projects
    return projects.filter((project) =>
      Object.values({
        name: project.name,
        code: project.code,
        owner: project.owner,
        status: project.status,
      })
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
  }, [projects, search])

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-body-secondary">
        <div>
          <h4 className="mb-1 fw-semibold">Project Details</h4>
          <div className="text-body-secondary small">Select a project to view its sets.</div>
        </div>
        <CFormInput
          type="text"
          size="sm"
          placeholder="Search projects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 240 }}
        />
      </CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="warning" className="mb-4">
            {error}
          </CAlert>
        )}
        {loading ? (
          <div className="text-center py-5">
            <CSpinner color="primary" />
          </div>
        ) : (
          <CRow className="g-4">
            {filtered.length === 0 ? (
              <CCol xs={12}>
                <div className="text-center text-body-secondary py-5">
                  No projects found. Try adjusting your search.
                </div>
              </CCol>
            ) : (
              filtered.map((project) => (
                <CCol key={project._id || project.id} xs={12} md={6} xl={4}>
                  <CCard
                    className="h-100 border-0 shadow-sm"
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/production/project-sets/${project._id || project.id}`)}
                  >
                    <CCardBody>
                      <div className="fw-semibold fs-5">{project.name || 'Untitled project'}</div>
                      <div className="text-body-secondary small mb-3">
                        {project.code || '—'} • {project.category?.name || project.category || 'General'}
                      </div>
                      <div className="d-flex flex-wrap gap-3">
                        <div>
                          <div className="text-body-secondary small">Sets</div>
                          <div className="fw-semibold">{project.sets?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-body-secondary small">Status</div>
                          <div className="fw-semibold">{project.status || 'Draft'}</div>
                        </div>
                        <div>
                          <div className="text-body-secondary small">Lead</div>
                          <div className="fw-semibold">{project.owner || 'Program Office'}</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              ))
            )}
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ProjectDetails
