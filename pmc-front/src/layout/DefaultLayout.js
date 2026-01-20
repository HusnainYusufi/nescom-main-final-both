import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AppContent, AppSidebar } from '../components/index'

const DefaultLayout = () => {
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)

  // Set CSS variable on document root for sidebar width
  useEffect(() => {
    const root = document.documentElement
    if (sidebarShow) {
      const width = unfoldable ? '4rem' : '19rem'
      root.style.setProperty('--cui-sidebar-occupy-start', width)
    } else {
      root.style.setProperty('--cui-sidebar-occupy-start', '0')
    }
  }, [sidebarShow, unfoldable])

  return (
    <div>
      <AppSidebar />
      <div 
        className="wrapper d-flex flex-column min-vh-100"
        style={{
          paddingLeft: 'var(--cui-sidebar-occupy-start, 0)',
          transition: 'padding-left 0.15s ease-in-out',
        }}
      >
        <div className="body flex-grow-1 px-3">
          <AppContent />
        </div>
      </div>
    </div>
  )
}

export default DefaultLayout
