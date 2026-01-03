// src/_nav.js
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilFactory,
  cilSettings,
  cilBolt,
  cilChart,
  cilWarning,
  cilLayers,
  cilClock,
  cilWarehouse,
  cilUser,
  cilTruck,
} from '@coreui/icons'
import { CNavTitle, CNavItem, CNavGroup } from '@coreui/react'

const _nav = [
  // Dashboard
  {
    component: CNavTitle,
    name: 'Dashboard',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // 🔧 Production Module
  {
    component: CNavTitle,
    name: 'Production Module',
  },
  {
    component: CNavGroup,
    name: 'Production',
    to: '/production',
    icon: <CIcon icon={cilFactory} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Projects Hierarchy',
        to: '/production/treeview',
        icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Project Lifecycle',
        to: '/production/project-lifecycle',
        icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Timeline & Discussions',
        to: '/production/timeline',
        icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Project Creation Wizard',
        to: '/production/create-project-wizard',
        icon: <CIcon icon={cilBolt} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Configuration Categories',
        to: '/production/configuration-categories',
        icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Categories',
        to: '/production/configuration-categories',
        icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Qualification Tests',
        to: '/production/qualification-tests',
        icon: <CIcon icon={cilLayers} customClassName="nav-icon" />,
      },
    ],
  },

  // Operations
  {
    component: CNavTitle,
    name: 'Operations',
  },
  {
    component: CNavItem,
    name: 'Orders',
    to: '/orders',
    icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Warehouses',
    to: '/warehouses',
    icon: <CIcon icon={cilWarehouse} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Users',
    to: '/users',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
]

export default _nav
