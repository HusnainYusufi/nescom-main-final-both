// src/components/AppSidebar.js
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CSidebar,
  CSidebarHeader,
  CSidebarNav,
  CCard,
  CCardBody,
  CBadge,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CNavTitle,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilFactory,
  cilSettings,
  cilClipboard,
  cilMoney,
  cilCaretRight,
  cilCaretBottom,
  cilFolderOpen,
  cilLayers,
  cilClock,
  cilBolt,
  cilWarning,
  cilChart,
  cilLockLocked,
  cilMenu,
} from '@coreui/icons'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const activeModule = useSelector((state) => state.activeModule)
  const projects = useSelector((state) => state.projects)
  const activeProjectId = useSelector((state) => state.activeProjectId)
  const navigate = useNavigate()
  const location = useLocation()
  const userName = authService.getCurrentNameFromToken() || 'Operator'
  const userRole = authService.getCurrentRoleFromToken() || 'Production Lead'

  // Expand currently active project by default
  const [openProjects, setOpenProjects] = useState(() =>
    activeProjectId ? [activeProjectId] : projects.length ? [projects[0].id] : [],
  )
  const [openClusters, setOpenClusters] = useState(() => new Set(['production']))

  // Track when we should switch to an overlaid mobile sidebar
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 992 : false,
  )

  useEffect(() => {
    if (activeProjectId && !openProjects.includes(activeProjectId)) {
      setOpenProjects((prev) => [...prev, activeProjectId])
    }
  }, [activeProjectId, openProjects])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 992)

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const primaryNav = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Production Overview',
        icon: cilSpeedometer,
        to: '/dashboard',
        module: 'dashboard',
      },
      {
        id: 'production',
        label: 'Production Operations',
        icon: cilFactory,
        module: 'production',
        children: [
          { label: 'Project Tree', to: '/production/treeview', icon: cilSettings },
          { label: 'Timeline & Discussions', to: '/production/timeline', icon: cilClock },
          { label: 'View Assemblies', to: '/production/view-assembly', icon: cilLayers },
          { label: 'View Issues', to: '/production/view-issues', icon: cilWarning },
          { label: 'View Status', to: '/production/view-status', icon: cilClipboard },
        ],
      },
      {
        id: 'config-control',
        label: 'Configuration Control',
        icon: cilLayers,
        module: 'production',
        children: [
          { label: 'Parts Registry', to: '/production/configuration-parts', icon: cilLayers },
          {
            label: 'Build Configurations',
            to: '/production/build-configuration',
            icon: cilSettings,
          },
          { label: 'Qualification Tests', to: '/production/qualification-tests', icon: cilChart },
          { label: 'View Sets', to: '/production/view-sets', icon: cilClipboard },
        ],
      },
      {
        id: 'financial',
        label: 'Financial Operations',
        icon: cilMoney,
        module: 'financial',
        children: [
          { label: 'Tree View', to: '/financial/treeview', icon: cilChart },
          { label: 'Reports', to: '/financial/reports', icon: cilClipboard },
          { label: 'Expenses', to: '/financial/expenses', icon: cilMoney },
        ],
      },
      {
        id: 'operations',
        label: 'Operations',
        icon: cilLayers,
        module: 'operations',
        children: [
          { label: 'Warehouses', to: '/warehouses', icon: cilLayers },
          { label: 'Orders', to: '/orders', icon: cilClipboard },
          { label: 'Users', to: '/users', icon: cilSettings },
        ],
      },
    ],
    [],
  )

  const projectSections = useMemo(
    () => [
      { key: 'general', label: 'General', icon: cilFolderOpen },
      { key: 'configuration', label: 'Configuration', icon: cilSettings },
      { key: 'production', label: 'Production', icon: cilFactory },
      { key: 'materials', label: 'Materials', icon: cilLayers },
      { key: 'reports', label: 'Reports', icon: cilClipboard },
      { key: 'administration', label: 'Administration', icon: cilMoney },
    ],
    [],
  )

  const handleSectionClick = (projectId, sectionKey) => {
    dispatch({ type: 'setActiveProject', projectId })
    dispatch({ type: 'set', activeModule: 'production' })
    navigate(`/production/treeview?project=${projectId}&section=${sectionKey}`)
  }

  const handleNavClick = (item) => {
    if (item.module) {
      dispatch({ type: 'set', activeModule: item.module })
    }
    if (item.to) {
      navigate(item.to)
      if (isMobile) {
        dispatch({ type: 'set', sidebarShow: false })
      }
    }
  }

  const toggleCluster = (id) => {
    setOpenClusters((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isRouteActive = useCallback(
    (path) => location.pathname.startsWith(path),
    [location.pathname],
  )

  const handleLogout = () => {
    try {
      localStorage.removeItem('jwtToken')
      localStorage.removeItem('userRole')
      sessionStorage.clear()
      if (typeof authService?.logout === 'function') {
        authService.logout()
      }
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    primaryNav.forEach((item) => {
      if (!item.children) return
      const activeChild = item.children.some((child) => isRouteActive(child.to))
      if (activeChild) {
        setOpenClusters((prev) => {
          if (prev.has(item.id)) return prev
          const next = new Set(prev)
          next.add(item.id)
          return next
        })
      }
    })
  }, [location.pathname, primaryNav, isRouteActive])

  const renderMissionNavigation = () => (
    <div className="mb-4">
      <CNavTitle className="text-light text-uppercase small">Operations Navigation</CNavTitle>
      <div className="d-grid gap-2">
        {primaryNav.map((item) => {
          const active = item.children
            ? item.children.some((child) => isRouteActive(child.to))
            : isRouteActive(item.to)
          const clusterOpen = openClusters.has(item.id)
          return (
            <div key={item.id}>
              <button
                type="button"
                className={`app-sidebar__cluster-btn ${active ? 'is-active' : ''}`}
                aria-expanded={clusterOpen}
                aria-controls={`cluster-${item.id}`}
                onClick={() => (item.children ? toggleCluster(item.id) : handleNavClick(item))}
              >
                <span className="app-sidebar__cluster-label">
                  <CIcon icon={item.icon} className="me-2 text-warning" />
                  {item.label}
                </span>
                {item.children && (
                  <CIcon
                    icon={clusterOpen ? cilCaretBottom : cilCaretRight}
                    className="app-sidebar__cluster-chevron"
                  />
                )}
              </button>

              {item.children && clusterOpen && (
                <div
                  className="app-sidebar__cluster-children"
                  id={`cluster-${item.id}`}
                  role="group"
                  aria-label={`${item.label} links`}
                >
                  {item.children.map((child) => (
                    <button
                      key={child.to}
                      type="button"
                      className={`app-sidebar__child-btn ${
                        isRouteActive(child.to) ? 'is-active' : ''
                      }`}
                      onClick={() => handleNavClick({ ...child, module: item.module })}
                    >
                      <CIcon icon={child.icon} className="me-2 text-body-secondary" />
                      <span>{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderProjectTree = () => (
    <CCard className="border-0 bg-transparent text-white app-sidebar__card">
      <CCardBody className="pb-0 app-sidebar__card-body">
        <div className="d-flex align-items-center justify-content-between mb-3 gap-2 app-sidebar__actions">
          <CNavTitle className="text-light mb-0">Project Hierarchy</CNavTitle>
          <CButton
            color="warning"
            size="sm"
            className="text-dark fw-semibold"
            onClick={() => navigate('/production/treeview')}
          >
            + Add Project
          </CButton>
        </div>

        {projects.length === 0 ? (
          <div className="small text-light opacity-75">No projects yet. Start by adding one.</div>
        ) : (
          <CAccordion
            alwaysOpen
            activeItemKey={openProjects}
            flush
            onChange={(key) =>
              setOpenProjects(Array.isArray(key) ? key : key ? [key] : openProjects)
            }
          >
            {projects.map((project) => (
              <CAccordionItem
                itemKey={project.id}
                key={project.id}
                className={`bg-dark text-light rounded-3 mb-2 ${
                  activeProjectId === project.id ? 'border border-warning' : 'border-0'
                }`}
              >
                <CAccordionHeader
                  className="text-light"
                  onClick={() => dispatch({ type: 'setActiveProject', projectId: project.id })}
                >
                  <div className="d-flex flex-column">
                    <span className="fw-semibold">{project.name}</span>
                    <small className="text-body-secondary">{project.code}</small>
                  </div>
                  <CBadge color="warning" className="ms-2 text-dark fw-semibold">
                    {project.status}
                  </CBadge>
                </CAccordionHeader>
                <CAccordionBody className="pt-0">
                  <div className="small text-body-secondary mb-3 app-sidebar__project-meta">
                    {project.description}
                  </div>
                  <div className="d-grid gap-2">
                    {projectSections.map((section) => (
                      <CButton
                        key={section.key}
                        color="secondary"
                        variant="outline"
                        className="d-flex align-items-center justify-content-between text-start app-sidebar__project-button"
                        onClick={() => handleSectionClick(project.id, section.key)}
                      >
                        <span>
                          <CIcon icon={section.icon} className="me-2 text-warning" />
                          {section.label}
                        </span>
                        <CIcon
                          icon={
                            openProjects.includes(project.id) ? cilChevronBottom : cilChevronRight
                          }
                        />
                      </CButton>
                    ))}
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-3 small text-body-secondary">
                    <span className="fw-semibold text-light">Owner:</span>
                    <span>{project.owner}</span>
                  </div>
                </CAccordionBody>
              </CAccordionItem>
            ))}
          </CAccordion>
        )}
      </CCardBody>
    </CCard>
  )

  const renderFinancialSelector = () => (
    <CCard className="border-0 bg-transparent text-white app-sidebar__card">
      <CCardBody className="app-sidebar__card-body">
        <CNavTitle className="text-light">Financial</CNavTitle>
        <div className="text-body-secondary small">
          Financial navigation will live here. Use the top menu to jump to reports or expenses.
        </div>
      </CCardBody>
    </CCard>
  )

  const renderDashboardMenu = () => (
    <CCard className="border-0 bg-transparent text-white app-sidebar__card">
      <CCardBody className="app-sidebar__card-body">
        <CNavTitle className="text-light">Dashboard</CNavTitle>
        <div className="text-body-secondary small">
          Welcome back. Choose a module to get started.
        </div>
      </CCardBody>
    </CCard>
  )

  return (
    <CSidebar
      position="fixed"
      breakpoint="lg"
      overlaid={isMobile}
      narrow={!isMobile && unfoldable}
      visible={sidebarShow}
      unfoldable={unfoldable}
      onVisibleChange={(visible) => dispatch({ type: 'set', sidebarShow: visible })}
      className="bg-dark text-white border-end app-sidebar"
    >
      <CSidebarHeader className="app-sidebar__brand px-4 py-4 d-flex align-items-start gap-3">
        <div>
          <div className="text-uppercase small text-warning">PMC Production Manager</div>
          <div className="fw-bold text-light">Strategic Programs Command</div>
          <div className="text-body-secondary small">Classified Access</div>
        </div>
        <button
          type="button"
          className="btn btn-outline-light btn-sm ms-auto d-lg-none"
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
        >
          <CIcon icon={cilMenu} />
        </button>
      </CSidebarHeader>

      <CSidebarNav className="app-sidebar__nav">{renderMissionNavigation()}</CSidebarNav>

      <div className="app-sidebar__user px-4 py-4">
        <div className="fw-semibold text-light">{userName}</div>
        <div className="small text-body-secondary mb-3">{userRole || 'Operator'}</div>
        <CButton color="danger" variant="outline" className="w-100" onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Secure Logout
        </CButton>
      </div>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
