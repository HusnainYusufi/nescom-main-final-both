import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import projectService from '../../../services/projectService'
import statusService from '../../../services/statusService'

const getStatusColor = (status = '') => {
  const normalized = status.toLowerCase()
  if (normalized.includes('complete') || normalized.includes('done')) return 'success'
  if (normalized.includes('progress') || normalized.includes('active')) return 'info'
  if (normalized.includes('hold') || normalized.includes('halt')) return 'danger'
  return 'secondary'
}

const SetStatusOverview = () => {
  const { projectId, setId } = useParams()
  const [project, setProject] = useState(null)
  const [setRecord, setSetRecord] = useState(null)
  const [statusEntries, setStatusEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [projects, statuses] = await Promise.all([
          projectService.getAll(),
          statusService.getAll({ project: projectId, set: setId }).catch(() => []),
        ])
        const match = (projects || []).find((p) => (p._id || p.id) === projectId)
        setProject(match || null)
        const selectedSet = match?.sets?.find((s) => (s._id || s.id) === setId) || null
        setSetRecord(selectedSet)
        setStatusEntries(statuses || [])
      } catch (err) {
        setError(err?.message || 'Unable to load status overview.')
      } finally {
        setLoading(false)
      }
    }

    if (projectId && setId) {
      loadData()
    }
  }, [projectId, setId])

  const structures = useMemo(() => setRecord?.structures || [], [setRecord])
  const setAssemblies = useMemo(() => setRecord?.assemblies || [], [setRecord])
  const latestStatusByAssembly = useMemo(() => {
    const map = new Map()
    statusEntries.forEach((entry) => {
      const key = entry.assembly?._id || entry.assembly || ''
      if (!key) return
      const incomingDate = entry.updatedOn ? new Date(entry.updatedOn).getTime() : 0
      const existing = map.get(key)
      const existingDate = existing?.updatedOn ? new Date(existing.updatedOn).getTime() : 0
      if (!existing || incomingDate >= existingDate) {
        map.set(key, entry)
      }
    })
    return map
  }, [statusEntries])

  return (
    <CCard className="shadow-sm border-0">
      <CCardHeader className="bg-body-secondary">
        <h4 className="mb-1 fw-semibold">Status of Assemblies</h4>
        <div className="text-body-secondary small">
          {project?.name || 'Project'} • {setRecord?.name || 'Set'}
        </div>
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
          <>
            <CRow className="g-4">
              {structures.length === 0 && setAssemblies.length === 0 ? (
                <CCol xs={12}>
                  <div className="text-center text-body-secondary py-5">
                    No structures or assemblies recorded for this set yet.
                  </div>
                </CCol>
              ) : (
                structures.map((structure) => (
                  <CCol key={structure._id || structure.id || structure.name} xs={12} lg={6}>
                    <CCard className="h-100 border-0 bg-body-tertiary">
                      <CCardBody>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <div className="fw-semibold">{structure.name || 'Structure'}</div>
                            <div className="text-body-secondary small">
                              {(structure.assemblies || []).length} assemblies
                            </div>
                          </div>
                          <CBadge color={getStatusColor(structure.status)}>
                            {structure.status || 'Draft'}
                          </CBadge>
                        </div>
                        {(structure.assemblies || []).length === 0 ? (
                          <div className="text-body-secondary small">No assemblies linked.</div>
                        ) : (
                          <div className="d-grid gap-2">
                            {structure.assemblies.map((assembly) => {
                              const entry = latestStatusByAssembly.get(assembly._id || assembly.id)
                              return (
                                <div
                                  key={assembly._id || assembly.id || assembly.name}
                                  className="d-flex justify-content-between align-items-center"
                                >
                                  <div>
                                    <div className="fw-semibold">{assembly.name || 'Assembly'}</div>
                                    <div className="text-body-secondary small">
                                      {entry?.part?.name || entry?.partName
                                        ? `Part: ${entry?.part?.name || entry?.partName}`
                                        : assembly.type || 'Assembly'}
                                    </div>
                                  </div>
                                  <CBadge color={getStatusColor(entry?.status || assembly.status)}>
                                    {entry?.status || assembly.status || 'Draft'}
                                  </CBadge>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))
              )}
            </CRow>

            {setAssemblies.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-semibold">Set-level assemblies</h6>
                <CRow className="g-3">
                  {setAssemblies.map((assembly) => {
                    const entry = latestStatusByAssembly.get(assembly._id || assembly.id)
                    return (
                      <CCol key={assembly._id || assembly.id || assembly.name} xs={12} md={6} lg={4}>
                        <CCard className="h-100 border-0">
                          <CCardBody className="d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-semibold">{assembly.name || 'Assembly'}</div>
                              <div className="text-body-secondary small">
                                {entry?.part?.name || entry?.partName
                                  ? `Part: ${entry?.part?.name || entry?.partName}`
                                  : assembly.type || 'Assembly'}
                              </div>
                            </div>
                            <CBadge color={getStatusColor(entry?.status || assembly.status)}>
                              {entry?.status || assembly.status || 'Draft'}
                            </CBadge>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    )
                  })}
                </CRow>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default SetStatusOverview
