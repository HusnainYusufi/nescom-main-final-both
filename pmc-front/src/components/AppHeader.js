import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CHeader,
  CHeaderToggler,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilMenu,
  cilBell,
  cilContrast,
  cilMoon,
  cilSun,
} from '@coreui/icons'
import { AppBreadcrumb, AppHeaderDropdown } from './index'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <>
      <CHeader
        position="sticky"
        className="mb-4 p-0 bg-dark text-white shadow-sm"
        ref={headerRef}
      >
        <CContainer className="px-4 py-2 d-flex align-items-center justify-content-between" fluid>
          <div className="d-flex align-items-center gap-3">
            <CHeaderToggler
              onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
              style={{ marginInlineStart: '-12px' }}
              className="text-white"
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            <div>
              <div className="text-uppercase small text-body-secondary">National Engineering & Scientific Comm.</div>
              <div className="fw-bold">Strategic Operations Console</div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <CDropdown variant="nav-item" placement="bottom-end">
              <button type="button" className="btn btn-link text-white p-0">
                {colorMode === 'dark' ? (
                  <CIcon icon={cilMoon} size="lg" />
                ) : colorMode === 'auto' ? (
                  <CIcon icon={cilContrast} size="lg" />
                ) : (
                  <CIcon icon={cilSun} size="lg" />
                )}
              </button>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setColorMode('light')}>
                  <CIcon icon={cilSun} className="me-2" /> Light
                </CDropdownItem>
                <CDropdownItem onClick={() => setColorMode('dark')}>
                  <CIcon icon={cilMoon} className="me-2" /> Dark
                </CDropdownItem>
                <CDropdownItem onClick={() => setColorMode('auto')}>
                  <CIcon icon={cilContrast} className="me-2" /> Auto
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <div className="vr text-body-secondary opacity-50" />

            <button type="button" className="btn btn-link text-white p-0">
              <CIcon icon={cilBell} size="lg" />
            </button>

            <div className="vr text-body-secondary opacity-50" />

            <AppHeaderDropdown />
          </div>
        </CContainer>

        {/* Breadcrumb */}
        <CContainer fluid className="px-4 py-2 bg-body-secondary bg-opacity-10 border-top">
          <AppBreadcrumb />
        </CContainer>
      </CHeader>
    </>
  )
}

export default AppHeader
