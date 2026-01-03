import React from 'react'
import {
  CAvatar,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CDropdownHeader,
} from '@coreui/react'
import { cilLockLocked } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { useNavigate } from 'react-router-dom'
import authService from 'src/services/authService'

// Local asset so the header stays functional without internet access
const BOT_AVATAR_URL = '/assets/bot-avatar.svg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  const name = authService.getCurrentNameFromToken() || 'User'
  const role = (authService.getCurrentRoleFromToken() || '').toString()

  const handleLogout = () => {
    try {
      // ✅ Completely clear stored authentication and app data
      localStorage.removeItem('jwtToken')
      localStorage.removeItem('userRole')
      sessionStorage.clear()

      // Optional — clear any additional cached state if needed
      if (typeof authService?.logout === 'function') {
        authService.logout()
      }

      // ✅ Smooth redirect to login (no reload)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      // fallback: hard redirect
      window.location.href = '/login'
    }
  }

  return (
    <CDropdown variant="nav-item" className="ms-2">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0 border-0 bg-transparent"
        caret={false}
      >
        <div className="d-flex align-items-center gap-2">
          <CAvatar src={BOT_AVATAR_URL} size="md" />
          <div className="d-none d-sm-flex flex-column text-start">
            <span className="fw-semibold text-light" style={{ lineHeight: 1 }}>
              {name}
            </span>
            {role && (
              <span
                className="small text-secondary"
                style={{ lineHeight: 1, fontSize: '0.75rem' }}
              >
                {role}
              </span>
            )}
          </div>
        </div>
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold py-2">
          {name}
          {role ? ` — ${role}` : ''}
        </CDropdownHeader>

        <CDropdownItem href="#" onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
