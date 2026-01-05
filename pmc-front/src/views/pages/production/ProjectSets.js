import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const ProjectSets = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await projectService.getAll()
        const match = (data || []).find((p) => (p._id || p.id) === projectId)
        setProject(match || null)
      } catch (err) {
        setError(err?.message || 'Unable to load project sets.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const sets = useMemo(() => project?.sets || [], [project])

  const filteredSets = useMemo(() => {
    if (!search) return sets
    return sets.filter((set) =>
      Object.values({
        name: set.name,
        description: set.description,
        material: set.materialSpecs,
      })
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
  }, [sets, search])

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-body-secondary">
        <div>
          <h4 className="mb-1 fw-semibold">Set Details</h4>
          <div className="text-body-secondary small">
            {project?.name ? `Project: ${project.name}` : 'Select a project to view sets.'}
          </div>
        </div>
        <CFormInput
          type="text"
          size="sm"
          placeholder="Search sets..."
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
            {filteredSets.length === 0 ? (
              <CCol xs={12}>
                <div className="text-center text-body-secondary py-5">
                  No sets found for this project.
                </div>
              </CCol>
            ) : (
              filteredSets.map((set) => (
                <CCol key={set._id || set.id} xs={12} md={6} xl={4}>
                  <CCard
                    className="h-100 border-0 shadow-sm"
                    role="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      navigate(
                        `/production/project-sets/${projectId}/status/${set._id || set.id}`,
                      )
                    }
                  >
                    <CCardBody>
                      <div className="fw-semibold fs-5">{set.name || 'Set'}</div>
                      <div className="text-body-secondary small mb-3">
                        {set.description || 'No description provided.'}
                      </div>
                      <div className="d-flex flex-wrap gap-3">
                        <div>
                          <div className="text-body-secondary small">Structures</div>
                          <div className="fw-semibold">{set.structures?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-body-secondary small">Assemblies</div>
                          <div className="fw-semibold">{set.assemblies?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-body-secondary small">Status</div>
                          <div className="fw-semibold">{set.status || 'Draft'}</div>
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

export default ProjectSets
