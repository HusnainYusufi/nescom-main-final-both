import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  CContainer, CRow, CCol, CCard, CCardHeader, CCardBody, CButton, CFormInput, CFormSelect,
  CInputGroup, CInputGroupText, CListGroup, CListGroupItem, CBadge, CAlert, CSpinner, CToaster,
  CToast, CToastBody, CPagination, CPaginationItem, CTable, CTableHead, CTableBody, CTableRow,
  CTableHeaderCell, CTableDataCell, CNav, CNavItem, CNavLink, CTabContent, CTabPane,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilMenu, cilPlus, cilMinus, cilSave, cilTrash, cilReload, cilMagnifyingGlass } from '@coreui/icons'

import skuBundlesService from '../../../services/skuBundlesService'
import skusService from '../../../services/skusService'

const stepperBtn = { width: 28, height: 28, borderRadius: 8, border: '1px solid #2a2f35', background: '#1a1e23', color: '#e6ebef' }

const SkuBundles = () => {
  // ===== Tabs
  const [activeTab, setActiveTab] = useState('editor') // 'editor' | 'bundles'

  // ===== Toasts
  const [toasts, setToasts] = useState([])
  const pushToast = (msg, color = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, color, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }

  // ========================================================================
  // RIGHT PANE (Editor tab): SKU Catalog (drag from right ➜ left)
  // ========================================================================
  const [skuQ, setSkuQ] = useState('')
  const [skuPage, setSkuPage] = useState(1)
  const [skuLimit, setSkuLimit] = useState(20)
  const [skuTotal, setSkuTotal] = useState(0)
  const [skuRows, setSkuRows] = useState([])
  const [skuLoading, setSkuLoading] = useState(true)
  const [skuError, setSkuError] = useState('')

  const fetchSkus = useCallback(async () => {
    setSkuLoading(true); setSkuError('')
    try {
      const data = await skusService.list({
        q: skuQ.trim() || undefined,
        page: skuPage,
        limit: skuLimit,
        isActive: true,
      })
      setSkuRows(Array.isArray(data?.results) ? data.results : [])
      setSkuTotal(Number(data?.total || 0))
    } catch (e) {
      setSkuError(e?.response?.data?.message || 'Failed to load SKUs')
    } finally {
      setSkuLoading(false)
    }
  }, [skuQ, skuPage, skuLimit])

  useEffect(() => { fetchSkus() }, [fetchSkus])
  const skuTotalPages = Math.max(1, Math.ceil(skuTotal / skuLimit))

  // ========================================================================
  // LEFT PANE (Editor tab): Bundle Editor (search/select parent)
  // ========================================================================
  const [editorError, setEditorError] = useState('')
  const [working, setWorking] = useState(false)

  const [bundle, setBundle] = useState({
    _id: '',
    parentSku: '',
    name: '',
    components: [], // { sku, quantity }
    isActive: true,
  })

  // ---------- Parent Bundle Search (button-triggered)
  const [parentQInput, setParentQInput] = useState('')
  const [parentRows, setParentRows] = useState([])
  const [parentLoading, setParentLoading] = useState(false)

  const runParentSearch = useCallback(async () => {
    const q = parentQInput.trim()
    if (!q) { setParentRows([]); return }
    setParentLoading(true)
    try {
      const data = await skuBundlesService.search({
        q,
        limit: 8,
        mode: 'prefix',
        includeComponents: true,
      })
      setParentRows(Array.isArray(data?.results) ? data.results : [])
    } catch {
      setParentRows([])
    } finally {
      setParentLoading(false)
    }
  }, [parentQInput])

  const parentInputRef = useRef(null)
  const handleParentKey = (e) => { if (e.key === 'Enter') runParentSearch() }

  const loadBundleToEditor = (row) => {
    setBundle({
      _id: row?._id || row?.id || '',
      parentSku: row?.parentSku || '',
      name: row?.name || '',
      components: Array.isArray(row?.components) ? row.components.map((c) => ({ sku: c.sku, quantity: c.quantity })) : [],
      isActive: row?.isActive !== false,
    })
    setEditorError('')
    pushToast(`Loaded ${row?.parentSku}`, 'secondary')
    setActiveTab('editor')
  }

  // Helpers
  const mergeComponents = (list) => {
    const map = new Map()
    for (const { sku, quantity } of list) {
      const key = String(sku || '').trim().toUpperCase()
      if (!key) continue
      const qty = Math.max(1, parseInt(quantity || 1, 10))
      map.set(key, (map.get(key) || 0) + qty)
    }
    return Array.from(map.entries()).map(([sku, quantity]) => ({ sku, quantity }))
  }

  const dragState = useRef({ from: -1 })
  const onDragStartLeft = (idx) => (e) => { dragState.current = { from: idx }; e.dataTransfer.effectAllowed = 'move' }
  const onDragOver = (e) => e.preventDefault()
  const onDropLeftReorder = (toIdx) => (e) => {
    e.preventDefault()
    const { from } = dragState.current
    if (from === -1 || toIdx === -1 || from === toIdx) return
    setBundle((b) => {
      const arr = [...b.components]
      if (!arr[from] || !arr[toIdx]) return b
      const [moved] = arr.splice(from, 1)
      arr.splice(toIdx, 0, moved)
      return { ...b, components: arr }
    })
    dragState.current = { from: -1 }
  }

  const onDropFromCatalog = (e) => {
    e.preventDefault()
    try {
      const sku = (e.dataTransfer.getData('text/plain') || '').trim().toUpperCase()
      if (!sku) return
      setBundle((b) => ({ ...b, components: mergeComponents([...(b.components || []), { sku, quantity: 1 }]) }))
    } catch {}
  }
  const onDragStartCatalog = (sku) => (e) => { e.dataTransfer.setData('text/plain', sku); e.dataTransfer.effectAllowed = 'copy' }
  const addFromCatalog = (sku) => setBundle((b) => ({ ...b, components: mergeComponents([...(b.components || []), { sku, quantity: 1 }]) }))

  const setCompQty = (idx, qty) => {
    setBundle((b) => {
      const arr = [...b.components]
      if (!arr[idx]) return b
      arr[idx] = { ...arr[idx], quantity: Math.max(1, parseInt(qty || 1, 10)) }
      return { ...b, components: arr }
    })
  }
  const incComp = (idx, d = 1) => {
    setBundle((prev) => {
      const arr = [...prev.components]
      if (!arr[idx]) return prev
      const nextQty = Math.max(1, (parseInt(arr[idx].quantity, 10) || 1) + d)
      arr[idx] = { ...arr[idx], quantity: nextQty }
      return { ...prev, components: arr }
    })
  }
  const removeComp = (idx) => setBundle((b) => ({ ...b, components: b.components.filter((_, i) => i !== idx) }))

  const resetEditor = () => { setBundle({ _id: '', parentSku: '', name: '', components: [], isActive: true }); setEditorError('') }

  const validate = (b) => {
    const p = String(b.parentSku || '').trim().toUpperCase()
    if (!p) return 'Parent SKU is required'
    if (!Array.isArray(b.components) || b.components.length === 0) return 'Add at least one component'
    if (b.components.some((c) => !String(c.sku || '').trim())) return 'Component SKU is required'
    if (b.components.some((c) => !(parseInt(c.quantity, 10) >= 1))) return 'Quantities must be ≥ 1'
    if (b.components.some((c) => String(c.sku).trim().toUpperCase() === p)) return 'Parent SKU cannot reference itself'
    return ''
  }

  const createOrUpdate = async () => {
    const v = validate(bundle)
    if (v) { setEditorError(v); return }
    setEditorError(''); setWorking(true)
    try {
      const payload = {
        parentSku: String(bundle.parentSku).trim().toUpperCase(),
        name: bundle.name?.trim() || undefined,
        components: mergeComponents(bundle.components),
        isActive: !!bundle.isActive,
      }
      if (bundle._id) {
        await skuBundlesService.update(bundle._id, {
          name: payload.name,
          components: payload.components,
          isActive: payload.isActive,
        })
        pushToast('Bundle updated')
      } else {
        const res = await skuBundlesService.create(payload)
        const created = res?.result || {}
        setBundle((b) => ({ ...b, _id: created._id || b._id }))
        pushToast('Bundle created')
      }
    } catch (e) {
      setEditorError(e?.response?.data?.message || 'Save failed')
    } finally {
      setWorking(false)
    }
  }

  const deactivate = async () => {
    if (!bundle._id) { setEditorError('Load an existing bundle first'); return }
    setWorking(true); setEditorError('')
    try {
      await skuBundlesService.remove(bundle._id)
      setBundle((b) => ({ ...b, isActive: false }))
      pushToast('Bundle de-activated', 'secondary')
    } catch (e) {
      setEditorError(e?.response?.data?.message || 'Failed to deactivate')
    } finally {
      setWorking(false)
    }
  }

  // ========================================================================
  // BUNDLES TAB (search-on-click)
  // ========================================================================
  const [gridLoading, setGridLoading] = useState(true)
  const [gridError, setGridError] = useState('')
  const [gridRows, setGridRows] = useState([])
  const [gridTotal, setGridTotal] = useState(0)
  const [gridPage, setGridPage] = useState(1)
  const [gridLimit, setGridLimit] = useState(20)
  const [gridQInput, setGridQInput] = useState('')   // what the user is typing
  const [gridQ, setGridQ] = useState('')             // last-applied term (Search button)
  const [gridIncludeInactive, setGridIncludeInactive] = useState(true)
  const [gridSort, setGridSort] = useState('-updatedAt')

  const fetchGridBundles = useCallback(async () => {
    setGridLoading(true); setGridError('')
    try {
      const data = await skuBundlesService.list({
        q: gridQ.trim() || undefined,
        includeInactive: gridIncludeInactive,
        page: gridPage,
        limit: gridLimit,
        sort: gridSort,
      })

      // Keep a small relevance boost for better UX when a term is present
      const term = gridQ.trim().toUpperCase()
      const results = Array.isArray(data?.results) ? data.results : []
      const ranked = !term ? results : results
        .map((r, idx) => {
          const ps = String(r.parentSku || '').toUpperCase()
          const nmU = String(r.name || '').toUpperCase()
          let score = 0
          if (ps === term) score += 10000
          else if (ps.startsWith(term)) score += 7000
          if (nmU === term) score += 2500
          else if (nmU.startsWith(term)) score += 1500
          else if (nmU.includes(term)) score += 800
          const comps = Array.isArray(r.components) ? r.components : []
          let compPrefix = 0, compContains = 0
          for (const c of comps) {
            const cs = String(c?.sku || '').toUpperCase()
            if (cs.startsWith(term)) compPrefix++
            else if (cs.includes(term)) compContains++
          }
          score += compPrefix * 300 + compContains * 120
          return { r, idx, score }
        })
        .sort((a, b) => (b.score - a.score) || (a.idx - b.idx))
        .map(x => x.r)

      setGridRows(ranked)
      setGridTotal(Number(data?.total || 0))
    } catch (e) {
      setGridError(e?.response?.data?.message || 'Failed to load bundles')
    } finally {
      setGridLoading(false)
    }
  }, [gridQ, gridIncludeInactive, gridPage, gridLimit, gridSort])

  // Fetch when tab opens and whenever filters/paging change (but search term only changes via Search button or auto-clear)
  useEffect(() => { if (activeTab === 'bundles') fetchGridBundles() }, [activeTab, gridQ, gridIncludeInactive, gridPage, gridLimit, gridSort, fetchGridBundles])

  const applyGridSearch = () => { setGridPage(1); setGridQ(gridQInput) }
  const handleGridKey = (e) => { if (e.key === 'Enter') applyGridSearch() }

  // ⭐️ Auto-reset to "all bundles" when the search box is cleared
  const handleGridInputChange = (e) => {
    const v = e.target.value
    setGridQInput(v)
    if (v.trim() === '' && gridQ !== '') {
      setGridQ('')     // apply empty query -> fetch all bundles
      setGridPage(1)
    }
  }

  const gridTotalPages = Math.max(1, Math.ceil(gridTotal / gridLimit))

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <CContainer fluid className="mt-4 px-0">
      {/* Toaster */}
      <CToaster placement="top-end" className="p-3">
        {toasts.map((t) => (
          <CToast key={t.id} autohide visible color={t.color}>
            <CToastBody>{t.msg}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* Tabs */}
      <CNav variant="tabs" role="tablist" className="mb-3">
        <CNavItem>
          <CNavLink active={activeTab === 'editor'} onClick={() => setActiveTab('editor')}>
            Editor
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink active={activeTab === 'bundles'} onClick={() => setActiveTab('bundles')}>
            Bundles
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent>
        {/* ======================= EDITOR TAB ======================= */}
        <CTabPane visible={activeTab === 'editor'}>
          <CRow className="g-3">
            {/* LEFT */}
            <CCol xl={7} lg={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>Parent Bundle</strong>
                  <div className="d-flex gap-2">
                    <CButton size="sm" color="secondary" variant="outline" onClick={resetEditor}>
                      New / Reset
                    </CButton>
                    <CButton size="sm" color="primary" disabled={working} onClick={createOrUpdate}>
                      {working ? <CSpinner size="sm" /> : <CIcon icon={cilSave} className="me-1" />}
                      {bundle._id ? 'Save Changes' : 'Create Bundle'}
                    </CButton>
                    <CButton size="sm" color="danger" variant="outline" disabled={!bundle._id || working} onClick={deactivate}>
                      <CIcon icon={cilTrash} className="me-1" /> Deactivate
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {/* Search existing parent bundles (button-triggered) */}
                  <CRow className="g-2 align-items-end mb-2">
                    <CCol md={8}>
                      <label className="form-label">Search existing bundles (parent SKU or name)</label>
                      <CInputGroup size="sm">
                        <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
                        <CFormInput
                          placeholder="Type a term…"
                          value={parentQInput}
                          onChange={(e) => setParentQInput(e.target.value)}
                          onKeyDown={handleParentKey}
                          ref={parentInputRef}
                        />
                        <CButton size="sm" color="primary" onClick={runParentSearch} disabled={parentLoading}>
                          {parentLoading ? <CSpinner size="sm" /> : 'Search'}
                        </CButton>
                      </CInputGroup>
                    </CCol>
                    <CCol md={4} className="small text-muted">
                      Click a result to load it below, or type a new <strong>Parent SKU</strong> to create fresh.
                    </CCol>
                  </CRow>

                  {parentRows.length > 0 && (
                    <CListGroup className="mb-3">
                      {parentRows.map((r) => (
                        <CListGroupItem key={r.id || r._id || r.parentSku} role="button" onClick={() => loadBundleToEditor(r)}>
                          <div className="d-flex justify-content-between align-items-start flex-wrap">
                            <div className="me-2">
                              <div className="fw-semibold">{r.parentSku}</div>
                              <div className="text-muted small">
                                {r.name || (r.label ? String(r.label).split(' — ')[1] : '—')}
                              </div>
                            </div>
                            <CBadge color="success">Found</CBadge>
                          </div>
                          {!!r.sampleComponents?.length && (
                            <div className="mt-2 small">
                              {r.sampleComponents.map((c, i) => (
                                <CBadge key={`${c.sku}-${i}`} color="secondary" className="me-1 mb-1">
                                  {c.sku} ×{c.quantity}
                                </CBadge>
                              ))}
                            </div>
                          )}
                        </CListGroupItem>
                      ))}
                    </CListGroup>
                  )}

                  {/* Parent details */}
                  <CRow className="g-3 mb-2">
                    <CCol md={5}>
                      <CFormInput
                        label="Parent SKU *"
                        placeholder="e.g., RB-180X200"
                        value={bundle.parentSku}
                        onChange={(e) => setBundle((b) => ({ ...b, parentSku: e.target.value.toUpperCase() }))}
                      />
                    </CCol>
                    <CCol md={5}>
                      <CFormInput
                        label="Bundle Name"
                        placeholder="Optional display name"
                        value={bundle.name}
                        onChange={(e) => setBundle((b) => ({ ...b, name: e.target.value }))}
                      />
                    </CCol>
                    <CCol md={2}>
                      <label className="form-label">Active</label>
                      <CFormSelect
                        value={bundle.isActive ? 'true' : 'false'}
                        onChange={(e) => setBundle((b) => ({ ...b, isActive: e.target.value === 'true' }))}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {/* Drop zone + components */}
                  <div className="drop-zone mb-2" onDragOver={onDragOver} onDrop={onDropFromCatalog} title="Drag SKUs from the right pane to add them here">
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="mb-2">Components</h6>
                      <div className="small text-muted">Drag from right ➜ here • Drag handle to reorder</div>
                    </div>

                    {bundle.components.length === 0 ? (
                      <CAlert color="light" className="mb-0">
                        Nothing here yet — drag items from the SKU Catalog (right), or click “+” next to a SKU.
                      </CAlert>
                    ) : (
                      <div className="component-list">
                        {bundle.components.map((c, idx) => (
                          <div
                            key={`${c.sku}-${idx}`}
                            className="component-row"
                            draggable
                            onDragStart={onDragStartLeft(idx)}
                            onDragOver={onDragOver}
                            onDrop={onDropLeftReorder(idx)}
                          >
                            <span className="drag-handle"><CIcon icon={cilMenu} /></span>

                            <span className="sku fw-semibold" onClick={() => navigator.clipboard?.writeText?.(c.sku)} title="Click to copy SKU">
                              {c.sku}
                            </span>

                            <div className="qty-stepper">
                              <button type="button" style={stepperBtn} onClick={() => incComp(idx, -1)}>
                                <CIcon icon={cilMinus} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={c.quantity}
                                onChange={(e) => setCompQty(idx, parseInt(e.target.value || '1', 10))}
                              />
                              <button type="button" style={stepperBtn} onClick={() => incComp(idx, +1)}>
                                <CIcon icon={cilPlus} />
                              </button>
                            </div>

                            <CButton size="sm" color="danger" variant="outline" onClick={() => removeComp(idx)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {editorError && <CAlert color="danger" className="mb-0">{editorError}</CAlert>}
                </CCardBody>
              </CCard>
            </CCol>

            {/* RIGHT: SKU Catalog */}
            <CCol xl={5} lg={6}>
              <CCard>
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>SKU Catalog</strong>
                  <CButton size="sm" color="secondary" variant="ghost" onClick={fetchSkus} title="Reload">
                    <CIcon icon={cilReload} />
                  </CButton>
                </CCardHeader>
                <CCardBody>
                  <CRow className="mb-3 g-2">
                    <CCol md={8}>
                      <label className="form-label">Search active SKUs</label>
                      <CInputGroup size="sm">
                        <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
                        <CFormInput
                          placeholder="Search by SKU or product name"
                          value={skuQ}
                          onChange={(e) => { setSkuQ(e.target.value); setSkuPage(1) }}
                        />
                      </CInputGroup>
                    </CCol>
                    <CCol md={4}>
                      <label className="form-label">Per Page</label>
                      <CFormSelect size="sm" value={skuLimit} onChange={(e) => { setSkuLimit(Number(e.target.value)); setSkuPage(1) }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {skuError && <CAlert color="danger" className="mb-3">{skuError}</CAlert>}

                  <div className="catalog-list">
                    {skuLoading ? (
                      <div className="text-center py-5"><CSpinner /></div>
                    ) : skuRows.length ? (
                      <CListGroup>
                        {skuRows.map((s) => (
                          <CListGroupItem
                            key={s._id}
                            className="d-flex justify-content-between align-items-center"
                            draggable
                            onDragStart={onDragStartCatalog(s.sku)}
                            title="Drag me to the left pane, or click +"
                          >
                            <div>
                              <span className="fw-semibold">{s.sku}</span>
                              <span className="text-muted small ms-2">{s.productName}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <CBadge color={s.isActive ? 'success' : 'secondary'}>
                                {s.isActive ? 'Active' : 'Inactive'}
                              </CBadge>
                              <CButton size="sm" color="success" variant="outline" onClick={() => addFromCatalog(s.sku)}>
                                <CIcon icon={cilPlus} />
                              </CButton>
                            </div>
                          </CListGroupItem>
                        ))}
                      </CListGroup>
                    ) : (
                      <CAlert color="light" className="mb-0">No SKUs found.</CAlert>
                    )}
                  </div>

                  {skuTotalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <CPagination size="sm">
                        <CPaginationItem disabled={skuPage === 1} onClick={() => setSkuPage(1)}>&laquo;</CPaginationItem>
                        <CPaginationItem disabled={skuPage === 1} onClick={() => setSkuPage((p) => p - 1)}>&lsaquo;</CPaginationItem>
                        <CPaginationItem active>{skuPage}</CPaginationItem>
                        <CPaginationItem disabled={skuPage === skuTotalPages} onClick={() => setSkuPage((p) => p + 1)}>&rsaquo;</CPaginationItem>
                        <CPaginationItem disabled={skuPage === skuTotalPages} onClick={() => setSkuPage(skuTotalPages)}>&raquo;</CPaginationItem>
                      </CPagination>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CTabPane>

        {/* ======================= BUNDLES TAB ======================= */}
        <CTabPane visible={activeTab === 'bundles'}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>All Bundles</strong>
              <CButton size="sm" color="secondary" variant="ghost" onClick={fetchGridBundles} title="Reload">
                <CIcon icon={cilReload} />
              </CButton>
            </CCardHeader>
            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2 align-items-end">
                <CCol md={5}>
                  <label className="form-label">Search</label>
                  <CInputGroup size="sm">
                    <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
                    <CFormInput
                      placeholder="Search by parent SKU or name"
                      value={gridQInput}
                      onChange={handleGridInputChange}  
                      onKeyDown={handleGridKey}
                    />
                    <CButton size="sm" color="primary" onClick={applyGridSearch}>
                      Search
                    </CButton>
                  </CInputGroup>
                </CCol>

                <CCol md={3}>
                  <label className="form-label">Include Inactive</label>
                  <CFormSelect
                    size="sm"
                    value={gridIncludeInactive ? 'true' : 'false'}
                    onChange={(e) => { setGridIncludeInactive(e.target.value === 'true'); setGridPage(1) }}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <label className="form-label">Sort</label>
                  <CFormSelect size="sm" value={gridSort} onChange={(e) => { setGridSort(e.target.value); setGridPage(1) }}>
                    <option value="-updatedAt">Last Updated (desc)</option>
                    <option value="updatedAt">Last Updated (asc)</option>
                    <option value="parentSku">Parent SKU (A→Z)</option>
                    <option value="-parentSku">Parent SKU (Z→A)</option>
                    <option value="name">Name (A→Z)</option>
                    <option value="-name">Name (Z→A)</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <label className="form-label">Per Page</label>
                  <CFormSelect size="sm" value={gridLimit} onChange={(e) => { setGridLimit(Number(e.target.value)); setGridPage(1) }}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {gridError && <CAlert color="danger" className="mb-3">{gridError}</CAlert>}

              <div className="table-responsive">
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Parent SKU</CTableHeaderCell>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>Components</CTableHeaderCell>
                      <CTableHeaderCell>Active</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {gridLoading ? (
                      <CTableRow>
                        <CTableDataCell colSpan={5} className="text-center py-5">
                          <CSpinner />
                        </CTableDataCell>
                      </CTableRow>
                    ) : gridRows.length ? (
                      gridRows.map((r) => (
                        <CTableRow key={r._id}>
                          <CTableDataCell className="fw-semibold">{r.parentSku}</CTableDataCell>
                          <CTableDataCell>{r.name || '—'}</CTableDataCell>
                          <CTableDataCell>
                            {(r.components || []).length ? (
                              <div className="small">
                                {(r.components || []).map((c, i) => (
                                  <CBadge key={i} color="secondary" className="me-1 mb-1">{c.sku} ×{c.quantity}</CBadge>
                                ))}
                              </div>
                            ) : '—'}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={r.isActive ? 'success' : 'secondary'}>
                              {r.isActive ? 'Active' : 'Inactive'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="d-flex gap-2 flex-wrap">
                            <CButton size="sm" color="primary" variant="outline" onClick={() => loadBundleToEditor(r)}>
                              Edit in Editor
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan={5} className="text-center py-5 text-muted">
                          No bundles found
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {gridTotalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <CPagination size="sm">
                    <CPaginationItem disabled={gridPage === 1} onClick={() => setGridPage(1)}>&laquo;</CPaginationItem>
                    <CPaginationItem disabled={gridPage === 1} onClick={() => setGridPage((p) => p - 1)}>&lsaquo;</CPaginationItem>
                    <CPaginationItem active>{gridPage}</CPaginationItem>
                    <CPaginationItem disabled={gridPage === gridTotalPages} onClick={() => setGridPage((p) => p + 1)}>&rsaquo;</CPaginationItem>
                    <CPaginationItem disabled={gridPage === gridTotalPages} onClick={() => setGridPage(gridTotalPages)}>&raquo;</CPaginationItem>
                  </CPagination>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CTabPane>
      </CTabContent>

      <style>{`
        .catalog-list { min-height: 320px; }
        .drop-zone {
          background: #0e1318;
          border: 1px dashed #2a2f35;
          border-radius: 10px;
          padding: 10px;
          min-height: 180px;
        }
        .component-list { display:flex; flex-direction:column; gap:8px; }
        .component-row {
          display:grid; grid-template-columns: 28px 1fr auto auto; gap:12px;
          align-items:center; background:#151a1f; border:1px solid #2a2f35; border-radius:10px; padding:8px 10px;
        }
        .component-row .drag-handle { cursor:grab; display:flex; align-items:center; justify-content:center; color:#9aa7b2; }
        .qty-stepper { display:inline-flex; gap:.35rem; align-items:center; }
        .qty-stepper input {
          width:70px; height:28px; background:#0f1317; border:1px solid #2a2f35; border-radius:6px; color:#e6ebef; text-align:center;
        }
      `}</style>
    </CContainer>
  )
}

export default SkuBundles
