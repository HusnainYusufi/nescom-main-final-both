// src/views/pages/orders/Orders.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

import {
  CContainer,
  CRow,
  CCol,
  CButton,
  CAlert,
  CForm,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CBadge,
  CSpinner,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CCard,
  CCardBody,
  CCardHeader,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CTableBody,
  CToaster,
  CToast,
  CToastBody,
} from '@coreui/react'


import CIcon from '@coreui/icons-react'
import {
  cilMagnifyingGlass,
  cilCloudUpload,
  cilSortAscending,
  cilSortDescending,
  cilInfo,
  cilMinus,
  cilPlus,
  cilTrash,
  cilCheckCircle,
  cilPrint,
  cilList,
  cilMediaPlay,
  cilCheckAlt,
  cilChevronRight,
} from '@coreui/icons'

import orderService from '../../../services/orderService'
import labelsService from '../../../services/labels'
import presetsService from '../../../services/presetsService'
import userService from '../../../services/usersService'
import authService from '../../../services/authService'

// NEW
import packageService from '../../../services/packagesService'

// const SERVER_URL = 'https://apidelivery.devmedialm.com'
const SERVER_URL = 'https://api.shaheene.com'
const timelineColor = '#0d6efd'


const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'PREPARED', label: 'Prepared' },
  { key: 'AWAITING_PICKUP', label: 'Awaiting Pickup' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'DELIVERY_FAILED', label: 'Delivery Failed' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'CANCELLED', label: 'Cancelled' },
]
const ALL_KEY = 'ALL'

/* =========================
   ManualOrderModal (admin)
   ========================= */
const ManualOrderModal = ({
  visible,
  onClose,
  onSubmit,
  initialData = {
    orderNo: '',
    customerName: '',
    mobile: '',
    country: 'Saudi Arabia',
    city: '',
    orderDate: new Date().toISOString().split('T')[0],
    orderTotal: '',
    items: [{ productName: '', sku: '', quantity: 1 }],
    shippingCompany: '',
    paymentMethod: 'paid',
  },
}) => {
  const [formState, setFormState] = useState(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  const pickErr = (e, fb = 'Something went wrong') => {
    const data = e?.response?.data
    return (
      (typeof data?.error === 'string' && data.error) ||
      data?.error?.message ||
      data?.message ||
      e?.message ||
      fb
    )
  }

  const handleManualOrderChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index, e) => {
    const { name, value } = e.target
    const newItems = [...formState.items]
    newItems[index] = { ...newItems[index], [name]: value }
    setFormState((prev) => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, { productName: '', sku: '', quantity: 1 }],
    }))
  }

  const removeItem = (index) => {
    const newItems = formState.items.filter((_, i) => i !== index)
    setFormState((prev) => ({ ...prev, items: newItems }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setLocalError('')
    try {
      const orderData = {
        orderNo: formState.orderNo,
        customerName: formState.customerName,
        mobile: formState.mobile,
        country: formState.country,
        city: formState.city,
        orderDate: new Date(formState.orderDate).toISOString(),
        totalPrice: parseFloat(formState.orderTotal) || 0,
        items: formState.items.map((item) => ({
          productName: item.productName,
          sku: item.sku || '',
          quantity: parseInt(item.quantity) || 1,
        })),
        shippingCompany: formState.shippingCompany,
        paymentMethod: formState.paymentMethod,
      }
      await onSubmit(orderData)
      onClose()
    } catch (err) {
      setLocalError(pickErr(err, 'Failed to create order'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader closeButton><CModalTitle>Add Manual Order</CModalTitle></CModalHeader>
      <CModalBody>
        {localError ? <CAlert color="danger" className="mb-3">{localError}</CAlert> : null}
        <CForm>
          <CRow className="mb-3">
            <CCol md={6}><CFormInput label="Order Number *" name="orderNo" value={formState.orderNo} onChange={handleManualOrderChange} required /></CCol>
            <CCol md={6}><CFormInput label="Order Date *" type="date" name="orderDate" value={formState.orderDate} onChange={handleManualOrderChange} required /></CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}><CFormInput label="Customer Name *" name="customerName" value={formState.customerName} onChange={handleManualOrderChange} required /></CCol>
            <CCol md={6}><CFormInput label="Mobile *" name="mobile" value={formState.mobile} onChange={handleManualOrderChange} required /></CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}><CFormInput label="Country *" name="country" value={formState.country} onChange={handleManualOrderChange} required /></CCol>
            <CCol md={6}><CFormInput label="City *" name="city" value={formState.city} onChange={handleManualOrderChange} required /></CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol md={6}><CFormInput label="Total Price (SAR) *" type="number" step="0.01" name="orderTotal" value={formState.orderTotal} onChange={handleManualOrderChange} required /></CCol>
            <CCol md={6}>
              <CFormSelect label="Payment Method *" name="paymentMethod" value={formState.paymentMethod} onChange={handleManualOrderChange} required>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </CFormSelect>
            </CCol>
          </CRow>
          <CRow className="mb-3">
            <CCol><CFormInput label="Shipping Company" name="shippingCompany" value={formState.shippingCompany} onChange={handleManualOrderChange} /></CCol>
          </CRow>

          <h5 className="mt-4 mb-3">Items *</h5>
          {formState.items.map((item, index) => (
            <CRow key={index} className="mb-3 g-3 align-items-end">
              <CCol md={5}><CFormInput label="Product Name *" name="productName" value={item.productName} onChange={(e) => handleItemChange(index, e)} required /></CCol>
              <CCol md={3}><CFormInput label="SKU" name="sku" value={item.sku} onChange={(e) => handleItemChange(index, e)} /></CCol>
              <CCol md={2}><CFormInput label="Quantity *" type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} min="1" required /></CCol>
              <CCol md={2} className="d-flex align-items-end">
                {index > 0 && <CButton color="danger" onClick={() => removeItem(index)} className="ms-2">Remove</CButton>}
              </CCol>
            </CRow>
          ))}
          <CButton color="secondary" size="sm" onClick={addItem} className="mt-2">Add Item</CButton>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? <CSpinner size="sm" /> : 'Create Order'}</CButton>
      </CModalFooter>
    </CModal>
  )
}


/* ====== REPLACEMENT: PackageBuilderModal (full-screen, drag & drop, Royal parents + components + others) ====== */
function PackageBuilderModal({
  visible,
  onClose,
  items = [],
  roleByIndex = [],
  bundleGroups = [],
  initialPackages = [],
  currentUserId,            // ⟵ NEW: pass the logged-in user's id
  onApply,
}) {
  const [draftPkgs, setDraftPkgs] = React.useState(() =>
    JSON.parse(JSON.stringify(initialPackages || []))
  )
  const [search, setSearch] = React.useState("")
  const [error, setError] = React.useState("")

  // 🔒 lock helper
  const isLocked = React.useCallback(
    (p) => !!p?._id && String(p?.createdBy || '') !== String(currentUserId || ''),
    [currentUserId]
  )

  // --- roles
  const parentIdxSet = React.useMemo(() => {
    const s = new Set()
    roleByIndex?.forEach((r, i) => { if (r?.role === 'PARENT') s.add(i) })
    return s
  }, [roleByIndex])

  const childIdxSet = React.useMemo(() => {
    const s = new Set()
    roleByIndex?.forEach((r, i) => { if (r?.role === 'CHILD') s.add(i) })
    return s
  }, [roleByIndex])

  // --- allocated map (per lineIndex across all packages)
  const allocatedMap = React.useMemo(() => {
    const m = new Map()
    draftPkgs.forEach(p => (p.contents || []).forEach(c => {
      const k = Number(c.lineIndex)
      const q = Number(c.quantity) || 0
      m.set(k, (m.get(k) || 0) + q)
    }))
    return m
  }, [draftPkgs])

  const orderedQty = (i) => Number(items?.[i]?.quantity || 0)
  const remainingFor = (i) => Math.max(0, orderedQty(i) - (allocatedMap.get(i) || 0))

  // --- search filter
  const matchesSearch = (it) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (it?.sku || '').toLowerCase().includes(q) || (it?.productName || '').toLowerCase().includes(q)
  }

  // --- left lists
  const royalParents = React.useMemo(() => {
    const arr = []
    items.forEach((it, i) => {
      if (!parentIdxSet.has(i)) return
      if (!matchesSearch(it)) return
      arr.push(i)
    })
    return arr
  }, [items, parentIdxSet, search])

  const royalChildren = React.useMemo(() => {
    const arr = []
    items.forEach((it, i) => {
      if (!childIdxSet.has(i)) return
      if (!matchesSearch(it)) return
      arr.push(i)
    })
    return arr
  }, [items, childIdxSet, search])

  const others = React.useMemo(() => {
    const arr = []
    items.forEach((it, i) => {
      if (parentIdxSet.has(i) || childIdxSet.has(i)) return
      if (!matchesSearch(it)) return
      arr.push(i)
    })
    return arr
  }, [items, parentIdxSet, childIdxSet, search])

  // --- drag & drop
  const dragRef = React.useRef(null)
  const onDragStartLine = (e, lineIndex) => {
    dragRef.current = { kind: 'line', lineIndex }
    e.dataTransfer.setData('text/plain', String(lineIndex))
    e.dataTransfer.effectAllowed = 'copy'
  }
  const allowDrop = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }
  const onDropToPkg = (e, pkgIdx) => {
    e.preventDefault()
    // 🔒 block drops onto locked packages
    if (isLocked(draftPkgs[pkgIdx])) return
    const payload = dragRef.current
    if (payload?.kind === 'line') addOneToPkg(pkgIdx, Number(payload.lineIndex))
  }

  // --- package content helpers
  const addPkg = () =>
    setDraftPkgs(prev => [
      ...prev,
      {
        boxType: '',
        inner: { length: '', width: '', height: '', unit: 'cm' },
        weightKg: '',
        contents: [],
        status: 'CONFIRMED',
        createdBy: currentUserId,     // ⟵ stamp ownership on new pkg
      }
    ])

  const removePkg = (i) =>
    setDraftPkgs(prev => {
      const pkg = prev[i]
      if (isLocked(pkg)) return prev      // 🔒 ignore remove on locked
      return prev.filter((_, idx) => idx !== i)
    })

  const setPkgField = (i, key, val) =>
    setDraftPkgs(prev => {
      const pkg = prev[i]
      if (isLocked(pkg)) return prev      // 🔒 ignore edits on locked
      const arr = [...prev]
      arr[i] = { ...arr[i], [key]: val }
      return arr
    })

  const setInner = (i, key, val) =>
    setDraftPkgs(prev => {
      const pkg = prev[i]
      if (isLocked(pkg)) return prev      // 🔒 ignore edits on locked
      const arr = [...prev]
      arr[i] = { ...arr[i], inner: { ...(arr[i].inner || {}), [key]: val } }
      return arr
    })

  // add lineIndex → +remaining into this pkg
  const addOneToPkg = (pkgIdx, lineIndex) => {
    const pkg = draftPkgs[pkgIdx]
    if (isLocked(pkg)) return            // 🔒 block adds into locked
    const rem = remainingFor(lineIndex)  // remaining across all packages
    if (rem <= 0) return

    setDraftPkgs(prev => {
      const arr = [...prev]
      const pkg2 = { ...arr[pkgIdx] }
      const list = [...(pkg2.contents || [])]
      const i = list.findIndex(c => Number(c.lineIndex) === Number(lineIndex))

      if (i === -1) {
        list.push({ lineIndex, sku: items[lineIndex]?.sku || '', quantity: rem })
      } else {
        const current = Number(list[i].quantity || 0)
        list[i] = { ...list[i], quantity: current + rem }
      }

      pkg2.contents = list
      arr[pkgIdx] = pkg2
      return arr
    })
  }

  const setQtyInPkg = (pkgIdx, lineIndex, qtyRaw) => {
    const pkg = draftPkgs[pkgIdx]
    if (isLocked(pkg)) return            // 🔒 ignore edits on locked
    const qty = Math.max(0, Math.floor(Number(qtyRaw) || 0))
    setDraftPkgs(prev => {
      const arr = [...prev]
      const pkg2 = { ...arr[pkgIdx] }
      const list = [...(pkg2.contents || [])]
      const i = list.findIndex(c => Number(c.lineIndex) === Number(lineIndex))

      const current = i !== -1 ? Number(list[i].quantity) || 0 : 0
      const global = Number(allocatedMap.get(lineIndex) || 0)
      const ord = orderedQty(lineIndex)
      const available = Math.max(0, ord - (global - current))
      const finalQ = Math.min(qty, available)

      if (finalQ === 0) {
        if (i !== -1) list.splice(i, 1)
      } else if (i === -1) {
        list.push({ lineIndex, sku: items[lineIndex]?.sku || '', quantity: finalQ })
      } else {
        list[i] = { ...list[i], quantity: finalQ }
      }
      pkg2.contents = list
      arr[pkgIdx] = pkg2
      return arr
    })
  }

  const removeRow = (pkgIdx, lineIndex) =>
    setDraftPkgs(prev => {
      const pkg = prev[pkgIdx]
      if (isLocked(pkg)) return prev     // 🔒 ignore row removals on locked
      const arr = [...prev]
      const pkg2 = { ...arr[pkgIdx] }
      pkg2.contents = (pkg2.contents || []).filter(c => Number(c.lineIndex) !== Number(lineIndex))
      arr[pkgIdx] = pkg2
      return arr
    })

  // --- validate + apply
  const validate = () => {
    if (!draftPkgs.length) return 'Add at least one package.'
    for (let i = 0; i < draftPkgs.length; i++) {
      const p = draftPkgs[i]
      if (!p.contents?.length) return `Package #${i + 1}: add at least one SKU.`
    }
    return ''
  }

  const apply = () => {
    const v = validate()
    if (v) { setError(v); return }
    onApply?.(draftPkgs)
  }

  // --- small renderers
  const LineChip = ({ idx }) => {
    const it = items[idx] || {}
    const rem = remainingFor(idx)
    const ord = orderedQty(idx)
    return (
      <div
        className={`pb2-line ${rem === 0 ? 'depleted' : ''}`}
        draggable={rem > 0}
        onDragStart={(e) => onDragStartLine(e, idx)}
        title={rem > 0 ? 'Drag to a package' : 'Fully allocated'}
      >
        <div className="sku">{it.sku || `Line ${idx + 1}`}</div>
        <div className="name">{it.productName || '—'}</div>
        <div className="meta">
          <CBadge color={rem > 0 ? 'info' : 'secondary'} className="me-1">remaining {rem}</CBadge>
          <CBadge color="dark">ordered {ord}</CBadge>
        </div>
      </div>
    )
  }

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      fullscreen
      className="pkg-builder2"
      scrollable
    >
      <CModalHeader closeButton>
        <CModalTitle>Package Builder — drag SKUs into packages</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error ? <CAlert color="danger" className="mb-3">{error}</CAlert> : null}

        <div className="pb2-topbar">
          <div className="left">
            <CFormInput
              size="lg"
              placeholder="Search by SKU or product name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pb2-search"
            />
            <div className="hint">Tip: drag from the left → drop on a package to add +1. Edit quantities inline.</div>
          </div>
          <div className="right">
            <CButton
              size="lg"
              color="secondary"
              variant="outline"
              onClick={() => setDraftPkgs(JSON.parse(JSON.stringify(initialPackages || [])))}
            >
              Reset to current
            </CButton>
            <CButton size="lg" color="secondary" onClick={addPkg}>+ Add Package</CButton>
            <CButton size="lg" color="success" onClick={apply}>Save changes</CButton>
          </div>
        </div>

        <div className="pb2-grid">
          {/* LEFT: sources */}
          <div className="pb2-left">
            {/* Royal Parents */}
            <div className="pb2-block">
              <div className="pb2-block-head">
                <div className="title">Royal Box (Parents)</div>
                <CBadge color="warning" className="ms-2">parents</CBadge>
              </div>
              <div className="pb2-list">
                {royalParents.length ? royalParents.map(i => <LineChip key={`rp-${i}`} idx={i} />)
                  : <div className="empty">No matching royal parents</div>}
              </div>
            </div>

            {/* Royal Components (Children) */}
            <div className="pb2-block">
              <div className="pb2-block-head">
                <div className="title">Royal Box Components</div>
                <CBadge color="info" className="ms-2">components</CBadge>
              </div>
              <div className="pb2-list">
                {royalChildren.length ? royalChildren.map(i => <LineChip key={`rc-${i}`} idx={i} />)
                  : <div className="empty">No matching components</div>}
              </div>
              {!!bundleGroups?.length && (
                <div className="pb2-note small text-muted mt-2">
                  Bundles detected: {bundleGroups.length}. Items above include all child SKUs so you can allocate them individually.
                </div>
              )}
            </div>

            {/* Others */}
            <div className="pb2-block">
              <div className="pb2-block-head">
                <div className="title">Other Items</div>
              </div>
              <div className="pb2-list">
                {others.length ? others.map(i => <LineChip key={`oth-${i}`} idx={i} />)
                  : <div className="empty">No other items match your search</div>}
              </div>
            </div>
          </div>

          {/* RIGHT: packages canvas */}
          <div className="pb2-right">
            {!draftPkgs.length ? (
              <CAlert color="light">No packages yet — click <strong>+ Add Package</strong> to start.</CAlert>
            ) : (
              <div className="pb2-cols">
                {draftPkgs.map((p, i) => {
                  const locked = isLocked(p)
                  const creator =
                    p?.createdByName
                      ? p.createdByName
                      : String(p?.createdBy || '') === String(currentUserId || '')
                        ? 'You'
                        : (p?.createdBy ? `User ${String(p.createdBy).slice(-4)}` : '—')

                  return (
                    <div
                      key={`col-${i}`}
                      className={`pb2-col${locked ? ' locked' : ''}`}
                      onDragOver={allowDrop}
                      onDrop={(e) => onDropToPkg(e, i)}
                    >
                      <div className="pb2-col-head">
                        <div className="title">
                          Package #{i + 1}
                          {locked
                            ? <CBadge color="secondary" className="ms-2">Locked</CBadge>
                            : <CBadge color="success" className="ms-2">Editable</CBadge>}
                          <CBadge color="dark" className="ms-2">Created by: {creator}</CBadge>
                        </div>
                        <div className="tools">
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            onClick={() => removePkg(i)}
                            disabled={locked}
                          >
                            Remove
                          </CButton>
                        </div>
                      </div>

                      <div className="pb2-fields">
                        <div className="row1">
                          <CFormInput
                            label="Box Type"
                            value={p.boxType || ''}
                            onChange={(e) => setPkgField(i, 'boxType', e.target.value)}
                            disabled={locked}
                          />
                          <CFormInput
                            label="Weight (kg)"
                            type="number"
                            step="0.1"
                            value={p.weightKg || ''}
                            onChange={(e) => setPkgField(i, 'weightKg', e.target.value)}
                            disabled={locked}
                          />
                        </div>
                        <div className="row2">
                          <div className="lbl">Inner (L × W × H)</div>
                          <div className="dims">
                            <CFormInput placeholder="L" value={p.inner?.length || ''} onChange={(e) => setInner(i, 'length', e.target.value)} disabled={locked} />
                            <CFormInput placeholder="W" value={p.inner?.width || ''} onChange={(e) => setInner(i, 'width', e.target.value)} disabled={locked} />
                            <CFormInput placeholder="H" value={p.inner?.height || ''} onChange={(e) => setInner(i, 'height', e.target.value)} disabled={locked} />
                            <CFormSelect value={p.inner?.unit || 'cm'} onChange={(e) => setInner(i, 'unit', e.target.value)} style={{ maxWidth: 120 }} disabled={locked}>
                              <option value="cm">cm</option>
                              <option value="in">in</option>
                              <option value="mm">mm</option>
                            </CFormSelect>
                          </div>
                        </div>
                      </div>

                      {(p.contents || []).length === 0 ? (
                        <div className="pb2-drop">Drop items here</div>
                      ) : (
                        <div className="pb2-table-wrap">
                          <CTable small striped className="pb2-table">
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell>SKU</CTableHeaderCell>
                                <CTableHeaderCell>Product</CTableHeaderCell>
                                <CTableHeaderCell className="t-center">Ordered</CTableHeaderCell>
                                <CTableHeaderCell className="t-center">Allocated</CTableHeaderCell>
                                <CTableHeaderCell className="t-center">This Pkg</CTableHeaderCell>
                                <CTableHeaderCell className="t-center">Remaining</CTableHeaderCell>
                                <CTableHeaderCell className="t-center">Remove</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {p.contents.map((c, idxRow) => {
                                const li = Number(c.lineIndex)
                                const it = items[li] || {}
                                const ord = orderedQty(li)
                                const alloc = Number(allocatedMap.get(li) || 0)
                                const curr = Number(c.quantity || 0)
                                const remainingIfZero = Math.max(0, ord - (alloc - curr))
                                return (
                                  <CTableRow key={`r-${i}-${li}-${idxRow}`}>
                                    <CTableDataCell className="sku-cell">{it.sku || `Line ${li + 1}`}</CTableDataCell>
                                    <CTableDataCell className="name-cell">{it.productName || '—'}</CTableDataCell>
                                    <CTableDataCell className="t-center">{ord}</CTableDataCell>
                                    <CTableDataCell className="t-center">{alloc}</CTableDataCell>
                                    <CTableDataCell className="t-center">
                                      <div className="qty">
                                        <button
                                          type="button"
                                          className="step"
                                          onClick={() => setQtyInPkg(i, li, Math.max(0, curr - 1))}
                                          disabled={locked}
                                        >-</button>
                                        <input
                                          type="number"
                                          min="0"
                                          value={curr}
                                          onChange={(e) => setQtyInPkg(i, li, e.target.value)}
                                          disabled={locked}
                                        />
                                        <button
                                          type="button"
                                          className="step"
                                          onClick={() => setQtyInPkg(i, li, curr + 1)}
                                          disabled={locked}
                                        >+</button>
                                      </div>
                                    </CTableDataCell>
                                    <CTableDataCell className="t-center">{remainingIfZero}</CTableDataCell>
                                    <CTableDataCell className="t-center">
                                      <CButton
                                        size="sm"
                                        color="danger"
                                        variant="outline"
                                        onClick={() => removeRow(i, li)}
                                        disabled={locked}
                                      >
                                        ✕
                                      </CButton>
                                    </CTableDataCell>
                                  </CTableRow>
                                )
                              })}
                            </CTableBody>
                          </CTable>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <style>{`
          .pkg-builder2 .modal-body { padding: 14px; }
          .pkg-builder2 .pb2-topbar { display:flex; gap:16px; align-items:center; justify-content:space-between; margin-bottom:12px; }
          .pkg-builder2 .pb2-topbar .left { display:flex; gap:12px; align-items:center; flex:1; }
          .pkg-builder2 .pb2-topbar .right { display:flex; gap:10px; }
          .pkg-builder2 .pb2-search { min-width: 360px; }
          .pkg-builder2 .hint { color:#99a2ad; font-size:.95rem; }

          .pkg-builder2 .pb2-grid { display:grid; grid-template-columns: 480px 1fr; gap:14px; height: calc(80vh); }
          .pkg-builder2 .pb2-left { border:1px solid #2a2f35; background:#12161b; border-radius:12px; padding:10px; overflow:auto; }
          .pkg-builder2 .pb2-right { border:1px solid #2a2f35; background:#12161b; border-radius:12px; padding:10px; overflow:auto; }

          .pkg-builder2 .pb2-block + .pb2-block { margin-top:12px; }
          .pkg-builder2 .pb2-block-head { display:flex; align-items:center; gap:8px; font-weight:700; margin-bottom:6px; }
          .pkg-builder2 .pb2-list { display:flex; flex-direction:column; gap:8px; max-height: 28vh; overflow:auto; }
          .pkg-builder2 .empty { color:#99a2ad; padding:6px 2px; }

          .pkg-builder2 .pb2-line { border:1px solid #2a2f35; background:#151a1f; border-radius:10px; padding:10px; cursor:grab; }
          .pkg-builder2 .pb2-line:active { cursor:grabbing; }
          .pkg-builder2 .pb2-line.depleted { opacity:.55; cursor:not-allowed; }
          .pkg-builder2 .pb2-line .sku { font-weight:800; word-break:break-all; }
          .pkg-builder2 .pb2-line .name { font-size:.95rem; color:#c6ced6; margin-top:2px; white-space:normal; word-break:break-word; }
          .pkg-builder2 .pb2-line .meta { margin-top:6px; }

          .pkg-builder2 .pb2-cols { display:grid; grid-template-columns: repeat(auto-fill, minmax(520px, 1fr)); gap:12px; }
          .pkg-builder2 .pb2-col { min-height:260px; background:#151a1f; border:1px solid #2a2f35; border-radius:12px; padding:10px; }
          .pkg-builder2 .pb2-col.locked { opacity:.92; }
          .pkg-builder2 .pb2-col-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
          .pkg-builder2 .pb2-drop { border:2px dashed #2a2f35; border-radius:10px; padding:22px; text-align:center; color:#99a2ad; }

          .pkg-builder2 .pb2-fields .row1 { display:grid; grid-template-columns: 1fr 220px; gap:10px; }
          .pkg-builder2 .pb2-fields .row2 { display:flex; align-items:end; gap:10px; margin-top:10px; }
          .pkg-builder2 .pb2-fields .row2 .lbl { font-size:.9rem; color:#99a2ad; margin-bottom:2px; }
          .pkg-builder2 .pb2-fields .row2 .dims { display:grid; grid-template-columns: 110px 110px 110px 120px; gap:10px; align-items:end; }

          .pkg-builder2 .pb2-table-wrap { overflow:auto; max-height: 46vh; }
          .pkg-builder2 .pb2-table { min-width: 1000px; }
          .pkg-builder2 .sku-cell { font-weight:700; word-break:break-all; }
          .pkg-builder2 .name-cell { white-space:normal; word-break:break-word; }

          .pkg-builder2 .qty { display:inline-flex; align-items:center; gap:6px; }
          .pkg-builder2 .qty .step { width:32px; height:32px; border-radius:8px; border:1px solid #2a2f35; background:#1a1e23; color:#e6ebef; }
          .pkg-builder2 .qty input { width:86px; height:32px; background:#0f1317; border:1px solid #2a2f35; border-radius:6px; color:#e6ebef; text-align:center; }
        `}</style>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton>
        <CButton color="success" onClick={apply}>Save changes</CButton>
      </CModalFooter>
    </CModal>
  )
}





const OrderDetailsModal = ({
  order,
  visible,
  onClose,
  onViewLabel,
  presetsService,
  orderService,
  fetchOrders,
  onSplitChange,
  currentUserId
}) => {
  const [tab, setTab] = useState('details')
  const [builderOpen, setBuilderOpen] = useState(false)

  const apiGetLineCarriers = async (orderNo) =>
    orderService?.getLineCarriers ? orderService.getLineCarriers(orderNo) : packageService.getLineCarriers(orderNo)
  const apiSetLineCarriers = async (orderNo, lines, mode = 'merge') =>
    orderService?.setLineCarriers ? orderService.setLineCarriers(orderNo, lines, mode) : packageService.setLineCarriers(orderNo, lines, mode)
  const apiCreateLineSelectionLabel = async (orderNo, selectionId) =>
    orderService?.createLineSelectionLabel ? orderService.createLineSelectionLabel(orderNo, selectionId) : packageService.createLineSelectionLabel(orderNo, selectionId)

  const [pkLoading, setPkLoading] = useState(false)
  const [pkError, setPkError] = useState('')
  const [pkgLabelBusy, setPkgLabelBusy] = useState({})
  const [pkgLabelUrl, setPkgLabelUrl] = useState({})
  const pkgKey = (pkg, idx) => (pkg?._id ? String(pkg._id) : `idx:${idx}`)
  const [pkSaving, setPkSaving] = useState(false)
  const [packagesArr, setPackagesArr] = useState([])
  const [bulkLabelBusy, setBulkLabelBusy] = useState(false)
  const [nextVisible, setNextVisible] = useState(false)
  const [nextOrder, setNextOrder] = useState(null)
  const [bulkLabelInfo, setBulkLabelInfo] = useState(null)

  const [bulkCarrierBusy, setBulkCarrierBusy] = useState(false)
  const [bulkCarrierCode, setBulkCarrierCode] = useState('')
  const [bulkCarrierMode, setBulkCarrierMode] = useState('all')


  const [pkgSummary, setPkgSummary] = useState([])
  const [pkTotalWeight, setPkTotalWeight] = useState(0)
  const [autoDefaults, setAutoDefaults] = useState({ boxType: '', inner: { length: '', width: '', height: '', unit: 'cm' }, weightKg: '' })
  const [pkgRowBusy, setPkgRowBusy] = useState({})
  const busyKey = (pkgIdx, lineIndex) => `${pkgIdx}:${lineIndex}`
  const setPkgRowFlag = (pkgIdx, lineIndex, key, val) =>
    setPkgRowBusy((b) => ({ ...b, [busyKey(pkgIdx, lineIndex)]: { ...(b[busyKey(pkgIdx, lineIndex)] || {}), [key]: val } }))

  const [presets, setPresets] = useState([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [presetsError, setPresetsError] = useState('')
  // --- Add this small component inside Orders.js (top-level in file, outside OrderDetailsModal) ---
  const PresetForm = ({ onCreated }) => {
    const [name, setName] = React.useState('')
    const [length, setLength] = React.useState('')
    const [width, setWidth] = React.useState('')
    const [height, setHeight] = React.useState('')
    const [unit, setUnit] = React.useState('cm')
    const [weight, setWeight] = React.useState('')
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState('')
    const [success, setSuccess] = React.useState('')

    const reset = () => {
      setName('')
      setLength('')
      setWidth('')
      setHeight('')
      setUnit('cm')
      setWeight('')
    }

    const validate = () => {
      if (!name.trim()) return 'Name is required.'
      const L = Number(length), W = Number(width), H = Number(height)
      if (!(L > 0 && W > 0 && H > 0)) return 'Enter valid positive dimensions.'
      if (!['cm', 'mm', 'in'].includes(unit)) return 'Unit must be cm, mm, or in.'
      const wt = Number(weight)
      if (!(wt > 0)) return 'Weight must be a positive number.'
      return ''
    }

    const submit = async () => {
      setError('')
      setSuccess('')
      const v = validate()
      if (v) { setError(v); return }
      setSubmitting(true)
      try {
        const payload = {
          name: name.trim(),
          dimensions: {
            length: Number(length),
            width: Number(width),
            height: Number(height),
            unit,
          },
          weight: Number(weight),
        }
        await presetsService.addPreset(payload)
        setSuccess('Preset added!')
        reset()
        if (typeof onCreated === 'function') await onCreated()
      } catch (e) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to add preset'
        setError(msg)
      } finally {
        setSubmitting(false)
      }
    }

    return (
      <>
        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {success ? <CAlert color="success">{success}</CAlert> : null}

        <CForm
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <CRow className="g-3">
            <CCol md={4}>
              <CFormInput
                label="Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Medium Box"
                required
              />
            </CCol>
            <CCol md={2}>
              <CFormInput
                label="Length *"
                type="number"
                min="0"
                step="0.01"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="20"
                required
              />
            </CCol>
            <CCol md={2}>
              <CFormInput
                label="Width *"
                type="number"
                min="0"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="15"
                required
              />
            </CCol>
            <CCol md={2}>
              <CFormInput
                label="Height *"
                type="number"
                min="0"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="10"
                required
              />
            </CCol>
            <CCol md={2}>
              <CFormSelect label="Unit *" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="cm">cm</option>
                <option value="mm">mm</option>
                <option value="in">in</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CRow className="g-3 mt-1">
            <CCol md={3}>
              <CFormInput
                label="Weight *"
                type="number"
                min="0"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="3.5"
                required
              />
              <div className="small text-muted">KG</div>
            </CCol>
            <CCol md={9} className="d-flex align-items-end justify-content-end">
              <CButton color="secondary" variant="outline" className="me-2" onClick={reset} disabled={submitting}>
                Clear
              </CButton>
              <CButton color="primary" onClick={submit} disabled={submitting}>
                {submitting ? <CSpinner size="sm" className="me-2" /> : null}
                Add Preset
              </CButton>
            </CCol>
          </CRow>
        </CForm>
      </>
    )
  }

  const normalizePresets = (arr = []) =>
    arr
      .map((raw, i) => {
        const id = raw?._id || raw?.id || String(i)
        const name = raw?.name || raw?.boxType || `Preset ${i + 1}`
        const dims = raw?.dimensions || raw?.inner || { length: raw?.L ?? raw?.length ?? '', width: raw?.W ?? raw?.width ?? '', height: raw?.H ?? raw?.height ?? '', unit: raw?.unit ?? 'cm' }
        return { _id: id, name, boxType: raw?.boxType || name, weightKg: raw?.weightKg ?? raw?.weight ?? '', dimensions: { length: dims?.length ?? '', width: dims?.width ?? '', height: dims?.height ?? '', unit: dims?.unit ?? 'cm' } }
      })
      .filter(p => p.dimensions.length || p.dimensions.width || p.dimensions.height)
  // ---- PDF download helpers (paste inside OrderDetailsModal component) ----


  // ---- PDF download helpers (REPLACE THIS VERSION) ----
  const fetchBlobWithAuth = async (urlOrPath) => {
    const absolute = urlOrPath.startsWith('http')
      ? urlOrPath
      : `${SERVER_URL}${urlOrPath}`

    const token =
      localStorage.getItem('jwtToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('authToken') ||
      ''

    const res = await fetch(absolute, {
      method: 'GET',
      // IMPORTANT: we send only the Bearer header, no cookies → avoids credentialed CORS
      credentials: 'omit',
      mode: 'cors',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) {
      const msg = `HTTP ${res.status}`
      throw new Error(msg)
    }
    return res.blob()
  }

  const saveBlob = (blob, filename = 'label.pdf') => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  const downloadProtectedPdf = async (urlOrPath, filename = 'label.pdf') => {
    const blob = await fetchBlobWithAuth(urlOrPath)
    saveBlob(blob, filename)
  }


  const fetchPresets = async () => {
    setLoadingPresets(true)
    setPresetsError('')
    try {
      let raw = null
      if (typeof presetsService?.getPresets === 'function') raw = await presetsService.getPresets()
      else if (typeof presetsService?.list === 'function') raw = await presetsService.list()
      else if (typeof presetsService?.getAll === 'function') raw = await presetsService.getAll()
      let arr = (Array.isArray(raw) && raw) || raw?.presets || raw?.result || raw?.data || []
      if (!Array.isArray(arr) || arr.length === 0) {
        try {
          const resp = await fetch(`${SERVER_URL}/presets`, { credentials: 'include' })
          if (resp.ok) {
            const fallback = await resp.json()
            arr = Array.isArray(fallback) ? fallback : (fallback?.presets || fallback?.result || fallback?.data || [])
          }
        } catch { }
      }
      setPresets(normalizePresets(arr))
    } catch (err) {
      setPresetsError((err?.response?.data?.message) || (err?.response?.data?.error) || err?.message || 'Failed to fetch presets')
      setPresets([])
    } finally {
      setLoadingPresets(false)
    }
  }

  const applyPresetToPackage = (pkgIdx, presetId) => {
    const pr = presets.find(p => p._id === presetId)
    if (!pr) return
    setPackagesArr(prev => {
      const next = [...prev]
      const p = { ...next[pkgIdx] }
      p.boxType = pr.boxType || p.boxType || 'Carton'
      p.inner = { length: pr.dimensions.length ?? p.inner?.length ?? '', width: pr.dimensions.width ?? p.inner?.width ?? '', height: pr.dimensions.height ?? p.inner?.height ?? '', unit: pr.dimensions.unit ?? p.inner?.unit ?? 'cm' }
      if (pr.weightKg !== '' && pr.weightKg != null) p.weightKg = pr.weightKg
      next[pkgIdx] = p
      return next
    })
  }

  useEffect(() => {
    if (visible && tab === 'packages') fetchPresets()
  }, [visible, tab])

  const apiGetPackages = (orderNo) => packageService.getPackages(orderNo)
  const apiPreviewPackages = (orderNo, payload) => packageService.previewPackages(orderNo, payload)
  const apiSavePackages = (orderNo, payload) => packageService.savePackages(orderNo, payload)

  const savePackageCarrier = async (pkg) => {
    if (!order?.orderNo || !pkg?._id || !pkg?.carrierCode) return
    try {
      await packageService.setPackageCarrier(order.orderNo, pkg._id, pkg.carrierCode)
      await loadPackages()
    } catch (e) { setPkError(pickErr(e, 'Failed to save package carrier')) }
  }

  const genPackageLabel = async (pkg, idx) => {
    if (!order?.orderNo || !pkg?._id) return
    const key = pkgKey(pkg, idx)
    setPkError('')
    setPkgLabelBusy((m) => ({ ...m, [key]: true }))
    try {
      const res = await packageService.createPackageLabel(order.orderNo, pkg._id)
      const url = res?.label?.pdfUrl || res?.pdfUrl
      if (url) {
        const absolute = `${SERVER_URL}${url}`
        setPkgLabelUrl((m) => ({ ...m, [key]: absolute }))
        await downloadProtectedPdf(url, `label_${order.orderNo}_${pkg._id || idx}.pdf`)

      } else {
        setPkError('Label created but no URL returned by API.')
      }
    } catch (e) {
      setPkError(pickErr(e, 'Failed to generate package label'))
    } finally {
      setPkgLabelBusy((m) => ({ ...m, [key]: false }))
    }
  }

  const setContentCarrier = (pkgIdx, lineIndex, code) => {
    setPackagesArr(prev => {
      const arr = [...prev]
      const p = { ...arr[pkgIdx] }
      const list = [...(p.contents || [])]
      const i = list.findIndex(c => Number(c.lineIndex) === Number(lineIndex))
      if (i !== -1) {
        list[i] = { ...list[i], carrierCode: code || '' }
        p.contents = list
        arr[pkgIdx] = p
      }
      return arr
    })
  }

  const savePkgContentRow = async (pkgIdx, lineIndex) => {
    const pkg = packagesArr[pkgIdx]
    const row = (pkg?.contents || []).find(c => Number(c.lineIndex) === Number(lineIndex))
    const qty = Number(row?.quantity || 0)
    const code = String(row?.carrierCode || '')
    if (!qty || !code) { setPkError('Pick a carrier and ensure quantity > 0 for this row.'); return null }
    setPkgRowFlag(pkgIdx, lineIndex, 'saving', true)
    try {
      const res = await apiSetLineCarriers(order.orderNo, [{ lineIndex: Number(lineIndex), quantity: qty, carrierCode: code }], 'merge')
      let selectionId = null
      if (Array.isArray(res?.selections)) {
        const matches = res.selections.filter(s => Number(s.lineIndex) === Number(lineIndex) && String(s.carrierCode) === code && Number(s.quantity) === qty)
        selectionId = matches.length ? (matches[matches.length - 1]._id || matches[matches.length - 1].id) : null
      } else if (res?.selection?._id) selectionId = res.selection._id
      else if (res?.createdId) selectionId = res.createdId
      await loadLineCarriers()
      await fetchOrders?.()
      return { selectionId }
    } catch (e) {
      setPkError(pickErr(e, `Failed to save line #${(Number(lineIndex) + 1)}`))
      return null
    } finally {
      setPkgRowFlag(pkgIdx, lineIndex, 'saving', false)
    }
  }

  const labelLatestForLine = async (lineIndex) => {
    const data = await apiGetLineCarriers(order.orderNo)
    const sels = (data?.selections || []).filter(s => Number(s.lineIndex) === Number(lineIndex))
    if (!sels.length) throw new Error('No selection found for this line.')
    const last = sels[sels.length - 1]
    const res = await apiCreateLineSelectionLabel(order.orderNo, last._id || last.id)
    const url = res?.label?.pdfUrl || res?.pdfUrl
    if (url) await downloadProtectedPdf(url, `label_${order.orderNo}_line${lineIndex + 1}.pdf`)

  }

  const loadPackages = async () => {
    if (!order?.orderNo) return
    setPkLoading(true); setPkError('')
    try {
      const data = await apiGetPackages(order.orderNo)
      const arr = Array.isArray(data?.packages) ? data.packages : []
      const sum = Array.isArray(data?.summary) ? data.summary : []
      const tw = Number(data?.totalWeight ?? arr.reduce((s, p) => s + (Number(p.weightKg) || 0), 0))
      setPackagesArr(arr); setPkgSummary(sum); setPkTotalWeight(tw)
    } catch (e) { setPkError(pickErr(e, 'Failed to load packages')) }
    finally { setPkLoading(false) }
  }
  useEffect(() => {
    if (!visible || !order?.orderNo) return
    if (tab === 'packages' || tab === 'boxes' || tab === 'details' || tab === 'plan') loadPackages()
  }, [visible, tab, order?.orderNo])

  const orderedLines = order?.items || []
  const computeAllocated = useCallback((arr) => {
    const map = new Map()
    arr.forEach((pkg) => (pkg.contents || []).forEach((c) => {
      const k = Number(c.lineIndex), q = Number(c.quantity) || 0
      map.set(k, (map.get(k) || 0) + q)
    }))
    return map
  }, [])
  const allocatedMap = useMemo(() => computeAllocated(packagesArr), [packagesArr, computeAllocated])
  const lineOrderedQty = (idx) => Number(orderedLines[idx]?.quantity || 0)
  const lineRemaining = (idx) => Math.max(0, lineOrderedQty(idx) - (allocatedMap.get(idx) || 0))

  const addEmptyPackage = () => setPackagesArr((prev) => [...prev, { boxType: '', inner: { length: '', width: '', height: '', unit: 'cm' }, weightKg: '', contents: [], selectionId: null, carrierCode: null, status: 'CONFIRMED' }])
  const duplicatePackage = (i) => setPackagesArr((prev) => [...prev, JSON.parse(JSON.stringify(prev[i]))])
  const removePackage = (i) => setPackagesArr((prev) => prev.filter((_, idx) => idx !== i))
  const setPkgField = (i, key, val) => setPackagesArr((prev) => { const next = [...prev]; next[i] = { ...next[i], [key]: val }; return next })
  const setInnerField = (i, key, val) => setPackagesArr((prev) => { const next = [...prev]; next[i] = { ...next[i], inner: { ...next[i].inner, [key]: val } }; return next })

  const upsertContentQty = (pkgIdx, lineIndex, delta) => {
    setPackagesArr((prev) => {
      const arr = [...prev], pkg = { ...arr[pkgIdx] }, list = [...(pkg.contents || [])]
      const idx = list.findIndex((c) => Number(c.lineIndex) === Number(lineIndex))
      const rem = lineRemaining(lineIndex)
      const allowed = Math.min(rem, Math.max(0, delta))
      if (allowed <= 0 && idx === -1) return prev
      if (idx === -1) list.push({ lineIndex: Number(lineIndex), sku: orderedLines[lineIndex]?.sku || '', quantity: allowed })
      else {
        const cur = Number(list[idx].quantity) || 0
        const nextQ = cur + allowed
        if (nextQ <= 0) list.splice(idx, 1); else list[idx] = { ...list[idx], quantity: nextQ }
      }
      pkg.contents = list; arr[pkgIdx] = pkg; return arr
    })
  }
  const setContentQty = (pkgIdx, lineIndex, qty) => {
    const q = Math.max(0, Math.floor(Number(qty) || 0))
    setPackagesArr((prev) => {
      const arr = [...prev], pkg = { ...arr[pkgIdx] }, list = [...(pkg.contents || [])]
      const idx = list.findIndex((c) => Number(c.lineIndex) === Number(lineIndex))
      const currentQtyInThisPkg = idx !== -1 ? Number(list[idx].quantity) || 0 : 0
      const globalAllocated = allocatedMap.get(lineIndex) || 0
      const available = Math.max(0, lineOrderedQty(lineIndex) - (globalAllocated - currentQtyInThisPkg))
      const finalQ = Math.min(q, available)
      if (finalQ === 0) { if (idx !== -1) list.splice(idx, 1) }
      else if (idx === -1) list.push({ lineIndex: Number(lineIndex), sku: orderedLines[lineIndex]?.sku || '', quantity: finalQ })
      else list[idx] = { ...list[idx], quantity: finalQ }
      pkg.contents = list; arr[pkgIdx] = pkg; return arr
    })
  }
  const removeContent = (pkgIdx, lineIndex) => {
    setPackagesArr((prev) => {
      const arr = [...prev], pkg = { ...arr[pkgIdx] }
      pkg.contents = (pkg.contents || []).filter((c) => Number(c.lineIndex) !== Number(lineIndex))
      arr[pkgIdx] = pkg; return arr
    })
  }

  const autoplan = async () => {
    if (!order?.orderNo) return
    setPkLoading(true); setPkError('')
    try {
      const payload = { strategy: 'ONE_PER_UNIT', defaults: { boxType: autoDefaults.boxType || 'Carton', inner: { length: Number(autoDefaults.inner.length) || 0, width: Number(autoDefaults.inner.width) || 0, height: Number(autoDefaults.inner.height) || 0, unit: autoDefaults.inner.unit || 'cm' }, weightKg: Number(autoDefaults.weightKg) || 1 } }
      const res = await apiPreviewPackages(order.orderNo, payload)
      setPackagesArr(Array.isArray(res?.draft) ? res.draft : [])
      setPkError('')
    } catch (e) { setPkError(pickErr(e, 'Failed to generate draft')) }
    finally { setPkLoading(false) }
  }

  const validatePackages = () => {
    if (!packagesArr.length) return 'Add at least one package.'
    for (let i = 0; i < packagesArr.length; i++) {
      const p = packagesArr[i]
      if (!p.boxType) return `Package #${i + 1}: box type is required.`
      const L = Number(p.inner?.length), W = Number(p.inner?.width), H = Number(p.inner?.height)
      const U = p.inner?.unit || 'cm'
      if (!(L > 0 && W > 0 && H > 0)) return `Package #${i + 1}: enter valid inner dimensions.`
      if (!['cm', 'in', 'mm', 'inch'].includes(String(U))) return `Package #${i + 1}: invalid unit.`
      const weight = Number(p.weightKg)
      if (!(weight > 0)) return `Package #${i + 1}: weightKg must be > 0.`
      const contents = p.contents || []
      if (!contents.length) return `Package #${i + 1}: add at least one SKU/line.`
      for (const c of contents) {
        if (typeof c.lineIndex !== 'number') return `Package #${i + 1}: invalid lineIndex in contents.`
        if (!(Number(c.quantity) >= 1)) return `Package #${i + 1}: quantities must be >= 1.`
      }
    }
    return ''
  }
  const savePackages = async () => {
    const v = validatePackages()
    if (v) { setPkError(v); return }
    setPkSaving(true); setPkError('')
    try {
      const payload = {
        packages: packagesArr.map((p) => ({
          boxType: p.boxType,
          inner: { length: Number(p.inner.length), width: Number(p.inner.width), height: Number(p.inner.height), unit: p.inner.unit || 'cm' },
          weightKg: Number(p.weightKg),
          contents: (p.contents || []).map((c) => ({ lineIndex: Number(c.lineIndex), sku: c.sku || (orderedLines[c.lineIndex]?.sku || ''), quantity: Number(c.quantity), carrierCode: c.carrierCode || undefined })),
          selectionId: p.selectionId || null,
          carrierCode: p.carrierCode || null,
        })),
      }
      const res = await apiSavePackages(order.orderNo, payload)
      const arr = Array.isArray(res?.packages) ? res.packages : []
      const sum = Array.isArray(res?.summary) ? res.summary : []
      setPackagesArr(arr); setPkgSummary(sum)
      setPkTotalWeight(Number(res?.totalWeight ?? arr.reduce((s, p) => s + (Number(p.weightKg) || 0), 0)))
      if (typeof fetchOrders === 'function') await fetchOrders()
    } catch (e) { setPkError(pickErr(e, 'Failed to save packages')) }
    finally { setPkSaving(false) }
  }
  // Open NextStatusModal from a row click (used for Royal Box)
  const openNextStep = (order) => {
    setNextOrder(order)
    setNextVisible(true)
  }

  const [carriers, setCarriers] = useState([])
  const [carriersLoading, setCarriersLoading] = useState(false)
  const [carriersError, setCarriersError] = useState('')
  const [carrierCode, setCarrierCode] = useState('')
  const [savingCarrier, setSavingCarrier] = useState(false)
  const [carrierSavedMsg, setCarrierSavedMsg] = useState('')

  const ensureCarriers = async () => {
    setCarriersLoading(true); setCarriersError(''); setCarrierSavedMsg('')
    try {
      const res = await orderService.getCarriers()
      const list = (res?.result || res || []).filter((c) => c?.active !== false)
      setCarriers(list)
      const code = order?.carrier?.code || order?.carrierCode || ''
      if (code) setCarrierCode(code)
      else if (order?.shippingCompany) {
        const match = list.find((c) => (c.name || '').toLowerCase() === String(order.shippingCompany).toLowerCase())
        if (match?.code) setCarrierCode(match.code)
      }
    } catch (e) { setCarriersError(pickErr(e, 'Failed to load carriers')) }
    finally { setCarriersLoading(false) }
  }
  useEffect(() => {
    if (!visible || !order?.orderNo) return
    if (tab === 'carrier' || tab === 'split' || tab === 'packages') ensureCarriers()
  }, [visible, tab, order?.orderNo])

  const saveCarrierOnly = async () => {
    if (!order?.orderNo || !carrierCode) return
    setSavingCarrier(true); setCarriersError(''); setCarrierSavedMsg('')
    try {
      await orderService.selectCarrier(order.orderNo, carrierCode)
      setCarrierSavedMsg('Carrier saved for this order.')
      await fetchOrders?.()
    } catch (e) { setCarriersError(pickErr(e, 'Failed to save carrier')) }
    finally { setSavingCarrier(false) }
  }

  const [lcLoading, setLcLoading] = useState(false)
  const [lcError, setLcError] = useState('')
  const [lcRemaining, setLcRemaining] = useState([])
  const [lcSelections, setLcSelections] = useState([])
  const [lcDraft, setLcDraft] = useState({})
  const [lineBusy, setLineBusy] = useState({})

  const loadLineCarriers = async () => {
    setLcLoading(true); setLcError('')
    try {
      const data = await apiGetLineCarriers(order.orderNo)
      setLcRemaining(Array.isArray(data?.remaining) ? data.remaining : [])
      setLcSelections(Array.isArray(data?.selections) ? data.selections : [])
      onSplitChange?.(order.orderNo, (Array.isArray(data?.selections) ? data.selections : []).length > 0)
    } catch (e) { setLcError(pickErr(e, 'Failed to load per-line shipping info')) }
    finally { setLcLoading(false) }
  }
  useEffect(() => {
    if (!visible || !order?.orderNo) return
    if (tab === 'split' || tab === 'carrier' || tab === 'plan') loadLineCarriers()
  }, [visible, tab, order?.orderNo])

  const setDraftField = (lineIndex, key, value) =>
    setLcDraft((d) => ({ ...d, [lineIndex]: { ...(d[lineIndex] || {}), [key]: value } }))

  const saveLineSelection = async (lineIndex) => {
    const draft = lcDraft[lineIndex] || {}
    const quantity = Number(draft.quantity || 0)
    const code = String(draft.carrierCode || '')
    if (!quantity || !code) { setLcError('Pick a carrier and quantity first.'); return null }
    setLineBusy((b) => ({ ...b, [lineIndex]: { ...(b[lineIndex] || {}), saving: true } }))
    try {
      const res = await apiSetLineCarriers(order.orderNo, [{ lineIndex, quantity, carrierCode: code }], 'merge')
      let selectionId = null
      if (Array.isArray(res?.selections)) {
        const matches = res.selections.filter(s => Number(s.lineIndex) === Number(lineIndex) && String(s.carrierCode) === code && Number(s.quantity) === Number(quantity))
        selectionId = matches.length ? (matches[matches.length - 1]._id || matches[matches.length - 1].id) : null
      } else if (res?.selection?._id) selectionId = res.selection._id
      else if (res?.createdId) selectionId = res.createdId
      await loadLineCarriers()
      await fetchOrders?.()
      return { selectionId }
    } catch (e) {
      setLcError(pickErr(e, `Failed to save line #${lineIndex + 1}`))
      return null
    } finally {
      setLineBusy((b) => ({ ...b, [lineIndex]: { ...(b[lineIndex] || {}), saving: false } }))
    }
  }

  const splitActive =
    lcSelections.length > 0 ||
    (Array.isArray(order?.carrierSelections) && order.carrierSelections.length > 0) ||
    !!order?.carrierPlan?.hasSplit

  const items = Array.isArray(order?.items) ? order.items : []
  const pkgs = (Array.isArray(packagesArr) && packagesArr.length) ? packagesArr : (Array.isArray(order?.packages) ? order.packages : [])
  const legacyBoxes = Array.isArray(order?.boxes) ? order.boxes : (Array.isArray(pkgSummary) ? pkgSummary : [])
  const totalWeightSafe = Number(order?.totalWeight ?? pkTotalWeight ?? 0)
  const labelGenerated = !!order?.labelGenerated
  const plan = (order && typeof order === 'object' && order.carrierPlan) ? order.carrierPlan : {}
  const planLines = Array.isArray(plan?.lines) ? plan.lines : []
  const badgesRaw = Array.isArray(order?.carrierBadges) ? order.carrierBadges : []
  const totalsRaw = plan?.totalsByCarrier
  const totalsList = Array.isArray(totalsRaw) ? totalsRaw : totalsRaw && typeof totalsRaw === 'object' ? Object.entries(totalsRaw).map(([code, count]) => ({ code, count })) : []
  const normalizeBadge = (b) => !b ? null : (typeof b === 'string' ? { code: b, count: undefined } : (typeof b === 'object' ? { code: b.code ?? b.carrier ?? '—', count: b.count ?? b.qty ?? b.quantity } : { code: String(b), count: undefined }))
  const badges = badgesRaw.map(normalizeBadge).filter(Boolean)
  const carrierWhole = (order?.carrier?.name && order?.carrier?.code) ? `${order.carrier.name} (${order.carrier.code})` : (order?.carrierName || order?.carrierCode) ? `${order?.carrierName || ''}${order?.carrierCode ? ` (${order.carrierCode})` : ''}` : order?.shippingCompany || null
  const hasPerLineCarrier = !!order?.hasPerLineCarrier || order?.carrierMode === 'PER_LINE' || !!order?.carrierPlan?.hasSplit || (Array.isArray(order?.carrierSelections) && order.carrierSelections.length > 0) || planLines.length > 0
  const hasWholeOrderCarrier = !!order?.hasWholeOrderCarrier || order?.carrierMode === 'WHOLE_ORDER' || !!carrierWhole

  const pickErr = (e, fb = 'Something went wrong') => {
    const data = e?.response?.data
    return ((typeof data?.error === 'string' && data.error) || data?.error?.message || data?.message || e?.message || fb)
  }

  const bundleGroups = Array.isArray(order?.bundleGroups) ? order.bundleGroups : []
  const roleByIndex = Array.isArray(order?.bundleRoleByIndex) ? order.bundleRoleByIndex : []
  const parentLineIdxSet = useMemo(() => {
    const s = new Set()
    roleByIndex.forEach((r, i) => { if (r?.role === 'PARENT') s.add(i) })
    return s
  }, [roleByIndex])
  const childLineIdxSet = useMemo(() => {
    const s = new Set()
    roleByIndex.forEach((r, i) => { if (r?.role === 'CHILD') s.add(i) })
    return s
  }, [roleByIndex])
  const nonBundleLineIdx = useMemo(() => {
    const arr = []
    items.forEach((_, i) => { if (!childLineIdxSet.has(i) && !parentLineIdxSet.has(i)) arr.push(i) })
    return arr
  }, [items, parentLineIdxSet, childLineIdxSet])

  const [openGroups, setOpenGroups] = useState({})
  const toggleGroup = (gid) => setOpenGroups((m) => ({ ...m, [gid]: !m[gid] }))

  const filteredSplitIndices = useMemo(() => {
    const res = []
    items.forEach((_, i) => {
      if (parentLineIdxSet.has(i) || (!childLineIdxSet.has(i) && !parentLineIdxSet.has(i))) res.push(i)
    })
    return res
  }, [items, parentLineIdxSet, childLineIdxSet])

  return (
    <CModal visible={visible} onClose={onClose} size="xl" scrollable className="details-modal">
      <CModalHeader closeButton><CModalTitle>Order #{order?.orderNo}</CModalTitle></CModalHeader>
      <CModalBody>
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item"><button className={`nav-link ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button></li>
          <li className="nav-item ms-2"><button className={`nav-link ${tab === 'boxes' ? 'active' : ''}`} onClick={() => setTab('boxes')}>Boxes (Summary)</button></li>
          <li className="nav-item ms-2"><button className={`nav-link ${tab === 'packages' ? 'active' : ''}`} onClick={() => setTab('packages')}>Packages</button></li>
          <li className="nav-item ms-2"><button className={`nav-link ${tab === 'presets' ? 'active' : ''}`} onClick={() => setTab('presets')}>Box Presets</button></li>
          {/* <li className="nav-item ms-2"><button className={`nav-link ${tab === 'carrier' ? 'active' : ''}`} onClick={() => setTab('carrier')}>Carrier</button></li>
          <li className="nav-item ms-2"><button className={`nav-link ${tab === 'split' ? 'active' : ''}`} onClick={() => setTab('split')}>Per-line Shipping</button></li> */}
          <li className="nav-item ms-2"><button className={`nav-link ${tab === 'plan' ? 'active' : ''}`} onClick={() => setTab('plan')}>Plan</button></li>
        </ul>

        {tab === 'details' && (
          <CCard className="mb-3">
            <CCardBody>
              <CRow>
                {[
                  ['Customer', order?.customerName],
                  ['Mobile', order?.mobile],
                  ['Email', order?.email || '—'],
                  ['Address', order?.customerAddress || '—'],
                  ['City / Country', order?.city && order?.country ? `${order.city}, ${order.country}` : '—'],
                  ['Status', order?.orderStatus || order?.currentStatus || '—'],
                  ['Order Date', order?.orderDate ? new Date(order.orderDate).toLocaleString() : '—'],
                  ['Total', typeof order?.orderTotal === 'number' ? `SAR ${order.orderTotal.toFixed(2)}` : '—'],
                  ['Shipping Company', order?.shippingCompany || '—'],
                ].map(([lbl, val], i) => (
                  <CCol key={i} md={6} className="mb-2"><strong>{lbl}:</strong> {val}</CCol>
                ))}
              </CRow>

              {order?.statusHistory?.length > 0 && (
                <>
                  <hr />
                  <h6>Status History</h6>
                  <div style={{ borderLeft: `3px solid ${timelineColor}`, paddingLeft: 12 }}>
                    {order.statusHistory.map((sh, idx) => (
                      <div key={idx} className="mb-3" style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: -12, top: 4, width: 12, height: 12, borderRadius: '50%', backgroundColor: timelineColor }} />
                        <small className="text-muted">{sh.at ? new Date(sh.at).toLocaleString() : '—'}</small>
                        <div><strong>{sh.status || '—'}</strong></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {bundleGroups.length > 0 && (
                <>
                  <hr className="mt-4" />
                  <h6>Royal Box Bundles</h6>
                  <div className="rb-list">
                    {bundleGroups.map((g, i) => {
                      const gid = g.id || g._id || `${g.parentSku}-${i}`
                      const open = !!openGroups[gid]
                      return (
                        <div key={gid} className="rb-card">
                          <button className="rb-head" onClick={() => toggleGroup(gid)}>
                            <CIcon icon={cilChevronRight} className={`chev ${open ? 'open' : ''}`} />
                            <div className="meta">
                              <div className="title">{g.parentName || g.parentSku}</div>
                              <div className="sub">
                                <CBadge color="dark" className="me-2">Parent: {g.parentSku}</CBadge>
                                <CBadge color="info">Qty: ×{g.parentQty || 1}</CBadge>
                                {g.isRoyalBox ? <CBadge color="warning" className="ms-2">Royal Box</CBadge> : null}
                              </div>
                            </div>
                          </button>
                          {open && (
                            <div className="rb-body">
                              <CTable small striped>
                                <CTableHead>
                                  <CTableRow>
                                    <CTableHeaderCell>SKU</CTableHeaderCell>
                                    <CTableHeaderCell>Product</CTableHeaderCell>
                                    <CTableHeaderCell className="t-center">Per Parent</CTableHeaderCell>
                                    <CTableHeaderCell className="t-center">Total</CTableHeaderCell>
                                    <CTableHeaderCell className="t-center">Expected</CTableHeaderCell>
                                    <CTableHeaderCell className="t-center">Match</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {(g.components || []).map((c, idx) => (
                                    <CTableRow key={`${gid}-c-${idx}`}>
                                      <CTableDataCell className="fw-semibold">{c.sku}</CTableDataCell>
                                      <CTableDataCell className="text-muted">{c.productName || '—'}</CTableDataCell>
                                      <CTableDataCell className="t-center">{c.perParentQty ?? '—'}</CTableDataCell>
                                      <CTableDataCell className="t-center">{c.totalQty ?? '—'}</CTableDataCell>
                                      <CTableDataCell className="t-center">{c.expectedTotalQty ?? '—'}</CTableDataCell>
                                      <CTableDataCell className="t-center">
                                        <CBadge color={c.matches ? 'success' : 'danger'}>{c.matches ? 'OK' : 'Mismatch'}</CBadge>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <hr className="mt-4" />
              <h6>Other Items</h6>
              <CTable size="sm" striped className="mb-3">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Product</CTableHeaderCell>
                    <CTableHeaderCell>Qty</CTableHeaderCell>
                    <CTableHeaderCell>SKU</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {items.filter((_, idx) => !childLineIdxSet.has(idx)).map((it, idx) => {
                    if (roleByIndex[idx]?.role === 'CHILD') return null
                    const hide = roleByIndex[idx]?.role === 'CHILD'
                    if (hide) return null
                    return (
                      <CTableRow key={`item-${idx}`}>
                        <CTableDataCell>{it.productName}</CTableDataCell>
                        <CTableDataCell>{it.quantity}</CTableDataCell>
                        <CTableDataCell>{it.sku || '—'}</CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>

              <div className="small text-muted">
                <strong>Total package weight:</strong> {pkLoading ? 'Loading…' : `${pkTotalWeight || 0} kg`} • <strong>Package groups:</strong> {pkLoading ? '—' : (pkgSummary?.length || 0)}
              </div>

              <CAlert color="danger" visible={!!pkError} className="mt-2">{pkError}</CAlert>

              <CButton color="primary" size="sm" className="mt-2" onClick={onViewLabel} disabled={!order?.labelGenerated}>
                View & Print Label
              </CButton>
            </CCardBody>
          </CCard>
        )}

        {tab === 'boxes' && (
          <>
            <CAlert color="info" className="mb-3">This is a read-only legacy summary. Edit actual packages in the <strong>Packages</strong> tab.</CAlert>
            {pkError && <CAlert color="danger" className="mb-3">{pkError}</CAlert>}
            {pkLoading ? (
              <div className="text-center py-3"><CSpinner /></div>
            ) : (
              <>
                <CTable striped responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Box Type</CTableHeaderCell>
                      <CTableHeaderCell>Dimensions (L×W×H)</CTableHeaderCell>
                      <CTableHeaderCell>Unit</CTableHeaderCell>
                      <CTableHeaderCell className="t-center">Per-piece Weight (kg)</CTableHeaderCell>
                      <CTableHeaderCell className="t-center">Quantity</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {(pkgSummary || []).length ? (
                      pkgSummary.map((b, i) => (
                        <CTableRow key={`sum-${i}`}>
                          <CTableDataCell>{i + 1}</CTableDataCell>
                          <CTableDataCell>{b.boxType || '—'}</CTableDataCell>
                          <CTableDataCell>{[b.dimensions?.length, b.dimensions?.width, b.dimensions?.height].filter((x) => x !== undefined).join(' × ')}</CTableDataCell>
                          <CTableDataCell>{b.dimensions?.unit || 'cm'}</CTableDataCell>
                          <CTableDataCell className="t-center">{b.weight ?? '—'}</CTableDataCell>
                          <CTableDataCell className="t-center">{b.quantity ?? 0}</CTableDataCell>
                        </CTableRow>
                      ))
                    ) : (
                      <CTableRow><CTableDataCell colSpan={6} className="text-center text-muted">No packages saved yet.</CTableDataCell></CTableRow>
                    )}
                  </CTableBody>
                </CTable>

                <CRow className="mt-3">
                  <CCol md={6}><div className="p-2 rounded border small"><strong>Groups:</strong> {pkgSummary?.length || 0}</div></CCol>
                  <CCol md={6}><div className="p-2 rounded border small"><strong>Total Weight:</strong> {pkTotalWeight || 0} kg</div></CCol>
                </CRow>
              </>
            )}
          </>
        )}

        {tab === 'packages' && (() => {
          // --- normalizer: support both bulk-label response shapes
          const normalizeBulkLabelResult = (res) => {
            const coerceRow = (r) => {
              const pkgId = r?.packageId || r?.pkgId || r?.id || null
              const label = r?.label || (r?.pdfUrl ? { pdfUrl: r.pdfUrl } : null)
              const pdfUrl = label?.pdfUrl || label?.url || r?.pdfUrl || r?.url || null
              if ((r?.ok === true || r?.status === 200 || !!pdfUrl) && label) {
                return { type: 'generated', item: { packageId: pkgId, label: { ...label, pdfUrl } } }
              }
              const already =
                r?.alreadyLabeled === true ||
                r?.reason === 'already_labeled' ||
                String(r?.reason || '').toLowerCase().includes('already')
              if ((r?.ok === true || r?.status === 200) && already) {
                return { type: 'skipped', item: { packageId: pkgId, reason: 'already_labeled' } }
              }
              const message = r?.error || r?.message || r?.reason || 'Unknown error'
              return { type: 'errors', item: { packageId: pkgId, message } }
            }
            const out = { generated: [], skipped: [], errors: [], counts: { generated: 0, skipped: 0, errors: 0 }, urls: [] }
            const resultsArray =
              (Array.isArray(res?.results) && res.results) ||
              (Array.isArray(res?.data?.results) && res.data.results) ||
              null
            if (resultsArray) {
              for (const r of resultsArray) {
                const { type, item } = coerceRow(r)
                out[type].push(item)
                if (type === 'generated') {
                  const u = item?.label?.pdfUrl
                  if (u) out.urls.push(u)
                }
              }
            } else {
              const gen = Array.isArray(res?.generated) ? res.generated : []
              const skip = Array.isArray(res?.skipped) ? res.skipped : []
              const err = Array.isArray(res?.errors) ? res.errors : []
              for (const g of gen) {
                const pkgId = g?.packageId || g?.pkgId || null
                const label = g?.label || (g?.pdfUrl ? { pdfUrl: g.pdfUrl } : null)
                const pdfUrl = label?.pdfUrl || g?.pdfUrl || null
                const item = { packageId: pkgId, label: { ...(label || {}), pdfUrl } }
                out.generated.push(item)
                if (pdfUrl) out.urls.push(pdfUrl)
              }
              for (const s of skip) {
                out.skipped.push({ packageId: s?.packageId || s?.pkgId || null, reason: s?.reason || 'already_labeled' })
              }
              for (const e of err) {
                out.errors.push({ packageId: e?.packageId || e?.pkgId || null, message: e?.message || e?.error || 'Unknown error' })
              }
            }
            out.counts.generated = out.generated.length
            out.counts.skipped = out.skipped.length
            out.counts.errors = out.errors.length
            return out
          }

          // 🔒 Who can edit this package?
          const canEditPkg = (pkg) => {
            // new packages (no _id yet) are editable by current user
            if (!pkg?._id) return true
            // existing: only if createdBy matches current user
            return String(pkg?.createdBy || '') === String(currentUserId || '')
          }

          // hard-guard removals at the function level
          const removePackageGuarded = (i) => {
            const p = packagesArr[i]
            if (!canEditPkg(p)) return // ignore
            removePackage(i)
          }

          // hard-guard content edits (qty, add/remove line) at call sites below

          return (
            <>
              {pkError && <CAlert color="danger" className="mb-3">{pkError}</CAlert>}
              {presetsError && <CAlert color="warning" className="mb-3">{presetsError}</CAlert>}

              {/* Package Builder with lock enforcement on apply */}
              {builderOpen && (
                <PackageBuilderModal
                  visible={builderOpen}
                  onClose={() => setBuilderOpen(false)}
                  items={orderedLines}
                  roleByIndex={roleByIndex}
                  bundleGroups={bundleGroups}
                  initialPackages={packagesArr}
                  currentUserId={currentUserId}
                  onApply={(nextDraft) => {
                    // Merge builder draft with current packages:
                    // - Keep locked packages EXACTLY as they were (ignore any changes/removals)
                    // - Allow changes/new for editable packages (no _id OR createdBy === currentUserId)
                    const lockedById = new Map(
                      packagesArr
                        .filter(p => p?._id && String(p.createdBy || '') !== String(currentUserId || ''))
                        .map(p => [String(p._id), p])
                    )
                    const merged = nextDraft.map(p => {
                      if (p?._id && lockedById.has(String(p._id))) {
                        // restore locked version
                        return lockedById.get(String(p._id))
                      }
                      // stamp creator on brand-new packages (UI only; server may set too)
                      if (!p?._id) {
                        return { ...p, createdBy: currentUserId }
                      }
                      return p
                    })
                    // also ensure any locked packages that were removed in draft are put back
                    lockedById.forEach((lockedPkg, id) => {
                      if (!merged.find(x => String(x._id) === id)) merged.push(lockedPkg)
                    })
                    setPackagesArr(merged)
                    setBuilderOpen(false)
                  }}
                />
              )}

              {/* top actions */}
              <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                <div className="ms-auto d-flex gap-2 flex-wrap align-items-end">
                  <CButton size="sm" color="secondary" variant="outline" onClick={loadPackages} disabled={pkLoading}>
                    {pkLoading ? <CSpinner size="sm" className="me-1" /> : null}Refresh
                  </CButton>

                  <CButton size="sm" color="dark" onClick={() => setBuilderOpen(true)}>
                    Quick Add (Builder)
                  </CButton>

                  <CButton size="sm" color="info" onClick={autoplan} disabled={pkLoading}>
                    {pkLoading ? <CSpinner size="sm" className="me-1" /> : null}Auto-plan (1 per unit)
                  </CButton>

                  <CButton
                    size="sm"
                    color="secondary"
                    onClick={() => {
                      // brand-new empty package is owned by current user
                      addEmptyPackage()
                      setPackagesArr(prev => {
                        const copy = [...prev]
                        const last = copy[copy.length - 1]
                        copy[copy.length - 1] = { ...last, createdBy: currentUserId }
                        return copy
                      })
                    }}
                    disabled={pkLoading}
                  >
                    + Add Empty Package
                  </CButton>

                  {/* Save only NEW packages (no _id) */}
                  <CButton
                    size="sm"
                    color="success"
                    onClick={async () => {
                      const v = validatePackages()
                      if (v) { setPkError(v); return }
                      const newOnes = packagesArr.filter(p => !p?._id)
                      if (newOnes.length === 0) { setPkError('Nothing new to save. Add a new package first.'); return }
                      setPkSaving(true); setPkError('')
                      try {
                        const payload = {
                          packages: newOnes.map((p) => ({
                            boxType: p.boxType,
                            inner: {
                              length: Number(p.inner.length),
                              width: Number(p.inner.width),
                              height: Number(p.inner.height),
                              unit: p.inner.unit || 'cm',
                            },
                            weightKg: Number(p.weightKg),
                            contents: (p.contents || []).map((c) => ({
                              lineIndex: Number(c.lineIndex),
                              sku: c.sku || (orderedLines[c.lineIndex]?.sku || ''),
                              quantity: Number(c.quantity),
                              carrierCode: c.carrierCode || undefined,
                            })),
                            selectionId: p.selectionId || null,
                            carrierCode: p.carrierCode || null,
                            // optional: stamp creator (server may ignore/override)
                            createdBy: currentUserId || undefined,
                          })),
                        }
                        const res = await apiSavePackages(order.orderNo, payload)
                        const arr = Array.isArray(res?.packages) ? res.packages : []
                        const sum = Array.isArray(res?.summary) ? res.summary : []
                        setPackagesArr(arr); setPkgSummary(sum)
                        setPkTotalWeight(Number(res?.totalWeight ?? arr.reduce((s, p) => s + (Number(p.weightKg) || 0), 0)))
                        if (typeof fetchOrders === 'function') await fetchOrders()
                      } catch (e) {
                        setPkError(pickErr(e, 'Failed to save packages'))
                      } finally {
                        setPkSaving(false)
                      }
                    }}
                    disabled={pkSaving || pkLoading}
                  >
                    {pkSaving ? <CSpinner size="sm" className="me-1" /> : null}Save Packages
                  </CButton>

                  {/* Bulk carrier: apply to all packages (all / missing-only) */}
                  <div className="d-flex align-items-end gap-2">
                    <div>
                      <div className="text-muted small mb-1">Set Carrier for Packages</div>
                      <div className="d-flex gap-2">
                        <CFormSelect
                          size="sm"
                          value={bulkCarrierCode}
                          onChange={(e) => setBulkCarrierCode(e.target.value)}
                          style={{ minWidth: 220 }}
                        >
                          <option value="">— choose carrier —</option>
                          {carriers.map((c) => (
                            <option key={c._id || c.code} value={c.code}>
                              {(c.name || c.title || c.code) + (c.code ? ` (${c.code})` : '')}
                            </option>
                          ))}
                        </CFormSelect>
                        <CFormSelect
                          size="sm"
                          value={bulkCarrierMode}
                          onChange={(e) => setBulkCarrierMode(e.target.value)}
                          style={{ width: 150 }}
                        >
                          <option value="all">all</option>
                          <option value="missing-only">missing-only</option>
                        </CFormSelect>
                        <CButton
                          size="sm"
                          color="primary"
                          disabled={!order?.orderNo || !bulkCarrierCode || bulkCarrierBusy}
                          onClick={async () => {
                            if (!order?.orderNo || !bulkCarrierCode) return
                            setPkError('')
                            setBulkCarrierBusy(true)
                            try {
                              await packageService.selectCarrierForPackages(order.orderNo, {
                                carrierCode: bulkCarrierCode,
                                mode: bulkCarrierMode || 'all',
                              })
                              await loadPackages()
                            } catch (e) {
                              setPkError(pickErr(e, 'Failed to set carrier for packages'))
                            } finally {
                              setBulkCarrierBusy(false)
                            }
                          }}
                        >
                          {bulkCarrierBusy ? <CSpinner size="sm" className="me-1" /> : null}
                          Apply
                        </CButton>
                      </div>
                    </div>
                  </div>

                  {/* Bulk labels (always regenerate:true) */}
                  <CButton
                    size="sm"
                    color="primary"
                    disabled={!order?.orderNo || bulkLabelBusy}
                    onClick={async () => {
                      if (!order?.orderNo) return
                      setPkError('')
                      setBulkLabelInfo(null)
                      setBulkLabelBusy(true)
                      try {
                        const raw = await packageService.generateAllPackageLabels(order.orderNo, { regenerate: true })
                        const norm = normalizeBulkLabelResult(raw)
                        setBulkLabelInfo(norm)

                        let success = 0, failed = 0
                        for (let i = 0; i < norm.generated.length; i++) {
                          const g = norm.generated[i]
                          const url = g?.label?.pdfUrl || g?.pdfUrl
                          if (!url) { failed++; continue }
                          const code = g?.label?.code || ''
                          const fnameParts = ['label', order.orderNo, g?.packageId || String(i + 1), code || null].filter(Boolean)
                          const filename = `${fnameParts.join('_')}.pdf`
                          try {
                            await downloadProtectedPdf(url, filename)
                            success++
                            await new Promise(r => setTimeout(r, 120))
                          } catch {
                            failed++
                          }
                        }

                        if (success === 0 && norm.urls?.length) {
                          setPkError('Your browser may be blocking multiple downloads. A page with label links will open—click each to download, or allow multiple downloads for this site in your browser settings.')
                          const w = window.open('', '_blank')
                          if (w && w.document) {
                            const listHtml = norm.generated
                              .map((g, idx) => {
                                const u = g?.label?.pdfUrl || g?.pdfUrl || '#'
                                const absolute = u.startsWith('http') ? u : `${SERVER_URL}${u}`
                                const code = g?.label?.code || ''
                                const name = `label_${order.orderNo}_${g?.packageId || (idx + 1)}${code ? '_' + code : ''}.pdf`
                                return `<li><a href="${absolute}" target="_blank" rel="noopener">${name}</a></li>`
                              })
                              .join('')
                            w.document.write(
                              `<html><head><title>Labels for ${order.orderNo}</title></head><body>
                        <h3>Labels for Order ${order.orderNo}</h3>
                        <p>Click each link to download. If links 403, you may need to sign in on this tab first.</p>
                        <ol>${listHtml}</ol>
                      </body></html>`
                            )
                            w.document.close()
                          }
                        }

                        await loadPackages()
                      } catch (e) {
                        setPkError(pickErr(e, 'Failed to generate labels for all packages'))
                      } finally {
                        setBulkLabelBusy(false)
                      }
                    }}
                  >
                    {bulkLabelBusy ? <CSpinner size="sm" className="me-1" /> : null}
                    Generate All Labels
                  </CButton>
                </div>
              </div>

              {/* quick summary */}
              <div className="mb-2 small text-muted">
                <strong>Total Weight:</strong> {packagesArr.reduce((s, p) => s + (Number(p.weightKg) || 0), 0)} kg
                {' • '}
                <strong>Packages:</strong> {packagesArr.length}
              </div>

              {/* remaining per line chips */}
              <div className="mb-3 d-flex flex-wrap gap-2">
                {orderedLines.map((it, idx) => (
                  <span key={`rem-${idx}`} className={`rem-chip ${lineRemaining(idx) === 0 ? 'ok' : ''}`}>
                    <span className="sku">{it.sku || `Line ${idx + 1}`}</span>
                    <span className="vals">{(allocatedMap.get(idx) || 0)}/{it.quantity}</span>
                  </span>
                ))}
              </div>

              {/* bulk label summary */}
              {!!bulkLabelInfo && (
                <CAlert color={(Array.isArray(bulkLabelInfo.errors) && bulkLabelInfo.errors.length) ? 'warning' : 'success'} className="mb-3">
                  <div><strong>Bulk label result</strong></div>
                  <div className="mt-1">
                    Generated: <strong>{Array.isArray(bulkLabelInfo.generated) ? bulkLabelInfo.generated.length : 0}</strong>
                    {' • '}
                    Skipped: <strong>{Array.isArray(bulkLabelInfo.skipped) ? bulkLabelInfo.skipped.length : 0}</strong>
                    {' • '}
                    Errors: <strong>{Array.isArray(bulkLabelInfo.errors) ? bulkLabelInfo.errors.length : 0}</strong>
                  </div>
                </CAlert>
              )}

              {pkLoading ? (
                <div className="text-center py-3"><CSpinner /></div>
              ) : (
                <>
                  {!packagesArr.length && (
                    <CAlert color="light">No packages yet. Use <strong>Auto-plan</strong> or <strong>+ Add Empty Package</strong>.</CAlert>
                  )}

                  <div className="pkg-grid">
                    {packagesArr.map((p, i) => {
                      const editable = canEditPkg(p)
                      const creator =
                        p?.createdByName
                          ? p.createdByName
                          : String(p?.createdBy || '') === String(currentUserId || '')
                            ? 'You'
                            : (p?.createdBy ? `User ${String(p.createdBy).slice(-4)}` : '—')

                      return (
                        <div key={`pkg-${i}`} className={`pkg-card ${editable ? '' : 'pkg-locked'}`}>
                          <div className="pkg-head">
                            <div className="title">
                              Package #{i + 1}
                              {' '}
                              {editable ? (
                                <CBadge color="success" className="ms-2">Editable</CBadge>
                              ) : (
                                <CBadge color="secondary" className="ms-2">Locked</CBadge>
                              )}
                              <CBadge color="dark" className="ms-2">Created by: {creator}</CBadge>
                            </div>
                            <div className="actions">
                              <CButton
                                size="sm"
                                color="secondary"
                                variant="outline"
                                onClick={() => editable && duplicatePackage(i)}
                                disabled={!editable}
                              >
                                Duplicate
                              </CButton>
                              <CButton
                                size="sm"
                                color="danger"
                                variant="outline"
                                onClick={() => removePackageGuarded(i)}
                                disabled={!editable}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </div>

                          <div className="pkg-row">
                            <CFormInput
                              label="Box type"
                              value={p.boxType}
                              onChange={(e) => editable && setPkgField(i, 'boxType', e.target.value)}
                              disabled={!editable}
                            />
                            <div className="w-100" />
                            <div className="d-flex align-items-end gap-2">
                              <div>
                                <div className="small text-muted mb-1">Apply preset</div>
                                <CFormSelect
                                  size="sm"
                                  value=""
                                  disabled={loadingPresets || !editable}
                                  onChange={(e) => { if (e.target.value && editable) applyPresetToPackage(i, e.target.value) }}
                                  style={{ minWidth: 240 }}
                                >
                                  <option value="">{loadingPresets ? 'Loading presets…' : (presets.length ? '— choose preset —' : 'No presets found')}</option>
                                  {presets.map((pr) => (
                                    <option key={pr._id} value={pr._id}>
                                      {pr.name}
                                      {pr.dimensions?.length && pr.dimensions?.width && pr.dimensions?.height
                                        ? ` (${pr.dimensions.length}×${pr.dimensions.width}×${pr.dimensions.height} ${pr.dimensions.unit || 'cm'})`
                                        : ''}
                                    </option>
                                  ))}
                                </CFormSelect>
                              </div>
                              <CButton size="sm" color="secondary" variant="outline" onClick={fetchPresets} disabled={loadingPresets}>
                                {loadingPresets ? <CSpinner size="sm" className="me-1" /> : null}Reload
                              </CButton>
                            </div>
                          </div>

                          <div className="pkg-row">
                            <div className="dim">
                              <label className="form-label">Inner (L × W × H)</label>
                              <div className="d-flex gap-2">
                                <CFormInput placeholder="L" value={p.inner?.length} onChange={(e) => editable && setInnerField(i, 'length', e.target.value)} disabled={!editable} />
                                <CFormInput placeholder="W" value={p.inner?.width} onChange={(e) => editable && setInnerField(i, 'width', e.target.value)} disabled={!editable} />
                                <CFormInput placeholder="H" value={p.inner?.height} onChange={(e) => editable && setInnerField(i, 'height', e.target.value)} disabled={!editable} />
                                <CFormSelect value={p.inner?.unit || 'cm'} onChange={(e) => editable && setInnerField(i, 'unit', e.target.value)} style={{ maxWidth: 110 }} disabled={!editable}>
                                  <option value="cm">cm</option><option value="in">in</option><option value="mm">mm</option>
                                </CFormSelect>
                              </div>
                            </div>
                            <div className="wgt">
                              <CFormInput
                                label="Weight (kg)"
                                type="number"
                                step="0.1"
                                value={p.weightKg}
                                onChange={(e) => editable && setPkgField(i, 'weightKg', e.target.value)}
                                disabled={!editable}
                              />
                            </div>
                          </div>

                          <div className="pkg-row">
                            <div className="w-100">
                              <label className="form-label">Package Carrier</label>
                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                <CFormSelect
                                  value={p.carrierCode || ''}
                                  onChange={(e) => editable && setPkgField(i, 'carrierCode', e.target.value)}
                                  style={{ maxWidth: 320 }}
                                  disabled={!editable}
                                >
                                  <option value="">— Choose a carrier —</option>
                                  {carriers.map((c) => (
                                    <option key={c._id || c.code} value={c.code}>
                                      {(c.name || c.title || c.code) + (c.code ? ` (${c.code})` : '')}
                                    </option>
                                  ))}
                                </CFormSelect>
                                <CButton size="sm" color="primary" disabled={!editable || !p._id || !p.carrierCode} onClick={() => editable && savePackageCarrier(p)}>
                                  Save to package
                                </CButton>
                                {(() => {
                                  const key = pkgKey(p, i)
                                  const busy = !!pkgLabelBusy[key]
                                  const hasUrl = !!pkgLabelUrl[key]
                                  return (
                                    <>
                                      <CButton size="sm" color="success" disabled={!editable || !p._id || busy} onClick={() => editable && genPackageLabel(p, i)}>
                                        {busy ? <><CSpinner size="sm" className="me-1" />Generating…</> : 'Generate Label'}
                                      </CButton>
                                      {hasUrl && (
                                        <CButton
                                          size="sm"
                                          color="primary"
                                          variant="outline"
                                          onClick={() =>
                                            downloadProtectedPdf(
                                              pkgLabelUrl[key],
                                              `label_${order.orderNo}_${p._id || i}.pdf`
                                            )
                                          }
                                        >
                                          <CIcon icon={cilPrint} className="me-1" /> Download Label
                                        </CButton>
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                              <div className="small text-muted mt-1">
                                Tip: You can generate labels when order status is <code>PREPARED</code>, <code>AWAITING_PICKUP</code>, or <code>IN_TRANSIT</code> (Royal Box bypasses this gate).
                              </div>
                            </div>
                          </div>

                          <div className="pkg-row">
                            <div className="w-100">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="fw-semibold">Contents</div>
                                <div className="text-muted small">Allocate quantities to this package.</div>
                              </div>

                              {(p.contents || []).length === 0 ? (
                                <CAlert color="light" className="mb-2">No items yet.</CAlert>
                              ) : (
                                <div className="contents-scroll">
                                  <CTable small striped>
                                    <CTableHead>
                                      <CTableRow>
                                        <CTableHeaderCell>SKU / Product</CTableHeaderCell>
                                        <CTableHeaderCell className="t-center">Ordered</CTableHeaderCell>
                                        <CTableHeaderCell className="t-center">Allocated</CTableHeaderCell>
                                        <CTableHeaderCell className="t-center">This Pkg</CTableHeaderCell>
                                        <CTableHeaderCell className="t-center">Remaining</CTableHeaderCell>
                                        <CTableHeaderCell className="t-center" style={{ width: 120 }}>Remove</CTableHeaderCell>
                                      </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                      {(p.contents || []).map((c, idxRow) => {
                                        const li = Number(c.lineIndex)
                                        const ord = lineOrderedQty(li)
                                        const alloc = allocatedMap.get(li) || 0
                                        const remainingIfZero = Math.max(0, ord - (alloc - (Number(c.quantity) || 0)))
                                        return (
                                          <CTableRow key={`c-${i}-${li}-${idxRow}`}>
                                            <CTableDataCell>
                                              <div className="fw-semibold">{orderedLines[li]?.sku || `Line ${li + 1}`}</div>
                                              <div className="text-muted small">{orderedLines[li]?.productName || '—'}</div>
                                            </CTableDataCell>
                                            <CTableDataCell className="t-center">{ord}</CTableDataCell>
                                            <CTableDataCell className="t-center">{alloc}</CTableDataCell>
                                            <CTableDataCell className="t-center">
                                              <div className="qty-stepper">
                                                <button type="button" className="step" onClick={() => editable && setContentQty(i, li, Math.max(0, Number(c.quantity || 0) - 1))} disabled={!editable}>-</button>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={Number(c.quantity) || 0}
                                                  onChange={(e) => editable && setContentQty(i, li, e.target.value)}
                                                  disabled={!editable}
                                                />
                                                <button type="button" className="step" onClick={() => editable && upsertContentQty(i, li, 1)} disabled={!editable}>+</button>
                                              </div>
                                            </CTableDataCell>
                                            <CTableDataCell className="t-center">{remainingIfZero}</CTableDataCell>
                                            <CTableDataCell className="t-center">
                                              <CButton size="sm" color="danger" variant="outline" onClick={() => editable && removeContent(i, li)} disabled={!editable}>
                                                <CIcon icon={cilTrash} />
                                              </CButton>
                                            </CTableDataCell>
                                          </CTableRow>
                                        )
                                      })}
                                    </CTableBody>
                                  </CTable>
                                </div>
                              )}

                              <AddLineToPackage
                                orderedLines={orderedLines}
                                allocatedMap={allocatedMap}
                                onAdd={(lineIndex, qty) => {
                                  if (!canEditPkg(p)) return
                                  if (qty <= 0) return
                                  const rem = lineRemaining(Number(lineIndex))
                                  const q = Math.min(qty, rem)
                                  if (q > 0) {
                                    setContentQty(
                                      i,
                                      Number(lineIndex),
                                      q + ((packagesArr[i].contents || []).find(c => Number(c.lineIndex) === Number(lineIndex))?.quantity || 0)
                                    )
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* styles */}
              <style>{`
        .pkg-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap:12px; }
        .pkg-card { background:#151a1f; border:1px solid #2a2f35; border-radius:12px; padding:12px; max-height:70vh; overflow:auto; }
        .pkg-card.pkg-locked { opacity:.9; }
        .pkg-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; position:sticky; top:0; background:#151a1f; z-index:1; padding-top:4px; }
        .pkg-head .title { font-weight:700; display:flex; align-items:center; gap:.4rem; flex-wrap:wrap; }
        .pkg-row { display:flex; gap:12px; margin-top:10px; flex-wrap:wrap; }
        .pkg-row .dim { flex: 1 1 420px; }
        .pkg-row .wgt { width:220px; }
        .rem-chip { display:inline-flex; gap:6px; align-items:center; padding:.25rem .5rem; border-radius:999px; background:#232a31; border:1px solid #2f3640; font-size:.8rem; }
        .rem-chip.ok { background:#14281a; border-color:#1d4f32; color:#bfe8c9; }
        .rem-chip .sku { font-weight:700; }
        .qty-stepper { display:inline-flex; gap:.35rem; align-items:center; }
        .qty-stepper .step { width:28px; height:28px; border-radius:8px; border:1px solid #2a2f35; background:#1a1e23; color:#e6ebef; }
        .qty-stepper input { width:70px; height:28px; background:#0f1317; border:1px solid #2a2f35; border-radius:6px; color:#e6ebef; text-align:center; }
        .contents-scroll { max-height: 48vh; overflow:auto; }
        .contents-scroll table { min-width: 820px; }
      `}</style>
            </>
          )
        })()}

        {tab === 'presets' && (
          <>
            {/* Add Preset form */}
            <CCard className="mb-3">
              <CCardHeader><strong>Add Box Preset</strong></CCardHeader>
              <CCardBody>
                <PresetForm
                  onCreated={async () => {
                    // Refresh the list after successful creation
                    await fetchPresets()
                  }}
                />
              </CCardBody>
            </CCard>

            {/* Existing Presets */}
            <CCard>
              <CCardHeader className="d-flex align-items-center justify-content-between">
                <strong>Saved Presets</strong>
                <div className="d-flex align-items-center gap-2">
                  <CButton size="sm" color="secondary" variant="outline" onClick={fetchPresets} disabled={loadingPresets}>
                    {loadingPresets ? <CSpinner size="sm" className="me-1" /> : null}
                    Refresh
                  </CButton>
                </div>
              </CCardHeader>
              <CCardBody>
                {presetsError && <CAlert color="danger" className="mb-3">{presetsError}</CAlert>}
                {loadingPresets ? (
                  <div className="text-center py-4"><CSpinner /></div>
                ) : presets.length === 0 ? (
                  <CAlert color="light" className="mb-0">No presets yet. Add one above.</CAlert>
                ) : (
                  <CTable striped responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>#</CTableHeaderCell>
                        <CTableHeaderCell>Name</CTableHeaderCell>
                        <CTableHeaderCell>Dimensions (L × W × H)</CTableHeaderCell>
                        <CTableHeaderCell>Unit</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Weight</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {presets.map((p, i) => (
                        <CTableRow key={p._id || p.id || i}>
                          <CTableDataCell>{i + 1}</CTableDataCell>
                          <CTableDataCell className="fw-semibold">{p.name || p.boxType || `Preset ${i + 1}`}</CTableDataCell>
                          <CTableDataCell>
                            {(p.dimensions?.length ?? p.inner?.length ?? '—')}
                            {' × '}
                            {(p.dimensions?.width ?? p.inner?.width ?? '—')}
                            {' × '}
                            {(p.dimensions?.height ?? p.inner?.height ?? '—')}
                          </CTableDataCell>
                          <CTableDataCell>{p.dimensions?.unit || p.inner?.unit || 'cm'}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            {p.weight ?? p.weightKg ?? '—'}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                )}
              </CCardBody>
            </CCard>
          </>
        )}


        {/* {tab === 'carrier' && (
          <>
            {splitActive && <CAlert color="warning" className="mb-3">Per-line selections exist for this order. You can still set a whole-order carrier here, but classic single-label generation is disabled while per-line is active.</CAlert>}
            {carriersError && <CAlert color="danger" className="mb-3">{carriersError}</CAlert>}
            {carrierSavedMsg && <CAlert color="success" className="mb-3">{carrierSavedMsg}</CAlert>}

            <CForm onSubmit={(e) => { e.preventDefault(); saveCarrierOnly() }}>
              <CRow className="g-3 align-items-end">
                <CCol md={8}>
                  <label className="form-label">Select Carrier (whole order)</label>
                  <CFormSelect value={carrierCode} onChange={(e) => setCarrierCode(e.target.value)} disabled={carriersLoading}>
                    <option value="">{carriersLoading ? 'Loading…' : '— Choose a carrier —'}</option>
                    {carriers.map((c) => (
                      <option key={c._id || c.code} value={c.code}>
                        {(c.name || c.title || c.code) + (c.code ? ` (${c.code})` : '')}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="text-end">
                  <CButton color="primary" disabled={!carrierCode || carriersLoading || savingCarrier} onClick={saveCarrierOnly}>
                    {savingCarrier ? <CSpinner size="sm" /> : 'Save Carrier'}
                  </CButton>
                  <CButton color="secondary" variant="outline" className="ms-2" onClick={() => { setCarriers([]); setCarriersError(''); ensureCarriers() }} disabled={carriersLoading}>Refresh</CButton>
                </CCol>
              </CRow>
            </CForm>
          </>
        )} */}

        {/* {tab === 'split' && (
          <>
            {lcError && <CAlert color="danger" className="mb-3">{lcError}</CAlert>}
            {lcLoading ? (
              <div className="text-center py-3"><CSpinner /></div>
            ) : (
              <>
                <h6 className="mb-2">Current Selections</h6>
                {lcSelections.length === 0 ? (
                  <CAlert color="light">No per-line selections saved yet.</CAlert>
                ) : (
                  <CTable striped responsive className="mb-3">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Line</CTableHeaderCell>
                        <CTableHeaderCell>SKU / Product</CTableHeaderCell>
                        <CTableHeaderCell className="t-center">Qty</CTableHeaderCell>
                        <CTableHeaderCell>Carrier</CTableHeaderCell>
                        <CTableHeaderCell>Status</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {lcSelections.map((s, i) => {
                        const it = order.items?.[s.lineIndex]
                        return (
                          <CTableRow key={s._id || `sel-${i}`}>
                            <CTableDataCell>#{s.lineIndex + 1}</CTableDataCell>
                            <CTableDataCell>
                              <div className="fw-semibold">{it?.sku || '—'}</div>
                              <div className="text-muted small">{it?.productName || '—'}</div>
                            </CTableDataCell>
                            <CTableDataCell className="t-center">{s.quantity}</CTableDataCell>
                            <CTableDataCell>{s.carrierCode}</CTableDataCell>
                            <CTableDataCell><CBadge color="secondary">{s.status || 'SAVED'}</CBadge></CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                )}

                <h6 className="mb-2">Assign & Save (Per-line)</h6>
                <CTable responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Line</CTableHeaderCell>
                      <CTableHeaderCell>SKU / Product</CTableHeaderCell>
                      <CTableHeaderCell className="t-center">Ordered</CTableHeaderCell>
                      <CTableHeaderCell className="t-center">Allocated</CTableHeaderCell>
                      <CTableHeaderCell className="t-center">Remaining</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 240 }}>Carrier</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 160 }} className="t-center">Quantity</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 260 }} className="t-center">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredSplitIndices.map((idx) => {
                      const it = order.items[idx]
                      const total = Number(it.quantity || 0)
                      const allocated = Number(lcRemaining[idx]?.allocated ?? 0)
                      const remaining = Number(lcRemaining[idx]?.remaining ?? total)
                      const draft = lcDraft[idx] || { quantity: '', carrierCode: '' }
                      const maxRem = Number(remaining)
                      const busy = lineBusy[idx] || { saving: false, labeling: false }
                      return (
                        <CTableRow key={`lc-${idx}`}>
                          <CTableDataCell>#{idx + 1}</CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{it.sku || '—'}</div>
                            <div className="text-muted small">{it.productName || '—'}</div>
                          </CTableDataCell>
                          <CTableDataCell className="t-center">{total}</CTableDataCell>
                          <CTableDataCell className="t-center">{allocated}</CTableDataCell>
                          <CTableDataCell className="t-center">{remaining}</CTableDataCell>
                          <CTableDataCell>
                            <CFormSelect value={draft.carrierCode} onChange={(e) => setDraftField(idx, 'carrierCode', e.target.value)}>
                              <option value="">— Choose —</option>
                              {carriers.map((c) => (
                                <option key={c._id || c.code} value={c.code}>
                                  {(c.name || c.title || c.code) + (c.code ? ` (${c.code})` : '')}
                                </option>
                              ))}
                            </CFormSelect>
                          </CTableDataCell>
                          <CTableDataCell className="t-center">
                            <div className="qty-stepper">
                              <button type="button" className="step" onClick={() => setDraftField(idx, 'quantity', Math.max(0, Number(draft.quantity || 0) - 1))}>-</button>
                              <input
                                type="number"
                                min="0"
                                max={maxRem}
                                value={draft.quantity}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.min(maxRem, Number(e.target.value) || 0))
                                  setDraftField(idx, 'quantity', v)
                                }}
                                style={{ width: 70, textAlign: 'center' }}
                              />
                              <button type="button" className="step" onClick={() => setDraftField(idx, 'quantity', Math.min(maxRem, Number(draft.quantity || 0) + 1))}>+</button>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="t-center">
                            <div className="d-flex justify-content-center gap-2 flex-wrap">
                              <CButton size="sm" color="primary" disabled={busy.saving} onClick={() => saveLineSelection(idx)}>
                                {busy.saving ? <CSpinner size="sm" className="me-1" /> : null}
                                Save
                              </CButton>
                              <CButton
                                size="sm"
                                color="success"
                                disabled={busy.labeling}
                                onClick={async () => {
                                  setLineBusy((b) => ({ ...b, [idx]: { ...(b[idx] || {}), labeling: true } }))
                                  try {
                                    const result = await saveLineSelection(idx)
                                    if (result?.selectionId) {
                                      const lab = await apiCreateLineSelectionLabel(order.orderNo, result.selectionId)
                                      const url = lab?.label?.pdfUrl || lab?.pdfUrl
                                      if (url) window.open(`${SERVER_URL}${url}`, '_blank')
                                    } else {
                                      await labelLatestForLine(idx)
                                    }
                                  } catch (err) {
                                    setLcError(pickErr(err, 'Failed to generate label for this line'))
                                  } finally {
                                    setLineBusy((b) => ({ ...b, [idx]: { ...(b[idx] || {}), labeling: false } }))
                                  }
                                }}
                              >
                                {busy.labeling ? <CSpinner size="sm" className="me-1" /> : null}
                                Save & Generate PDF
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                  </CTableBody>
                </CTable>

                <CAlert color="light" className="mt-3">
                  <small>Notes: Carriers must be active. If you exceed remaining qty you’ll get a 409. Use mode=<code>replace</code> only if you intend to overwrite all selections.</small>
                </CAlert>
              </>
            )}
          </>
        )} */}

        {tab === 'plan' && (
          <CRow className="g-3"></CRow>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" size="sm" onClick={onClose}>Close</CButton>
      </CModalFooter>

      <style>{`
        .details-modal .modal-content { animation: modalPop .14s ease-out; }
        @keyframes modalPop { from { transform: scale(.98); opacity: .6; } to { transform: scale(1); opacity: 1; } }
        .t-center { text-align:center; }
        .rb-list { display:flex; flex-direction:column; gap:10px; }
        .rb-card { border:1px solid #2a2f35; border-radius:12px; background:#12161b; }
        .rb-head { width:100%; display:flex; gap:12px; align-items:center; padding:10px 12px; border:none; background:transparent; text-align:left; cursor:pointer; }
        .rb-head .chev { transition: transform .15s ease; }
        .rb-head .chev.open { transform: rotate(90deg); }
        .rb-head .meta .title { font-weight:700; }
        .rb-body { padding: 0 12px 12px; }
      `}</style>
    </CModal>
  )
}






/* ===== Helper: AddLineToPackage (mini picker) ===== */
function AddLineToPackage({ orderedLines, allocatedMap, onAdd }) {
  const [lineIndex, setLineIndex] = React.useState('')
  const [qty, setQty] = React.useState(1)
  const ord = lineIndex === '' ? 0 : Number(orderedLines?.[lineIndex]?.quantity || 0)
  const alloc = lineIndex === '' ? 0 : Number(allocatedMap?.get(Number(lineIndex)) || 0)
  const remaining = Math.max(0, ord - alloc)
  return (
    <div className="d-flex gap-2 align-items-end mt-2">
      <div style={{ minWidth: 260 }}>
        <label className="form-label mb-1">Add line</label>
        <CFormSelect value={lineIndex} onChange={(e) => { setLineIndex(e.target.value); setQty(1) }}>
          <option value="">— choose line —</option>
          {(orderedLines || []).map((it, idx) => (
            <option key={idx} value={idx}>
              {(it.sku || `Line ${idx + 1}`)} • ordered {it.quantity} • allocated {allocatedMap.get(idx) || 0}
            </option>
          ))}
        </CFormSelect>
      </div>
      <div style={{ width: 120 }}>
        <label className="form-label mb-1">Qty</label>
        <CFormInput
          type="number"
          min={1}
          max={Math.max(1, remaining)}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(Number(e.target.value) || 1, Math.max(1, remaining))))}
        />
        <div className="small text-muted mt-1">Remaining: {remaining}</div>
      </div>
      <div className="pb-1">
        <CButton size="sm" color="primary" disabled={lineIndex === '' || remaining <= 0} onClick={() => onAdd(Number(lineIndex), Number(qty) || 0)}>
          Add line
        </CButton>
      </div>
    </div>
  )
}

/* =========================
   NextStatusModal (non-royal)
   ========================= */
const NextStatusModal = ({ visible, onClose, order, onUpdated }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState('')
  const [note, setNote] = useState('Received at WH')
  const [submitting, setSubmitting] = useState(false)

  const pickErr = (e, fb = 'Something went wrong') => {
    const data = e?.response?.data
    return (
      (typeof data?.error === 'string' && data.error) ||
      data?.error?.message ||
      data?.message ||
      e?.message ||
      fb
    )
  }

  useEffect(() => {
    if (!visible || !order?.orderNo) return
      ; (async () => {
        setLoading(true); setError(''); setOptions([]); setSelected('')
        try {
          const res = await orderService.getNextStatuses(order.orderNo)
          const arr = res?.next || []
          setOptions(arr)
          setSelected(arr[0] || '')
        } catch (e) {
          setError(pickErr(e, 'Failed to fetch next steps'))
        } finally {
          setLoading(false)
        }
      })()
  }, [visible, order?.orderNo])

  const confirm = async () => {
    if (!selected) return
    setSubmitting(true); setError('')
    try {
      await orderService.scanStatus(order.orderNo, {
        status: selected,
        note: note || 'Received at WH',
        enforceTransitions: true,
        dedupe: 'error',
      })
      onClose()
      if (typeof onUpdated === 'function') await onUpdated()
    } catch (e) {
      setError(pickErr(e, 'Failed to update status'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader closeButton>
        <CModalTitle>Next step • Order #{order?.orderNo}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center py-3"><CSpinner /></div>
        ) : error ? (
          <CAlert color="danger">{error}</CAlert>
        ) : options.length === 0 ? (
          <CAlert color="warning">No next steps available.</CAlert>
        ) : (
          <>
            <div className="mb-3">
              <div className="fw-semibold mb-2">Choose next status:</div>
              <div className="d-flex flex-column gap-2">
                {options.map((s) => (
                  <label key={s} className={`ns-opt ${selected === s ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="next-status"
                      value={s}
                      checked={selected === s}
                      onChange={() => setSelected(s)}
                    />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label">Note (optional)</label>
              <CFormInput
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this transition"
              />
            </div>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" disabled={!selected || submitting || loading} onClick={confirm}>
          {submitting ? <CSpinner size="sm" /> : 'Confirm'}
        </CButton>
      </CModalFooter>
      <style>{`
        .ns-opt {
          display:flex; align-items:center; gap:.6rem; padding:.5rem .7rem; border:1px solid #2f3338;
          background:#1a1e22; border-radius:8px; cursor:pointer;
        }
        .ns-opt.active { border-color:#0d6efd; box-shadow:0 0 0 2px rgba(13,110,253,.2); }
        .ns-opt input { accent-color:#0d6efd; }
      `}</style>
    </CModal>
  )
}

/* =========================
   AssignModal (admin only)
   ========================= */
const AssignModal = ({ visible, onClose, onSubmitSingle, onSubmitRoyal, users, order, submitting }) => {
  const isRoyal = !!order?.isRoyalBox
  const [filter, setFilter] = useState('')
  const [userSingle, setUserSingle] = useState('')
  const [userA, setUserA] = useState('')
  const [userB, setUserB] = useState('')

  useEffect(() => {
    if (visible) {
      setFilter('')
      setUserSingle('')
      setUserA('')
      setUserB('')
    }
  }, [visible, order?._id])

  const filteredUsers = useMemo(() => {
    const f = filter.trim().toLowerCase()
    if (!f) return users
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(f) ||
        u.email?.toLowerCase().includes(f) ||
        u.roleId?.name?.toLowerCase().includes(f) ||
        u.warehouseId?.name?.toLowerCase().includes(f),
    )
  }, [users, filter])

  const handleSubmit = async () => {
    if (!order?.orderNo) return
    if (isRoyal) {
      if (!userA || !userB) return
      await onSubmitRoyal(order.orderNo, userA || '', userB || '')
    } else {
      if (!userSingle) return
      await onSubmitSingle(order.orderNo, userSingle || '')
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" className="assign-modal">
      <CModalHeader closeButton><CModalTitle>Assign Order #{order?.orderNo} {isRoyal ? '(Royal Box)' : ''}</CModalTitle></CModalHeader>
      <CModalBody>
        <CRow className="mb-3">
          <CCol md={12}>
            <CInputGroup>
              <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
              <CFormInput placeholder="Search users by name, email, role, warehouse…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </CInputGroup>
          </CCol>
        </CRow>

        {!isRoyal ? (
          <CRow>
            <CCol md={12}>
              <label className="form-label">Assign to</label>
              <CFormSelect value={userSingle} onChange={(e) => setUserSingle(e.target.value)}>
                <option value="">— Select a user (single) —</option>
                {filteredUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} {u.roleId?.name ? `• ${u.roleId.name}` : ''} {u.warehouseId?.name ? `• ${u.warehouseId.name}` : ''}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
        ) : (
          <>
            <CRow className="mb-3">
              <CCol md={12}>
                <label className="form-label">User A</label>
                <CFormSelect value={userA} onChange={(e) => setUserA(e.target.value)}>
                  <option value="">— Select User A —</option>
                  {filteredUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} {u.roleId?.name ? `• ${u.roleId.name}` : ''} {u.warehouseId?.name ? `• ${u.warehouseId?.name}` : ''}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={12}>
                <label className="form-label">User B</label>
                <CFormSelect value={userB} onChange={(e) => setUserB(e.target.value)}>
                  <option value="">— Select User B —</option>
                  {filteredUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} {u.roleId?.name ? `• ${u.roleId.name}` : ''} {u.warehouseId?.name ? `• ${u.warehouseId?.name}` : ''}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Cancel</CButton>
        <CButton color="primary" disabled={submitting || (isRoyal ? (!userA || !userB) : !userSingle)} onClick={handleSubmit}>
          {submitting ? <CSpinner size="sm" /> : isRoyal ? 'Assign (Royal)' : 'Assign'}
        </CButton>
      </CModalFooter>
      <style>{`
        .assign-modal .modal-content { animation: assignPop .12s ease-out; }
        @keyframes assignPop { from { transform: scale(.97); opacity: .7; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </CModal>
  )
}

/* =========================
   ClaimModal (worker/users)
   ========================= */
const ClaimModal = ({ order, visible, onClose, onSubmit, myUserId, submitting, error }) => {
  const [draft, setDraft] = useState({})

  const items = Array.isArray(order?.items) ? order.items : []
  const roleByIndex = Array.isArray(order?.bundleRoleByIndex) ? order.bundleRoleByIndex : []
  const parentLineIdxSet = useMemo(() => {
    const s = new Set()
    roleByIndex.forEach((r, i) => { if (r?.role === 'PARENT') s.add(i) })
    return s
  }, [roleByIndex])
  const childLineIdxSet = useMemo(() => {
    const s = new Set()
    roleByIndex.forEach((r, i) => { if (r?.role === 'CHILD') s.add(i) })
    return s
  }, [roleByIndex])

  const claimableIndices = useMemo(() => {
    if (!items.length) return []
    if (!roleByIndex.length) return items.map((_, i) => i)
    const res = []
    items.forEach((_, i) => {
      if (!childLineIdxSet.has(i)) res.push(i)
    })
    return res
  }, [items, roleByIndex, childLineIdxSet])

  useEffect(() => {
    if (visible && items.length) {
      const d = {}
      claimableIndices.forEach((i) => (d[i] = 0))
      setDraft(d)
    }
  }, [visible, items, claimableIndices])

  const allocations = Array.isArray(order?.itemAllocations) ? order.itemAllocations : []

  const totalClaimedForIndex = (idx) =>
    allocations.filter((a) => a.lineIndex === idx).reduce((s, a) => s + (a.quantity || 0), 0)

  const mineClaimedForIndex = (idx) =>
    allocations.filter((a) => a.lineIndex === idx && a.userId === myUserId).reduce((s, a) => s + (a.quantity || 0), 0)

  const remainingForIndex = (idx) => {
    const it = items[idx]
    if (!it) return 0
    return Math.max(0, (it.quantity || 0) - totalClaimedForIndex(idx))
  }

  const setQty = (idx, val) => {
    const max = remainingForIndex(idx)
    const v = Math.max(0, Math.min(max, Number(val) || 0))
    setDraft((d) => ({ ...d, [idx]: v }))
  }

  const inc = (idx) => setQty(idx, (Number(draft[idx]) || 0) + 1)
  const dec = (idx) => setQty(idx, (Number(draft[idx]) || 0) - 1)
  const max = (idx) => setQty(idx, remainingForIndex(idx))

  const picksPayload = () =>
    Object.entries(draft)
      .map(([k, v]) => ({ lineIndex: Number(k), quantity: Number(v) }))
      .filter((p) => p.quantity > 0)

  const selectedTotal = picksPayload().reduce((s, p) => s + p.quantity, 0)

  const claimAllRemaining = () => {
    const d = {}
    claimableIndices.forEach((idx) => (d[idx] = remainingForIndex(idx)))
    setDraft(d)
  }

  const rowStatus = (idx) => {
    const it = items[idx]
    if (!it) return { label: '—', color: 'secondary' }
    const orderedQty = it.quantity || 0
    const claimed = totalClaimedForIndex(idx)
    if (claimed >= orderedQty) return { label: 'Complete', color: 'success' }
    if (claimed > 0) return { label: 'Partial', color: 'warning' }
    return { label: 'Unclaimed', color: 'secondary' }
  }

  const allComplete = claimableIndices.every((idx) => remainingForIndex(idx) === 0)

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" scrollable className="claim-modal">
      <CModalHeader closeButton><CModalTitle>Claim Items • Order #{order?.orderNo}</CModalTitle></CModalHeader>
      <CModalBody>
        {!order?.isRoyalBox ? (
          <CAlert color="info">Claiming is available for Royal Box orders only.</CAlert>
        ) : (
          <>
            {error ? <CAlert color="danger" className="mb-3">{error}</CAlert> : null}

            {allComplete ? (
              <CAlert color="success" className="mb-3">All items you can claim are already fully claimed.</CAlert>
            ) : (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted small">Only original lines are shown: standalone SKUs and bundle parents. Bundle components are hidden.</div>
                <CButton size="sm" color="secondary" variant="outline" onClick={claimAllRemaining}>Claim All Remaining</CButton>
              </div>
            )}

            <CTable striped responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>SKU / Product</CTableHeaderCell>
                  <CTableHeaderCell className="t-center">Ordered</CTableHeaderCell>
                  <CTableHeaderCell className="t-center">Claimed</CTableHeaderCell>
                  <CTableHeaderCell className="t-center">My Claims</CTableHeaderCell>
                  <CTableHeaderCell className="t-center">Remaining</CTableHeaderCell>
                  <CTableHeaderCell className="t-center">Status</CTableHeaderCell>
                  <CTableHeaderCell className="t-center" style={{ width: 210 }}>Claim Now</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {claimableIndices.map((idx) => {
                  const it = items[idx]
                  const orderedQty = it.quantity || 0
                  const claimed = totalClaimedForIndex(idx)
                  const mine = mineClaimedForIndex(idx)
                  const remaining = Math.max(0, orderedQty - claimed)
                  const val = Number(draft[idx] || 0)
                  const st = rowStatus(idx)
                  const disabled = remaining === 0
                  const isParent = parentLineIdxSet.has(idx)
                  return (
                    <CTableRow key={`claim-${idx}`} className={disabled ? 'row-disabled' : ''}>
                      <CTableDataCell>
                        <div className="fw-semibold">{it.sku || '—'}</div>
                        <div className="text-muted small">{it.productName || '—'}</div>
                        {isParent ? <div className="small"><CBadge color="info">Royal Box</CBadge></div> : null}
                      </CTableDataCell>
                      <CTableDataCell className="t-center">{orderedQty}</CTableDataCell>
                      <CTableDataCell className="t-center">{claimed}</CTableDataCell>
                      <CTableDataCell className="t-center"><span className={`pill ${mine ? 'pill-mine' : ''}`}>{mine}</span></CTableDataCell>
                      <CTableDataCell className="t-center">{remaining}</CTableDataCell>
                      <CTableDataCell className="t-center"><CBadge color={st.color}>{st.label}</CBadge></CTableDataCell>
                      <CTableDataCell className="t-center">
                        <div className="qty-stepper">
                          <button type="button" className="step" onClick={() => dec(idx)} disabled={val <= 0 || disabled}>-</button>
                          <input type="number" min="0" max={remaining} value={val} onChange={(e) => setQty(idx, e.target.value)} disabled={disabled} />
                          <button type="button" className="step" onClick={() => inc(idx)} disabled={val >= remaining || disabled}>+</button>
                          <button type="button" className="max-btn" onClick={() => max(idx)} disabled={disabled}>Max</button>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted">Selected to claim: <strong>{selectedTotal}</strong></div>
              <CButton color="success" disabled={submitting || selectedTotal === 0} onClick={() => onSubmit(picksPayload())}>
                {submitting ? <CSpinner size="sm" className="me-1" /> : null}
                Claim Selected
              </CButton>
            </div>
          </>
        )}
      </CModalBody>
      <CModalFooter><CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton></CModalFooter>
      <style>{`
        .claim-modal .modal-content { animation: modalPop .14s ease-out; }
        @keyframes modalPop { from { transform: scale(.97); opacity: .6; } to { transform: scale(1); opacity: 1; } }
        .row-disabled { opacity: .6; }
      `}</style>
    </CModal>
  )
}


/* =========================
   MyAllocationsModal (worker)
   ========================= */
const MyAllocationsModal = ({ order, visible, onClose }) => {
  const rows = order?.myAllocations || []
  const statusColor = (s = '') => {
    const k = String(s || '').trim().toUpperCase()
    if (k === 'COMPLETED' || k === 'DONE') return 'success'
    if (k === 'STARTED' || k === 'IN_PROGRESS' || k === 'PREPARING') return 'warning'
    if (k === 'CLAIMED' || k === 'ASSIGNED' || !k) return 'info'
    return 'secondary'
  }
  const fmt = (d) => (d ? new Date(d).toLocaleString() : '—')

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" scrollable className="alloc-modal">
      <CModalHeader closeButton><CModalTitle>My Allocations • Order #{order?.orderNo}</CModalTitle></CModalHeader>
      <CModalBody>
        {!rows.length ? (
          <CAlert color="info">No allocations yet for this order.</CAlert>
        ) : (
          <CTable striped responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>SKU / Product</CTableHeaderCell>
                <CTableHeaderCell className="t-center">Quantity</CTableHeaderCell>
                <CTableHeaderCell className="t-center">Status</CTableHeaderCell>
                <CTableHeaderCell className="t-center">Started</CTableHeaderCell>
                <CTableHeaderCell className="t-center">Completed</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((r, i) => (
                <CTableRow key={`alloc-${i}`}>
                  <CTableDataCell>
                    <div className="fw-semibold">{r.sku || '—'}</div>
                    <div className="text-muted small">{r.productName || '—'}</div>
                  </CTableDataCell>
                  <CTableDataCell className="t-center">{r.quantity ?? 0}</CTableDataCell>
                  <CTableDataCell className="t-center"><CBadge color={statusColor(r.status)}>{r.status || '—'}</CBadge></CTableDataCell>
                  <CTableDataCell className="t-center">{fmt(r.startedAt)}</CTableDataCell>
                  <CTableDataCell className="t-center">{fmt(r.completedAt)}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CModalBody>
      <CModalFooter><CButton color="secondary" variant="outline" onClick={onClose}>Close</CButton></CModalFooter>
      <style>{`
        .alloc-modal .modal-content { animation: modalPop .14s ease-out; }
        @keyframes modalPop { from { transform: scale(.97); opacity: .6; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </CModal>
  )
}

/* =========================
   CarrierSelectModal (worker)
   ========================= */
const CarrierSelectModal = ({
  visible,
  onClose,
  carriers,
  loading,
  error,
  selected,
  onSelect,
  onRefresh,
  onConfirm,
  confirming,
  orderNo,
  actionError,
}) => {
  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader closeButton>
        <CModalTitle>Generate Label • Order #{orderNo}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <CSpinner size="sm" /> <span>Loading carriers…</span>
          </div>
        ) : error ? (
          <CAlert color="danger" className="d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <CButton size="sm" color="secondary" variant="outline" onClick={onRefresh}>Retry</CButton>
          </CAlert>
        ) : carriers.length === 0 ? (
          <CAlert color="warning">No active carriers available.</CAlert>
        ) : (
          <div className="d-flex flex-column gap-2">
            {carriers.map((c) => (
              <CFormCheck
                key={c._id || c.code}
                type="radio"
                name="carrier"
                id={`carrier-${c.code}`}
                label={`${c.name} (${c.code})`}
                value={c.code}
                checked={selected === c.code}
                onChange={(e) => onSelect(e.target.value)}
              />
            ))}
            {!!actionError && (
              <CAlert color="danger" className="mt-3">
                {actionError}
                <div className="small text-muted mt-1">
                  Tip: If this asks for packages/boxes, open <strong>Edit</strong> → <strong>Packages</strong> tab to add at least one package, then try again.
                </div>
              </CAlert>
            )}
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose} disabled={confirming}>Cancel</CButton>
        <CButton color="primary" onClick={onConfirm} disabled={!selected || confirming || loading || !!error}>
          {confirming ? <><CSpinner size="sm" className="me-2" />Generating…</> : 'Generate Label'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

/* =========================
   Orders Page
   ========================= */
const Orders = () => {
  // Core server-side state
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [labelError, setLabelError] = useState('')

  // Server-side pagination/sort/filter
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [totalCount, setTotalCount] = useState(0)

  // Search & status (admin)
  const [filter, setFilter] = useState('')
  const [activeStatus, setActiveStatus] = useState(ALL_KEY)

  // Sorting
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortDirection, setSortDirection] = useState('desc')

  // Import Excel (admin)
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)          // ← add this
  const [fileInputKey, setFileInputKey] = useState(0) // ← add this

  // Bulk label (admin)
  const [selectedOrders, setSelectedOrders] = useState([])
  const [labelLoading, setLabelLoading] = useState(false)

  // Details modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  // Claim modal (worker)
  const [claimOrder, setClaimOrder] = useState(null)
  const [claimVisible, setClaimVisible] = useState(false)
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [claimError, setClaimError] = useState('')

  // MyAllocations modal (worker)
  const [allocOrder, setAllocOrder] = useState(null)
  const [allocVisible, setAllocVisible] = useState(false)

  // Next Status modal (non-royal)
  const [nextOrder, setNextOrder] = useState(null)
  const [nextVisible, setNextVisible] = useState(false)

  // [ADD] Manual order (admin)
  const [manualVisible, setManualVisible] = useState(false)

  // Toaster
  const [toasts, setToasts] = useState([])

  // Royal spinner (admin)
  const [markingRoyal, setMarkingRoyal] = useState(new Set())

  // Users cache (admin)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')

  // Assign modal (admin)
  const [assignVisible, setAssignVisible] = useState(false)
  const [assignOrder, setAssignOrder] = useState(null)
  const [assignSubmitting, setAssignSubmitting] = useState(false)

  // Current role + userId
  const [userRole, setUserRole] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')

  // Prep button busy states
  const [starting, setStarting] = useState(new Set())
  const [completing, setCompleting] = useState(new Set())

  // Actions menu (worker only, custom portal)
  const [actionMenu, setActionMenu] = useState({ open: false, x: 0, y: 0, width: 220, orderNo: null })
  const menuRef = useRef(null)

  // ===== Carrier / Label generation (worker) =====
  const [carrierOrder, setCarrierOrder] = useState(null)
  const [carrierVisible, setCarrierVisible] = useState(false)
  const [carriers, setCarriers] = useState([])
  const [carriersLoading, setCarriersLoading] = useState(false)
  const [carriersError, setCarriersError] = useState('')
  const [selectedCarrierCode, setSelectedCarrierCode] = useState('')
  const [labelGeneratingFor, setLabelGeneratingFor] = useState(null)
  const [carrierActionError, setCarrierActionError] = useState('')

  // ===== Cache: does this order have per-line selections? =====
  const [lineSelCache, setLineSelCache] = useState(() => new Map())

  // helpers
  const pushToast = (msg, color = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, color, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }
  const getPaymentBadge = (status) => {
    const map = { paid: 'success', pending: 'warning', failed: 'danger', refunded: 'info' }
    return map[status?.toLowerCase()] || 'secondary'
  }

  const getOrderStatusBadgeColor = (s = '') => {
    const k = String(s || '').trim().toUpperCase()
    if (k === 'PENDING') return 'secondary'
    if (k === 'PREPARING' || k === 'IN_PROGRESS') return 'warning'
    if (k === 'PREPARED') return 'info'
    if (k === 'AWAITING_PICKUP') return 'primary'
    if (k === 'IN_TRANSIT' || k === 'OUT_FOR_DELIVERY') return 'primary'
    if (k === 'DELIVERED') return 'success'
    if (k === 'DELIVERY_FAILED' || k === 'RETURNED' || k === 'CANCELLED') return 'danger'
    if (k === 'ON_HOLD') return 'dark'
    return 'secondary'
  }

  const getTokenLS = () =>
    localStorage.getItem('jwtToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('authToken') ||
    ''

  const decodeJwtSafe = (t) => {
    try {
      const base = t.split('.')[1]
      if (!base) return {}
      const json = JSON.parse(decodeURIComponent(escape(window.atob(base.replace(/-/g, '+').replace(/_/g, '/')))))
      return json || {}
    } catch {
      return {}
    }
  }
  const roleFromToken = () => {
    const t = getTokenLS()
    const p = decodeJwtSafe(t)
    return localStorage.getItem('userRole') || p?.userType || p?.role || ''
  }

  const userIdFromToken = () => {
    const t = getTokenLS()
    const p = decodeJwtSafe(t)
    return p?.user || p?.userId || p?.id || p?._id || p?.uid || p?.sub || ''
  }

  const getErrorMessage = (e, fallback = 'Something went wrong') => {
    const data = e?.response?.data
    return (
      (typeof data?.error === 'string' && data.error) ||
      data?.error?.message ||
      data?.message ||
      e?.message ||
      fallback
    )
  }

  // initial role/user
  useEffect(() => {
    const role =
      localStorage.getItem('userRole') ||
      (typeof authService.getCurrentRoleFromToken === 'function' ? authService.getCurrentRoleFromToken() : roleFromToken())
    const uid =
      typeof authService.getCurrentUserIdFromToken === 'function'
        ? authService.getCurrentUserIdFromToken()
        : userIdFromToken()

    setUserRole(role || '')
    setCurrentUserId(uid || '')

    const rn = (role || '').toLowerCase()
    if (!['user', 'warehouse', 'picker', 'staff'].includes(rn)) fetchUsersOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roleNorm = (userRole || '').toLowerCase()
  const isWorker = ['user', 'warehouse', 'picker', 'staff'].includes(roleNorm)

  // fetch orders on changes
  useEffect(() => { fetchOrders() }, [page, limit, sortBy, sortDirection, activeStatus, filter, userRole]) // eslint-disable-line

  const fetchUsersOnce = async () => {
    setUsersLoading(true); setUsersError('')
    try { setUsers(await userService.getAll()) }
    catch (e) { setUsersError(getErrorMessage(e, 'Failed to load users')) }
    finally { setUsersLoading(false) }
  }

  const usersMap = useMemo(() => {
    const m = new Map()
    users.forEach((u) => m.set(u._id, u))
    return m
  }, [users])

  const initials = (name = '') => {
    const parts = String(name).trim().split(/\s+/)
    const a = (parts[0]?.[0] || '').toUpperCase()
    const b = (parts[1]?.[0] || '').toUpperCase()
    return (a + b || a || '?') || '?'
  }

  const fetchOrders = async () => {
    setLoading(true)
    const rn = (userRole || '').toLowerCase()
    const userIsWorker = ['user', 'warehouse', 'picker', 'staff'].includes(rn)
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortDir: sortDirection,
        q: filter.trim() || undefined,
        status: !userIsWorker && activeStatus !== ALL_KEY ? activeStatus : undefined,
        includeCarriers: userIsWorker ? true : undefined,
      }
      const data = userIsWorker ? await orderService.getMyAssigned(params) : await orderService.getList(params)
      const rawList = data?.orders || data?.results || data?.data || []

      // flatten {order, carrier} wrapper if returned by /my-assigned
      const list = userIsWorker
        ? rawList.map((x) => (x && x.order ? { ...x.order, carrier: x.carrier || x.order?.carrier } : x))
        : rawList

      const total = data?.total ?? data?.count ?? list.length
      setOrders(Array.isArray(list) ? list : [])
      setTotalCount(Number(total) || 0)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load orders'))
    } finally {
      setLoading(false)
    }
  }

  // admin: import
  const handleImport = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a file first')
    setImporting(true)
    try {
      await orderService.importSheet(file)

      // clear everything so the same filename can be re-selected
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileInputKey((k) => k + 1) // force-remount input (extra safety)

      setError('')
      setPage(1)
      await fetchOrders()
    } catch (err) {
      setError(getErrorMessage(err, 'Import failed'))
    } finally {
      setImporting(false)
    }
  }


  // [ADD] Export CSV (admin)
  const csvEscape = (v) => {
    const s = String(v ?? '')
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const exportCsv = () => {
    const headers = [
      'Order #', 'Order Date', 'Customer', 'Mobile', 'Email', 'Country', 'City',
      'Status', 'Carrier', 'Payment', 'Total (SAR)', 'Label Generated', 'Royal Box', 'Assigned To'
    ]
    const rows = (orders || []).map((o) => {
      const assignedIds = Array.from(new Set((o.prepTasks || []).map((t) => t?.assignedTo).filter(Boolean)))
      const assignedNames = assignedIds.map((id) => usersMap.get(id)?.name || id).join('; ')
      const c = o.carrier || {}
      const carrierDisplay = c?.name && c?.code
        ? `${c.name} (${c.code})`
        : (o.carrierName || o.carrierCode || o.shippingCompany || '')
      return [
        o.orderNo,
        o.orderDate ? new Date(o.orderDate).toISOString() : '',
        o.customerName || '',
        o.mobile || '',
        o.email || '',
        o.country || '',
        o.city || '',
        o.currentStatus || o.orderStatus || '',
        carrierDisplay,
        o.paymentMethod || '',
        typeof o.orderTotal === 'number' ? o.orderTotal.toFixed(2) : '',
        o.labelGenerated ? 'yes' : 'no',
        o.isRoyalBox ? 'yes' : 'no',
        assignedNames,
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // sorting
  const ALLOWED_SORT = new Set(['createdAt', 'orderDate', 'orderNo', 'currentStatus', 'city', 'labelGenerated'])
  const handleSort = useCallback((field) => {
    if (!ALLOWED_SORT.has(field)) return
    if (sortBy === field) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(field); setSortDirection('asc') }
    setPage(1)
  }, [sortBy])

  // worker summary
  const workerSummary = useMemo(() => {
    const withPicks = orders.filter((o) => Array.isArray(o.myAllocations) && o.myAllocations.length > 0).length
    const royal = orders.filter((o) => o.isRoyalBox).length
    return { total: totalCount, withPicks, royal }
  }, [orders, totalCount])

  const displayedOrders = useMemo(() => orders, [orders])

  // admin column toggles
  const showSelectCol = !isWorker
  const showRoyalSwitchCol = !isWorker

  // Columns
  const baseColsAdmin = [
    { key: 'orderNo', label: 'ORDER #', sortable: true, thClass: 'col-orderNo', tdClass: 'col-orderNo' },
    { key: 'orderDate', label: 'DATE', sortable: true, thClass: 'col-date', tdClass: 'col-date' },
    { key: 'customerName', label: 'CUSTOMER', sortable: false, thClass: 'col-customer', tdClass: 'col-customer' },
    { key: 'mobile', label: 'MOBILE', sortable: false, thClass: 'col-mobile', tdClass: 'col-mobile' },
    { key: 'statusSimple', label: 'STATUS', sortable: false, thClass: 'col-status', tdClass: 'col-status' },
  ]

  const baseColsWorker = [
    { key: 'orderNo', label: 'ORDER #', sortable: true, thClass: 'col-orderNo', tdClass: 'col-orderNo' },
    { key: 'orderDate', label: 'DATE', sortable: true, thClass: 'col-date', tdClass: 'col-date' },
    { key: 'customerName', label: 'CUSTOMER', sortable: false, thClass: 'col-customer', tdClass: 'col-customer' },
    { key: 'statusSimple', label: 'STATUS', sortable: false, thClass: 'col-status', tdClass: 'col-status' },
    // { key: 'picks', label: 'MY PICKS', sortable: false, thClass: 'col-picks', tdClass: 'col-picks' },
  ]
  const cols = isWorker ? baseColsWorker : baseColsAdmin

  // selection (admin)
  const allSelected =
    showSelectCol && displayedOrders.length > 0 && displayedOrders.every((o) => selectedOrders.includes(o.orderNo))
  const toggleSelectAll = useCallback(() => {
    if (!showSelectCol) return
    if (allSelected) setSelectedOrders((prev) => prev.filter((no) => !displayedOrders.some((o) => o.orderNo === no)))
    else setSelectedOrders((prev) => [...new Set([...prev, ...displayedOrders.map((o) => o.orderNo)])])
  }, [allSelected, displayedOrders, showSelectCol])
  const toggleSelectOne = useCallback((no) => {
    if (!showSelectCol) return
    setSelectedOrders((prev) => (prev.includes(no) ? prev.filter((x) => x !== no) : [...prev, no]))
  }, [showSelectCol])

  // labels (admin)
  const handleGenerateLabels = async () => {
    if (!selectedOrders.length) return
    setLabelLoading(true)
    try { await labelsService.generate(selectedOrders); await fetchOrders(); setLabelError('') }
    catch (err) { setLabelError(getErrorMessage(err, 'Failed to generate labels')) }
    finally { setLabelLoading(false) }
  }

  const viewLabel = useCallback(async (orderNo) => {
    setLabelError('')
    try {
      const pdfPath = await labelsService.getByOrderNo(orderNo)
      // window.open(SERVER_URL + pdfPath, '_blank')
      downloadProtectedPdf(pdfPath, `label_${order.orderNo}.pdf`)
    } catch (err) { setLabelError(getErrorMessage(err, 'Failed to fetch label')) }
  }, []) // eslint-disable-line

  // manual submit (admin)
  const handleManualSubmit = useCallback(async (orderData) => {
    try { await orderService.createManual(orderData); setPage(1); await fetchOrders() }
    catch (err) { setError(getErrorMessage(err, 'Failed to create manual order')); throw err }
  }, []) // eslint-disable-line

  // Royal toggle (admin)
  const handleToggleRoyal = async (orderNo, willBeChecked) => {
    setMarkingRoyal((s) => new Set(s).add(orderNo))
    try {
      if (willBeChecked) {
        const res = await orderService.markRoyalBoxBulk([orderNo])
        const updatedNos = res?.updated || []
        if (updatedNos.includes(orderNo)) {
          setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, isRoyalBox: true } : o)))
          pushToast(`Order #${orderNo} marked as Royal Box 🔥`, 'success')
        }
      } else {
        await orderService.unmarkRoyalBox(orderNo)
        setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, isRoyalBox: false } : o)))
        pushToast(`Order #${orderNo} unmarked as Royal Box`, 'secondary')
      }
    } catch (e) {
      pushToast(getErrorMessage(e, willBeChecked ? 'Failed to mark as Royal Box' : 'Failed to unmark Royal Box'), 'danger')
    } finally {
      setMarkingRoyal((s) => { const c = new Set(s); c.delete(orderNo); return c })
    }
  }

  // assign (admin)
  const openAssign = (order) => { setAssignOrder(order); setAssignVisible(true) }
  const closeAssign = () => { setAssignVisible(false); setAssignOrder(null) }
  const assignWarehouseSingle = async (orderNo, userId) => {
    setAssignSubmitting(true)
    try {
      const data = await orderService.assignWarehouse(orderNo, userId)
      const updated = data?.order
      if (updated) setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, ...updated } : o)))
      const u = usersMap.get(userId)
      pushToast(`Order #${orderNo} assigned to ${u?.name || 'user'}`, 'success')
      closeAssign()
    } catch (e) {
      pushToast(getErrorMessage(e, 'Failed to assign'), 'danger')
    } finally {
      setAssignSubmitting(false)
    }
  }
  const assignRoyalDual = async (orderNo, userA, userB) => {
    setAssignSubmitting(true)
    try {
      const data = await orderService.assignRoyal(orderNo, userA, userB)
      const updated = data?.order
      if (updated) setOrders((prev) => prev.map((o) => (o.orderNo === orderNo ? { ...o, ...updated } : o)))
      pushToast(`Order #${orderNo} assigned to users`, 'success')
      closeAssign()
    } catch (e) {
      pushToast(getErrorMessage(e, 'Failed to assign (royal)'), 'danger')
    } finally {
      setAssignSubmitting(false)
    }
  }

  const handleStatusClick = useCallback((key) => { setActiveStatus(key); setPage(1) }, [])

  const hasAnyRemaining = (o) =>
    (o.items || []).some((it, idx) => {
      const claimed = (o.itemAllocations || []).filter((a) => a.lineIndex === idx).reduce((s, a) => s + (a.quantity || 0), 0)
      return claimed < (it.quantity || 0)
    })

  // claim modal controls
  const openClaim = (o) => { setClaimOrder(o); setClaimVisible(true); setClaimError('') }
  const closeClaim = () => { setClaimOrder(null); setClaimVisible(false); setClaimError('') }

  const submitClaim = async (picks) => {
    if (!claimOrder) return
    setClaimSubmitting(true); setClaimError('')
    try {
      const uid =
        typeof authService.getCurrentUserIdFromToken === 'function'
          ? authService.getCurrentUserIdFromToken()
          : userIdFromToken()
      await orderService.allocateItems(claimOrder.orderNo, uid, picks)
      pushToast(`Claimed ${picks.reduce((s, p) => s + p.quantity, 0)} item(s) on #${claimOrder.orderNo}`, 'success')
      closeClaim()
      await fetchOrders()
    } catch (e) {
      setClaimError(getErrorMessage(e, 'Failed to claim items'))
    } finally {
      setClaimSubmitting(false)
    }
  }

  // my allocations modal
  const openAllocations = (o) => { setAllocOrder(o); setAllocVisible(true) }
  const closeAllocations = () => { setAllocOrder(null); setAllocVisible(false) }

  // ---------- Start / Complete helpers ----------
  const U = (s) => String(s || '').trim().toUpperCase()
  const PENDING_STATES = new Set(['', 'CLAIMED', 'ASSIGNED', 'PENDING', 'ALLOCATED'])
  const STARTED_STATES = new Set(['STARTED', 'IN_PROGRESS', 'PREPARING'])
  const COMPLETED_STATES = new Set(['COMPLETED', 'DONE', 'FINISHED', 'PREPARED'])

  const computePrepButtons = (o) => {
    const myAllocs = o.myAllocations || []
    if (!myAllocs.length) return { canStart: false, canComplete: false, allCompleted: false }

    const states = myAllocs.map((a) => U(a.status))
    const hasPending = states.some((s) => PENDING_STATES.has(s))
    const hasStarted = states.some((s) => STARTED_STATES.has(s))
    const allCompleted = states.length > 0 && states.every((s) => COMPLETED_STATES.has(s))

    return {
      canStart: hasPending && !hasStarted && !allCompleted,
      canComplete: hasStarted && !allCompleted,
      allCompleted,
    }
  }

  const handleStartPrep = async (order) => {
    const no = order.orderNo
    setStarting((prev) => new Set(prev).add(no))
    try {
      await orderService.startPrep(no)
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNo === no
            ? {
              ...o,
              myAllocations: (o.myAllocations || []).map((a) => ({
                ...a,
                status: 'PREPARING',
                startedAt: a.startedAt || new Date().toISOString(),
              })),
            }
            : o,
        ),
      )
      pushToast(`Started work on #${no}`, 'info')
      await fetchOrders()
    } catch (e) {
      pushToast(getErrorMessage(e, 'Failed to start'), 'danger')
    } finally {
      setStarting((prev) => { const c = new Set(prev); c.delete(no); return c })
    }
  }

  const handleCompletePrep = async (order) => {
    const no = order.orderNo
    setCompleting((prev) => new Set(prev).add(no))
    try {
      await orderService.completePrep(no)
      setOrders((prev) =>
        prev.map((o) =>
          o.orderNo === no
            ? {
              ...o,
              myAllocations: (o.myAllocations || []).map((a) => ({
                ...a,
                status: 'COMPLETED',
                completedAt: a.completedAt || new Date().toISOString(),
              })),
            }
            : o,
        ),
      )
      pushToast(`Completed work on #${no}`, 'success')
      await fetchOrders()
    } catch (e) {
      pushToast(getErrorMessage(e, 'Failed to complete'), 'danger')
    } finally {
      setCompleting((prev) => { const c = new Set(prev); c.delete(no); return c })
    }
  }

  // ===== New helpers for label generation rules =====
  const updateLineSelCache = useCallback(async (orderNo) => {
    try {
      const data = await orderService.getLineCarriers(orderNo)
      const has = Array.isArray(data?.selections) && data.selections.length > 0
      setLineSelCache((m) => {
        const copy = new Map(m)
        copy.set(orderNo, has)
        return copy
      })
      return has
    } catch {
      return false
    }
  }, [])

  const hasPerLineSelections = (o) => {
    if (o?.carrierMode === 'PER_LINE') return true
    if (o?.hasPerLineCarrier) return true
    if (o?.carrierPlan?.hasSplit) return true
    if (Array.isArray(o?.carrierSelections) && o.carrierSelections.length > 0) return true
    const cached = lineSelCache.get(o.orderNo)
    return cached === true
  }

  const hasCarrierAssigned = (o) => {
    const c = o?.carrier || {}
    return Boolean(
      o?.shippingCompany ||
      c.code || o?.carrierCode || c.name || o?.carrierName
    )
  }

  const canGenerateLabelBase = (o) => {
    const s = U(o.currentStatus || o.orderStatus).replace(/[\s-]+/g, '_')
    return s === 'PREPARED' || s === 'AWAITING_PICKUP' || s === 'IN_TRANSIT'
  }

  const canGenerateLabel = (o) => canGenerateLabelBase(o) && !hasPerLineSelections(o)

  const generateLabelDirect = async (o) => {
    const no = o.orderNo
    setLabelGeneratingFor(no)
    setCarrierActionError('')
    try {
      const pdfPath = await labelsService.getByOrderNo(no)
      // window.open(SERVER_URL + pdfPath, '_blank')
      downloadProtectedPdf(pdfPath, `label_${order.orderNo}.pdf`)
      pushToast(`Label generated for #${no}`, 'success')
      await fetchOrders()
    } catch (e) {
      const msg = getErrorMessage(e, 'Could not generate label')
      setCarrierActionError(msg)
      pushToast(msg, 'danger')
    } finally {
      setLabelGeneratingFor(null)
    }
  }
  <NextStatusModal
    visible={nextVisible}
    onClose={() => setNextVisible(false)}
    order={nextOrder}
    onUpdated={fetchOrders}
  />

  const handleGenerateLabelButton = async (o) => {
    const splitExists = hasPerLineSelections(o) || (await updateLineSelCache(o.orderNo))
    if (splitExists) {
      pushToast('Per-line carrier selections exist for this order. Classic label path is disabled.', 'warning')
      return
    }

    if (!canGenerateLabelBase(o)) return
    if (hasCarrierAssigned(o)) {
      generateLabelDirect(o)
      return
    }
    setCarrierOrder(o)
    setSelectedCarrierCode(o?.carrier?.code || o?.carrierCode || '')
    setCarriersError('')
    setCarrierActionError('')
    setCarrierVisible(true)
    loadCarriers()
  }


  // ------- Custom Actions Menu (worker) -------
  // ------- Custom Actions Menu (worker) -------
  const openActionsMenu = (evt, o) => {

    if (o?.isRoyalBox) return; // block Actions for Royal Box
    evt.stopPropagation()
    const rect = evt.currentTarget.getBoundingClientRect()
    const width = 220
    const x = Math.max(8, rect.right - width)
    const y = rect.bottom + 4
    setActionMenu({ open: true, x, y, width, orderNo: o.orderNo })
    updateLineSelCache(o.orderNo)
  }

  const closeActionsMenu = () => setActionMenu({ open: false, x: 0, y: 0, width: 220, orderNo: null })

  useEffect(() => {
    if (!actionMenu.open) return
    const onAny = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return
      closeActionsMenu()
    }
    const onEsc = (ev) => { if (ev.key === 'Escape') closeActionsMenu() }

    window.addEventListener('scroll', onAny, true)
    window.addEventListener('resize', onAny)
    document.addEventListener('mousedown', onAny)
    document.addEventListener('keydown', onEsc)

    return () => {
      window.removeEventListener('scroll', onAny, true)
      window.removeEventListener('resize', onAny)
      document.removeEventListener('mousedown', onAny)
      document.removeEventListener('keydown', onEsc)
    }
  }, [actionMenu.open])

  const menuOrder = useMemo(
    () => (actionMenu.orderNo ? orders.find((o) => o.orderNo === actionMenu.orderNo) : null),
    [actionMenu.orderNo, orders],
  )

  // ===== Carrier modal controls (worker) =====
  const openCarrierModal = (o) => {
    setCarrierOrder(o)
    setSelectedCarrierCode(o?.carrier?.code || o?.carrierCode || '')
    setCarriersError('')
    setCarrierActionError('')
    setCarrierVisible(true)
    loadCarriers()
  }

  const closeCarrierModal = () => {
    setCarrierVisible(false)
    setCarrierOrder(null)
    setCarriersError('')
    setSelectedCarrierCode('')
    setCarrierActionError('')
  }

  const loadCarriers = async () => {
    setCarriersLoading(true); setCarriersError('')
    try {
      const res = await orderService.getCarriers()
      const list = (res?.result || res || []).filter((c) => c?.active !== false)
      setCarriers(list)
    } catch (e) {
      setCarriersError(getErrorMessage(e, 'Failed to load carriers'))
    } finally {
      setCarriersLoading(false)
    }
  }

  const confirmCarrierAndGenerate = async () => {
    if (!carrierOrder?.orderNo || !selectedCarrierCode) return
    const splitExists = hasPerLineSelections(carrierOrder) || (await updateLineSelCache(carrierOrder.orderNo))
    if (splitExists) {
      pushToast('Per-line carrier selections exist for this order. Classic label path is disabled.', 'warning')
      return
    }

    const no = carrierOrder.orderNo
    setLabelGeneratingFor(no)
    setCarrierActionError('')
    try {
      await orderService.selectCarrier(no, selectedCarrierCode)
      const pdfPath = await labelsService.getByOrderNo(no)
      // window.open(SERVER_URL + pdfPath, '_blank')
      downloadProtectedPdf(pdfPath, `label_${order.orderNo}.pdf`)
      pushToast(`Label generated for #${no}`, 'success')
      closeCarrierModal()
      await fetchOrders()
    } catch (e) {
      const msg = getErrorMessage(e, 'Could not generate label')
      setCarrierActionError(msg)
      pushToast(msg, 'danger')
    } finally {
      setLabelGeneratingFor(null)
    }
  }

  // ===== FIX: Next step button handler (was in wrong component before)
  const openNextStep = useCallback((order) => {
    setNextOrder(order)
    setNextVisible(true)
  }, [])

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

      {/* Controls */}
      <CRow className="mb-3 align-items-center">
        <CCol md={4} lg={3}>
          <CInputGroup size="sm">
            <CInputGroupText><CIcon icon={cilMagnifyingGlass} /></CInputGroupText>
            <CFormInput placeholder="Search orders…" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} />
          </CInputGroup>
        </CCol>

        {/* Admin tools */}
        {!isWorker && (
          <CCol md={8} lg={9} className="d-flex gap-2 justify-content-end">
            {/* [ADD] Add manual order button */}
            <CButton
              color="secondary"
              size="sm"
              onClick={() => setManualVisible(true)}
            >
              + Add Order
            </CButton>

            {/* [ADD] Export CSV button */}
            <CButton color="outline-secondary" size="sm" onClick={exportCsv}>
              Export CSV
            </CButton>

            <CForm onSubmit={handleImport} className="d-flex gap-2">
              <CButton
                color="outline-secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}   // use the ref, not getElementById
              >
                <CIcon icon={cilCloudUpload} className="me-1" /> {file ? file.name : 'Choose File'}
              </CButton>

              <input
                key={fileInputKey}                                // force-remount after import
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}                                // <-- tie it to the ref you created
                hidden
                onClick={(e) => { e.target.value = null }}        // allow re-selecting the same filename
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <CButton type="submit" color="primary" size="sm" disabled={importing || !file}>
                {importing ? <CSpinner size="sm" className="me-1" /> : 'Import Excel'}
              </CButton>
            </CForm>

            <CButton color="success" size="sm" disabled={!selectedOrders.length || labelLoading} onClick={handleGenerateLabels}>
              {labelLoading && <CSpinner size="sm" className="me-1" />} Generate Labels
            </CButton>
          </CCol>
        )}
      </CRow>

      {/* Worker summary */}
      {isWorker && (
        <div className="workload-summary px-3 mb-3">
          <span className="chip">Assigned: <strong>{workerSummary.total}</strong></span>
          <span className="chip">With my picks: <strong>{workerSummary.withPicks}</strong></span>
          <span className="chip">Royal: <strong>{workerSummary.royal}</strong> 🔥</span>
        </div>
      )}

      {/* Status Tabs (admin only) */}
      {!isWorker && (
        <div className="px-3 mb-3">
          <div className="status-tabs-wrapper">
            {STATUS_TABS.map((t) => (
              <button key={t.key} className={`status-tab ${activeStatus === t.key ? 'active' : ''}`} onClick={() => handleStatusClick(t.key)} type="button">
                {t.label}
                <span className="status-count">{orders.reduce((n, o) => n + ((o.currentStatus || '').toUpperCase() === t.key ? 1 : 0), 0)}</span>
              </button>
            ))}
            <button className={`status-tab ${activeStatus === ALL_KEY ? 'active' : ''}`} onClick={() => handleStatusClick(ALL_KEY)} type="button" title="Show all orders">
              All Orders <span className="status-count">{totalCount}</span>
            </button>
          </div>
        </div>
      )}

      {error && <CAlert color="danger">{error}</CAlert>}
      {labelError && <CAlert color="danger">{labelError}</CAlert>}
      {usersError && !isWorker && <CAlert color="warning">{usersError}</CAlert>}

      <CCard className="mb-4">
        <CCardBody className="px-0">
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : (
            <>
              <div className="table-responsive orders-table-wrap px-3">
                <CTable dark hover responsive className="heavy-table fit-table orders-table">

                  <CTableHead>
                    <CTableRow>
                      {!isWorker && (
                        <CTableHeaderCell className="col-select">
                          <CFormCheck inline checked={allSelected} onChange={toggleSelectAll} />
                        </CTableHeaderCell>
                      )}
                      {cols.map((col) => (
                        <CTableHeaderCell
                          key={col.key}
                          className={`${col.thClass} ${col.sortable ? 'cursor-pointer' : ''}`}
                          onClick={() => col.sortable && handleSort(col.key)}
                          title={col.sortable ? 'Sort' : undefined}
                        >
                          {col.label}
                          {col.sortable && sortBy === col.key && (
                            <CIcon icon={sortDirection === 'asc' ? cilSortAscending : cilSortDescending} className="ms-1" />
                          )}
                        </CTableHeaderCell>
                      ))}
                      <CTableHeaderCell className="col-total">TOTAL</CTableHeaderCell>
                      {!isWorker && <CTableHeaderCell className="col-royal">ROYAL BOX</CTableHeaderCell>}
                      <CTableHeaderCell className="col-label cursor-pointer" onClick={() => handleSort('labelGenerated')}>
                        LABEL
                        {sortBy === 'labelGenerated' && (
                          <CIcon icon={sortDirection === 'asc' ? cilSortAscending : cilSortDescending} className="ms-1" />
                        )}
                      </CTableHeaderCell>
                      <CTableHeaderCell className="col-assigned">ASSIGNED TO</CTableHeaderCell>
                      <CTableHeaderCell className="col-actions">ACTIONS</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {displayedOrders.length ? (
                      displayedOrders.map((o) => {
                        const assignedIds = Array.from(new Set((o.prepTasks || []).map((t) => t?.assignedTo).filter(Boolean)))
                        const totalQty = (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
                        const myQty = (o.myAllocations || []).reduce((s, a) => s + (a.quantity || 0), 0)
                        const { canStart, canComplete } = computePrepButtons(o)
                        const isStarting = starting.has(o.orderNo)
                        const isCompleting = completing.has(o.orderNo)
                        const splitActive = hasPerLineSelections(o)

                        return (
                          <CTableRow key={o.orderNo} className={`row-ctx ${!isWorker && selectedOrders.includes(o.orderNo) ? 'row-selected' : ''}`}>
                            {!isWorker && (
                              <CTableDataCell className="col-select">
                                <CFormCheck inline checked={selectedOrders.includes(o.orderNo)} onChange={() => toggleSelectOne(o.orderNo)} />
                              </CTableDataCell>
                            )}

                            {cols.map((col) => {
                              if (col.key === 'picks') {
                                const value = <span className={`badge-count ${myQty > 0 ? 'has' : ''}`}>{myQty}/{totalQty}</span>
                                return (
                                  <CTableDataCell key={`${o.orderNo}-picks`} className="col-picks">{value}</CTableDataCell>
                                )
                              }
                              const value = (() => {
                                switch (col.key) {
                                  case 'orderNo':
                                    return (
                                      <span className="d-inline-flex align-items-center gap-1" title={o.orderNo}>
                                        {o.orderNo} {o.isRoyalBox && <span className="flame-emoji" title="Royal Box">🔥</span>}
                                      </span>
                                    )
                                  case 'orderDate': return o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB') : '—'
                                  case 'customerName': return o.customerName
                                  case 'city': return o.city
                                  case 'statusSimple': {
                                    const status = o.currentStatus || o.orderStatus
                                    return status
                                      ? <CBadge color={getOrderStatusBadgeColor(status)}>{status}</CBadge>
                                      : '—'
                                  }
                                  case 'shippingCompany': {
                                    const isSplit =
                                      o?.carrierMode === 'PER_LINE' ||
                                      o?.hasPerLineCarrier ||
                                      o?.carrierPlan?.hasSplit ||
                                      (Array.isArray(o?.carrierSelections) && o.carrierSelections.length > 0)
                                    if (isSplit) {
                                      const totals = o?.carrierPlan?.totalsByCarrier || {}
                                      const tip = Object.keys(totals).length
                                        ? Object.entries(totals).map(([k, v]) => `${k}×${v}`).join(', ')
                                        : 'Per-line carriers'
                                      return (
                                        <span title={tip}>
                                          <CBadge color="info">Split</CBadge>
                                        </span>
                                      )
                                    }
                                    return o.shippingCompany ? <CBadge color="secondary">{o.shippingCompany}</CBadge> : '—'
                                  }
                                  case 'carrier': {
                                    const c = o.carrier
                                    if (c?.name && c?.code) return `${c.name} (${c.code})`
                                    if (o.carrierName || o.carrierCode) {
                                      const nm = o.carrierName || ''
                                      const cd = o.carrierCode || ''
                                      return nm || cd ? `${nm}${nm && cd ? ' ' : ''}${cd ? `(${cd})` : ''}` : '—'
                                    }
                                    return '—'
                                  }
                                  case 'paymentMethod': return <CBadge color={getPaymentBadge(o.paymentMethod)}>{o.paymentMethod}</CBadge>
                                  default: return o[col.key] ?? '—'
                                }
                              })()
                              return (
                                <CTableDataCell key={`${o.orderNo}-${col.key}`} className={col.tdClass}>{value}</CTableDataCell>
                              )
                            })}

                            <CTableDataCell className="col-total fw-semibold">
                              SAR {typeof o.orderTotal === 'number' ? o.orderTotal.toFixed(2) : '0.00'}
                            </CTableDataCell>

                            {!isWorker && (
                              <CTableDataCell className="col-royal">
                                <div className="d-inline-flex align-items-center gap-2">
                                  <label className={`royal-switch ${o.isRoyalBox ? 'active' : ''}`}>
                                    <input type="checkbox" checked={!!o.isRoyalBox} disabled={markingRoyal.has(o.orderNo)} onChange={(e) => handleToggleRoyal(o.orderNo, e.target.checked)} />
                                    <span className="slider"></span>
                                  </label>
                                  {markingRoyal.has(o.orderNo) && <CSpinner size="sm" />}
                                </div>
                              </CTableDataCell>
                            )}

                            <CTableDataCell className="col-label">
                              {o.labelGenerated ? (
                                <CButton color="primary" size="sm" onClick={() => viewLabel(o.orderNo)}>
                                  <CIcon icon={cilPrint} className="me-1" /> Download
                                </CButton>
                              ) : '—'}
                            </CTableDataCell>

                            <CTableDataCell className="col-assigned">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                {assignedIds.length ? (
                                  assignedIds.map((id) => {
                                    const u = usersMap.get(id)
                                    return <span key={id} className="mini-avatar" title={u?.name || id}>{initials(u?.name)}</span>
                                  })
                                ) : (
                                  <span className="text-muted small">Unassigned</span>
                                )}
                                {!isWorker && (
                                  <CButton size="sm" color="secondary" disabled={usersLoading} onClick={() => openAssign(o)}>
                                    {usersLoading ? <CSpinner size="sm" /> : 'Assign'}
                                  </CButton>
                                )}
                              </div>
                            </CTableDataCell>

                            <CTableDataCell
                              className="col-actions actions-cell"
                              style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}
                            >
                              {/* EDIT stays visible for both admin & worker */}
                              <CButton
                                size="sm"
                                color="info"
                                className="me-2"
                                onClick={() => { setSelectedOrder(o); setModalVisible(true) }}
                                title="Edit / Details / Packages / Carrier / Split Shipping / Label"
                              >
                                <CIcon icon={cilInfo} className="me-1" /> Edit
                              </CButton>

                              {/* Worker: Generate Label (classic) — disabled if per-line split exists */}
                              {isWorker && (
                                <CButton
                                  size="sm"
                                  color="primary"
                                  className="me-2"
                                  disabled={!canGenerateLabel(o) || labelGeneratingFor === o.orderNo}
                                  onClick={() => handleGenerateLabelButton(o)}
                                  title={
                                    hasPerLineSelections(o)
                                      ? 'Disabled: per-line selections exist'
                                      : (canGenerateLabelBase(o)
                                        ? (hasCarrierAssigned(o) ? 'Generate label' : 'Select carrier & generate')
                                        : 'Enabled when status is PREPARED / AWAITING_PICKUP / IN_TRANSIT')
                                  }
                                >
                                  {labelGeneratingFor === o.orderNo ? (
                                    <>
                                      <CSpinner size="sm" className="me-1" /> Working…
                                    </>
                                  ) : (
                                    'Generate Label'
                                  )}
                                </CButton>
                              )}

                              {/* Next step (non-royal) */}
                              {!o.isRoyalBox && (
                                <CButton
                                  size="sm"
                                  color="primary"
                                  variant="outline"
                                  className="me-2"
                                  onClick={() => openNextStep(o)}
                                  title="Advance to next status"
                                >
                                  Next step <CIcon icon={cilChevronRight} className="ms-1" />
                                </CButton>
                              )}

                              {/* Worker-only Actions portal trigger */}
                              {o?.isRoyalBox ? (
                                // Royal Box → hide Actions, show Next step
                                <CButton size="sm" color="primary" onClick={() => openNextStep(o)}>
                                  Next step
                                </CButton>
                              ) : (
                                // Non-royal → keep Actions
                                <CButton size="sm" color="dark" onClick={(e) => openActionsMenu(e, o)}>
                                  Actions
                                </CButton>
                              )}

                            </CTableDataCell>
                          </CTableRow>
                        )
                      })
                    ) : (
                      <CTableRow>
                        <CTableDataCell colSpan={cols.length + (showSelectCol ? 1 : 0) + (showRoyalSwitchCol ? 1 : 0) + 3} className="text-center py-5">
                          <CIcon icon={cilMagnifyingGlass} size="xl" className="text-muted mb-3" />
                          <p className="h5">No orders found</p>
                          <p className="text-muted">{filter ? 'Try changing your search query' : 'No orders to display'}</p>
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* Per-page selector + pagination */}
              <CRow className="mt-2 px-3">
                <CCol md="auto" className="ms-auto">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small">Per page</span>
                    <CFormSelect size="sm" style={{ width: 90 }} value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </CFormSelect>
                  </div>
                </CCol>
              </CRow>

              {totalCount > 1 && (
                <CRow className="mt-3">
                  <CCol className="d-flex justify-content-center">
                    <CPagination size="sm">
                      <CPaginationItem disabled={page === 1} onClick={() => setPage(1)}>&laquo;</CPaginationItem>
                      <CPaginationItem disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>&lsaquo;</CPaginationItem>
                      <CPaginationItem active>{page}</CPaginationItem>
                      <CPaginationItem disabled={page * limit >= totalCount} onClick={() => setPage((p) => p + 1)}>&rsaquo;</CPaginationItem>
                      <CPaginationItem disabled={page * limit >= totalCount} onClick={() => setPage(Math.ceil(totalCount / limit))}>&raquo;</CPaginationItem>
                    </CPagination>
                  </CCol>
                </CRow>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onViewLabel={viewLabel}
          presetsService={presetsService}
          orderService={orderService}
          fetchOrders={() => fetchOrders()}
          currentUserId={currentUserId}
          onSplitChange={(orderNo, has) => {
            setLineSelCache((m) => {
              const copy = new Map(m)
              copy.set(orderNo, !!has)
              return copy
            })
          }}
        />
      )}

      {/* [ADD] Manual order modal */}
      {!isWorker && (
        <ManualOrderModal
          visible={manualVisible}
          onClose={() => setManualVisible(false)}
          onSubmit={handleManualSubmit}
        />
      )}

      {/* Claim modal */}
      {isWorker && claimOrder && (
        <ClaimModal
          order={claimOrder}
          visible={claimVisible}
          onClose={closeClaim}
          onSubmit={submitClaim}
          myUserId={currentUserId}
          submitting={claimSubmitting}
          error={claimError}
        />
      )}

      {/* My Allocations modal */}
      {isWorker && allocOrder && (
        <MyAllocationsModal
          order={allocOrder}
          visible={allocVisible}
          onClose={closeAllocations}
        />
      )}

      {/* Assign modal (admin only) */}
      {!isWorker && (
        <AssignModal
          visible={assignVisible}
          onClose={closeAssign}
          onSubmitSingle={assignWarehouseSingle}
          onSubmitRoyal={assignRoyalDual}
          users={users}
          order={assignOrder}
          submitting={assignSubmitting}
        />
      )}

      {/* Next step modal */}
      {nextOrder && (
        <NextStatusModal
          visible={nextVisible}
          onClose={() => { setNextOrder(null); setNextVisible(false) }}
          order={nextOrder}
          onUpdated={fetchOrders}
        />
      )}

      {/* Carrier select + generate modal (worker) */}
      {isWorker && carrierOrder && (
        <CarrierSelectModal
          visible={carrierVisible}
          onClose={closeCarrierModal}
          carriers={carriers}
          loading={carriersLoading}
          error={carriersError}
          selected={selectedCarrierCode}
          onSelect={setSelectedCarrierCode}
          onRefresh={loadCarriers}
          onConfirm={confirmCarrierAndGenerate}
          confirming={labelGeneratingFor === carrierOrder.orderNo}
          orderNo={carrierOrder.orderNo}
          actionError={carrierActionError}
        />
      )}

      {/* Actions portal menu (worker only) */}
      {isWorker && actionMenu.open && menuOrder && createPortal(
        <div
          ref={menuRef}
          className="action-menu-portal"
          style={{ position: 'fixed', top: actionMenu.y, left: actionMenu.x, width: actionMenu.width, zIndex: 10000 }}
        >
          {(() => {
            const o = menuOrder
            const totalQty = (o.items || []).reduce((s, it) => s + (it.quantity || 0), 0)
            const myQty = (o.myAllocations || []).reduce((s, a) => s + (a.quantity || 0), 0)
            const { canStart, canComplete } = computePrepButtons(o)
            const isStarting = starting.has(o.orderNo)
            const isCompleting = completing.has(o.orderNo)
            const splitActive = hasPerLineSelections(o)
            const canGen = canGenerateLabelBase(o) && !splitActive

            return (
              <>
                <button
                  className={`am-item ${(!canGen) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!canGen) return
                    handleGenerateLabelButton(o)
                    closeActionsMenu()
                  }}
                  title={splitActive ? 'Disabled: per-line selections exist' : (hasCarrierAssigned(o) ? 'Generate label' : 'Select carrier & generate')}
                >
                  <CIcon icon={cilPrint} /> Generate Label
                </button>

                <div className="am-divider" />

                <button
                  className={`am-item ${(!o.isRoyalBox || !hasAnyRemaining(o)) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!o.isRoyalBox || !hasAnyRemaining(o)) return
                    openClaim(o)
                    closeActionsMenu()
                  }}
                >
                  <CIcon icon={cilCheckCircle} /> Claim Items
                </button>

                <button
                  className={`am-item ${(!canStart || isStarting) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!canStart || isStarting) return
                    handleStartPrep(o)
                    closeActionsMenu()
                  }}
                >
                  {isStarting ? <CSpinner size="sm" /> : <CIcon icon={cilMediaPlay} />} Start
                </button>

                <button
                  className={`am-item ${(!canComplete || isCompleting) ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!canComplete || isCompleting) return
                    handleCompletePrep(o)
                    closeActionsMenu()
                  }}
                >
                  {isCompleting ? <CSpinner size="sm" /> : <CIcon icon={cilCheckAlt} />} Complete
                </button>

                <div className="am-divider" />

                <button
                  className={`am-item ${((o.myAllocations || []).length === 0) ? 'disabled' : ''}`}
                  onClick={() => {
                    if ((o.myAllocations || []).length === 0) return
                    openAllocations(o)
                    closeActionsMenu()
                  }}
                >
                  <CIcon icon={cilList} /> My Allocations ({(o.myAllocations || []).length})
                </button>

                <div className="am-footer">
                  <span className={`badge-count ${myQty > 0 ? 'has' : ''}`}>{myQty}/{totalQty}</span>
                </div>
              </>
            )
          })()}
        </div>,
        document.body
      )}

      {/* styles */}
      <style>
        {`
        .heavy-table.fit-table { table-layout: fixed; width: 100%; font-size: 0.9rem; }
        .heavy-table.fit-table th, .heavy-table.fit-table td { padding: .6rem .55rem; vertical-align: middle; background-clip: padding-box; }
        .orders-table-wrap { overflow-x: auto; overflow-y: visible; position: relative; }
        .fit-table th, .fit-table td { overflow: hidden; text-overflow: ellipsis; }
        .orders-table .row-selected,
        .orders-table .row-selected > td {
          background: rgba(13,110,253,0.12) !important;
          transition: background .12s ease;
        }
        .orders-table .row-selected > td:first-child { position: relative; }
        .orders-table .row-selected > td:first-child::before {
          content: '';
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: #0d6efd;
        }
        .row-ctx { position: relative; z-index: 1; }

        .col-select   { width: 36px; }
        .col-orderNo  { width: 110px; white-space: nowrap; }
        .col-date     { width: 116px; white-space: nowrap; }
        .col-customer { width: 150px; white-space: normal; }
        .col-mobile   { width: 120px; white-space: nowrap; }
        .col-email    { width: 180px; white-space: normal; word-break: break-word; }
        .col-country  { width: 110px; white-space: nowrap; }
        .col-city     { width: 120px; white-space: normal; }
        .col-status   { width: 135px; white-space: nowrap; }
        .col-carrier  { width: 180px; white-space: normal; }
        .col-payment  { width: 110px; white-space: nowrap; }
        .col-picks    { width: 100px; white-space: nowrap; text-align:center; }
        .col-total    { width: 120px; white-space: nowrap; }
        .col-royal    { width: 110px; white-space: nowrap; }
        .col-label    { width: 110px; white-space: nowrap; }
        .col-assigned { width: 160px; white-space: normal; }
        .col-actions  { width: 360px; white-space: nowrap; }

        @media (max-width: 1400px) {
          .heavy-table.fit-table { font-size: 0.86rem; }
          .col-email { width: 160px; }
          .col-customer { width: 140px; }
          .col-city { width: 110px; }
          .col-actions { width: 320px; }
        }
        @media (max-width: 1200px) {
          .heavy-table.fit-table { font-size: 0.82rem; }
          .col-email { width: 150px; }
          .col-actions { width: 300px; }
        }

        .container-fluid { padding-left: 0; padding-right: 0; }

        .status-tabs-wrapper { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: .25rem; -webkit-overflow-scrolling: touch; background-color: transparent; }
        .status-tab { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .6rem 1rem; border-radius: 4px; border: 1px solid #444; background: #333; color: #ddd; font-weight: 600; transition: all 0.15s ease; white-space: nowrap; user-select: none; min-width: 120px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-tab:hover:not(.active) { background: #444; transform: translateY(-1px); }
        .status-tab.active { background: #0d6efd; color: #fff; border-color: #0d6efd; box-shadow: 0 0 0 2px rgba(13,110,253,.3); }
        .status-tab .status-count { display: inline-flex; align-items: center; justify-content: center; padding: .1rem .5rem; border-radius: 999px; background: rgba(255,255,255,0.1); font-size: .8rem; font-weight: 700; color: #fff; }
        .cursor-pointer { cursor: pointer; }

        /* Royal Box switch */
        .royal-switch { --w: 46px; --h: 24px; --knob: 20px; position: relative; display: inline-flex; align-items: center; }
        .royal-switch input { display: none; }
        .royal-switch .slider { width: var(--w); height: var(--h); border-radius: 999px; background: #555; box-shadow: inset 0 0 0 2px rgba(0,0,0,.2); position: relative; transition: all .2s ease; }
        .royal-switch .slider::after { content: ''; position: absolute; top: 2px; left: 2px; width: var(--knob); height: var(--knob); border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.35); transition: transform .2s ease, box-shadow .2s ease; }
        .royal-switch input:checked + .slider { background: linear-gradient(90deg, #ff7a00, #ffc400); box-shadow: inset 0 0 12px rgba(255,150,0,.6), 0 0 8px rgba(255,140,0,.35); }
        .royal-switch input:checked + .slider::after { transform: translateX(calc(var(--w) - var(--knob) - 4px)); box-shadow: 0 0 10px rgba(255,140,0,.9); }

        .flame-emoji { display: inline-block; animation: flameFlicker 1s ease-in-out infinite; filter: drop-shadow(0 0 4px rgba(255,120,0,.7)); }
        @keyframes flameFlicker {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-1px) scale(1.06); opacity: .95; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        .mini-avatar { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color:#111; background: linear-gradient(135deg, #ffd54f, #ffecb3); border: 1px solid rgba(0,0,0,.1); box-shadow: 0 1px 2px rgba(0,0,0,.15); }

        .workload-summary { display:flex; gap:.5rem; flex-wrap:wrap; }
        .workload-summary .chip { background:#2b2b2b; border:1px solid #3d3d3d; color:#e6e6e6; padding:.35rem .6rem; border-radius:999px; font-size:.85rem; }

        .badge-count { display:inline-block; min-width:48px; text-align:center; padding:.2rem .4rem; border-radius:999px; background:#2a2a2a; }
        .badge-count.has { background:#12361f; border:1px solid #1f6b39; color:#a8e7bf; }

        /* Actions cell */
        .row-ctx .actions-cell { position: relative; overflow: visible !important; z-index: 50; }
        .col-actions .btn { opacity: 1 !important; position: relative; z-index: 61; }

        .t-center { text-align:center; }
        .qty-stepper { display:inline-flex; gap:.35rem; align-items:center; }
        .qty-stepper .step { width:28px; height:28px; border-radius:8px; border:1px solid #2a2f35; background:#1a1e23; color:#e6ebef; }
        .qty-stepper input { width:70px; height:28px; background:#0f1317; border:1px solid #2a2f35; border-radius:6px; color:#e6ebef; text-align:center; }
        .qty-stepper .max-btn { height:28px; border-radius:8px; border:1px solid #315a3f; background:#112619; color:#bfe8c9; padding:0 .5rem; }

        /* -------- Actions Portal Menu (worker) -------- */
        .action-menu-portal {
          background: #1f232a;
          border: 1px solid #343a40;
          border-radius: 10px;
          padding: 6px;
          box-shadow: 0 14px 40px rgba(0,0,0,.55);
          animation: amFade .12s ease-out;
        }
        @keyframes amFade { from { opacity: .2; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        .am-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          color: #e8edf3;
          background: transparent;
          border: 0;
          border-radius: 8px;
          text-align: left;
        }
        .am-item:hover { background: #2b3139; }
        .am-item.disabled { opacity: .5; pointer-events: none; }
        .am-divider { height: 1px; margin: 6px 0; background: #343a40; }
        .am-footer { padding: 6px 2px 2px; display: flex; justify-content: flex-end; }
        `}
      </style>
    </CContainer>
  )
}

export default Orders
