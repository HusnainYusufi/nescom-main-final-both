// src/routes.js
import React from 'react'
import { Navigate } from 'react-router-dom'

// Layout
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Stand-alone pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// Inside-layout views
const DashboardMain = React.lazy(() => import('./views/dashboard/DashboardMain'))
const Warehouses = React.lazy(() => import('./views/pages/warehouses/Warehouses'))
const Orders = React.lazy(() => import('./views/pages/orders/Orders'))
const Users = React.lazy(() => import('./views/pages/users/Users'))
const Skus = React.lazy(() => import('./views/pages/skus/Skus'))
const SkuBundles = React.lazy(() => import('./views/pages/skuBundles/SkuBundles'))

// Dashboard modules
const ProductionTreeView = React.lazy(() => import('./views/dashboard/ProductionTreeView'))
const FinancialTreeView = React.lazy(() => import('./views/dashboard/FinancialTreeView'))
const ProductionHome = React.lazy(() => import('./views/pages/production/ProductionHome'))
const ConfigurationParts = React.lazy(
  () => import('./views/pages/production/ConfigurationParts'),
)
const BuildConfiguration = React.lazy(
  () => import('./views/pages/production/BuildConfiguration'),
)
const QualificationTestsOnParts = React.lazy(
  () => import('./views/pages/production/QualificationTestsOnParts'),
)
const QualificationDocuments = React.lazy(
  () => import('./views/pages/production/QualificationDocuments'),
)
const ProjectCreationWizard = React.lazy(
  () => import('./views/pages/production/ProjectCreationWizard'),
)
const ProjectTimelineBoard = React.lazy(
  () => import('./views/pages/production/ProjectTimelineBoard'),
)
const ConfigurationCategories = React.lazy(
  () => import('./views/pages/production/ConfigurationCategories'),
)
const ProjectDetails = React.lazy(() => import('./views/pages/production/ProjectDetails'))
const ProjectSets = React.lazy(() => import('./views/pages/production/ProjectSets'))
const SetStatusOverview = React.lazy(() => import('./views/pages/production/SetStatusOverview'))

// Production module pages
const AddSet = React.lazy(() => import('./views/pages/production/AddSet'))
const CreateMeeting = React.lazy(() => import('./views/pages/production/CreateMeeting'))
const AddAssyParts = React.lazy(() => import('./views/pages/production/AddAssyParts'))
const AddStatus = React.lazy(() => import('./views/pages/production/AddStatus'))
const AddStatusPRM = React.lazy(() => import('./views/pages/production/AddStatusPRM'))
const ProjectSummaryView = React.lazy(() => import('./views/pages/production/ProjectSummaryView'))
const ProjectLifecycleWizard = React.lazy(
  () => import('./views/pages/production/ProjectLifecycleWizard'),
)
// const AddCriticalIssue = React.lazy(() => import('./views/pages/production/'))

// CoreUI example pages
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Charts = React.lazy(() => import('./views/charts/Charts'))
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))
const Widgets = React.lazy(() => import('./views/widgets/Widgets'))
const ViewProjects = React.lazy(() => import('./views/pages/production/ViewProjects'))
const ViewSets = React.lazy(() => import('./views/pages/production/ViewSets'))
const ViewMeetings = React.lazy(() => import('./views/pages/production/ViewMeetings'))
const ViewAssembly = React.lazy(() => import('./views/pages/production/ViewAssembly'))
const ViewStatus = React.lazy(() => import('./views/pages/production/ViewStatus'))
const ViewPRM = React.lazy(() => import('./views/pages/production/ViewPRM'))
const ViewIssues = React.lazy(() => import('./views/pages/production/ViewIssues'))

// ------------------------------------------------------

const routes = [
  // Redirect root → dashboard
  { path: '/', exact: true, name: 'Home', element: () => <Navigate to="/dashboard" replace /> },

  // Main dashboards
  { path: '/dashboard', name: 'Dashboard', element: DashboardMain },
  { path: '/production', name: 'Production', element: ProductionHome },
  { path: '/production/treeview', name: 'Production Tree View', element: ProductionTreeView },
  { path: '/financial/treeview', name: 'Financial Tree View', element: FinancialTreeView },
  {
    path: '/production/configuration-parts',
    name: 'Configuration Parts',
    element: ConfigurationParts,
  },
  {
    path: '/production/build-configuration',
    name: 'Build Configuration',
    element: BuildConfiguration,
  },
  {
    path: '/production/qualification-tests',
    name: 'Qualification Tests on Parts',
    element: QualificationTestsOnParts,
  },
  {
    path: '/production/qualification',
    name: 'Qualification Documents',
    element: QualificationDocuments,
  },
  {
    path: '/production/configuration-categories',
    name: 'Configuration Categories',
    element: ConfigurationCategories,
  },
  {
    path: '/production/create-project-wizard',
    name: 'Create Project Wizard',
    element: ProjectCreationWizard,
  },
  { path: '/production/project-details', name: 'Project Details', element: ProjectDetails },
  {
    path: '/production/project-sets/:projectId',
    name: 'Project Set Details',
    element: ProjectSets,
  },
  {
    path: '/production/project-sets/:projectId/status/:setId',
    name: 'Set Status Overview',
    element: SetStatusOverview,
  },

  // Other pages
  { path: '/warehouses', name: 'Warehouses', element: Warehouses },
  { path: '/orders', name: 'Orders', element: Orders },
  { path: '/users', name: 'Users', element: Users },
  { path: '/skus', name: 'SKUs', element: Skus },
  { path: '/sku-bundles', name: 'SKU Bundles', element: SkuBundles },

  // Production module
  { path: '/production/add-set', name: 'Add Set', element: AddSet },
  { path: '/production/create-meeting', name: 'Create Meeting', element: CreateMeeting },
  { path: '/production/add-assy-parts', name: 'Add Assembly Parts', element: AddAssyParts },
  { path: '/production/add-status', name: 'Add Status', element: AddStatus },
  { path: '/production/add-prm-status', name: 'Add PRM Status', element: AddStatusPRM },
  // { path: '/production/add-critical-issue', name: 'Add Critical Issue', element: AddCriticalIssue },
  { path: '/production/project-summary', name: 'Project Summary', element: ProjectSummaryView },
  {
    path: '/production/project-lifecycle',
    name: 'Project Lifecycle',
    element: ProjectLifecycleWizard,
  },
  { path: '/production/view-projects', name: 'View Projects', element: ViewProjects },
  { path: '/production/view-sets', name: 'View Sets', element: ViewSets },
  { path: '/production/view-meetings', name: 'View Meetings', element: ViewMeetings },
  { path: '/production/view-assembly', name: 'View Assembly', element: ViewAssembly },
  { path: '/production/view-status', name: 'View Status', element: ViewStatus },
  { path: '/production/view-prm', name: 'View PRM', element: ViewPRM },
  { path: '/production/view-issues', name: 'View Issues', element: ViewIssues },
  {
    path: '/production/timeline',
    name: 'Project Timeline & Discussions',
    element: ProjectTimelineBoard,
  },
  // UI examples
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },

  // Public pages
  { path: '/login', exact: true, name: 'Login Page', element: Login },
  { path: '/register', exact: true, name: 'Register Page', element: Register },
  { path: '/404', exact: true, name: 'Page 404', element: Page404 },
  { path: '/500', exact: true, name: 'Page 500', element: Page500 },

  // Catch-all
  { path: '*', name: 'Page 404', element: Page404 },
]

export default routes
