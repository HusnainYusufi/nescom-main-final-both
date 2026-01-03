// src/views/pages/production/ProductionHome.js
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { CCard, CCardBody, CCardHeader, CCol, CContainer, CRow } from '@coreui/react'

const ProductionHome = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    dispatch({ type: 'set', activeModule: 'production' })
  }, [dispatch])

  const buttons = [
    {
      label: 'Projects Hierarchy',
      description: 'This form allows Add, Delete, and Update Project Details that includes Project’s Configurations, Batches, Batteries and Project Documents.',
      to: '/production/treeview',
    },
    {
      label: 'Project Timeline & Discussions',
      description:
        'Track milestones, view delivery health, and keep threaded notes for every project in one collaborative view.',
      to: '/production/timeline',
    },
    {
      label: 'Create Project Wizard',
      description:
        'Launch a guided multi-step flow to add a project, pick its type/category, add sets, and reuse existing configurations.',
      to: '/production/create-project-wizard',
    },
    {
      label: 'Directorates And Sites',
      description: 'Here you can Add, Delete, Update and View Directorates, Sub-Directorates and Sites.',
    },
    {
      label: 'Part Types, Categories and Material Forms',
      description: 'Here you can Add, Delete, Update and View all possible Materials, Part Categories and Part Types.',
    },
    {
      label: 'Activities And Phases',
      description: 'Here you can Add, Delete, Update and View all possible Activities and Phases.',
    },
    {
      label: 'QC Test Names',
      description: 'Here you can Add, Delete, Update and View QC Test Types.',
    },
    {
      label: 'NCR Presentation New',
      description: '… (no detailed text provided)',
    },
    {
      label: 'NCR Reason',
      description: '… (no detailed text provided)',
    },
  ]

  const accentColors = ['primary', 'info', 'success', 'warning', 'danger', 'secondary']

  const renderButton = (action, idx) => {
    const accent = accentColors[idx % accentColors.length]
    const isNavigable = Boolean(action.to)

    const handleActivation = () => {
      if (isNavigable) {
        navigate(action.to)
      }
    }

    return (
      <CCol key={action.label} md={6} lg={4}>
        <CCard
          className={`border-start border-4 border-${accent} h-100 shadow-sm`}
          role={isNavigable ? 'button' : undefined}
          tabIndex={isNavigable ? 0 : undefined}
          onClick={handleActivation}
          onKeyDown={(event) => {
            if (isNavigable && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault()
              handleActivation()
            }
          }}
          style={{ cursor: isNavigable ? 'pointer' : 'default' }}
        >
          <CCardBody>
            <div className="d-flex align-items-start">
              <span className={`badge bg-${accent} me-3`}>{idx + 1}</span>
              <div>
                <h6 className="fw-semibold mb-2 text-capitalize">{action.label}</h6>
                <p className="text-body-secondary small mb-0">{action.description}</p>
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    )
  }

  return (
    <CContainer fluid className="py-4">
      <CCard className="shadow-sm border-0">
        <CCardHeader className="bg-primary text-white fw-semibold py-3">Production</CCardHeader>
        <CCardBody className="p-4">
          <CRow className="g-3">{buttons.map((action, idx) => renderButton(action, idx))}</CRow>
        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default ProductionHome
