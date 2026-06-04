import { useEffect, useId, useMemo, useRef, useState } from 'react'

const formatTimeToHHMM = (value) => {
  const normalizedTime = String(value ?? '').trim()
  const t = normalizedTime
    .replace(/\s/g, '')
    .match(/^(\d{1,2})(?::?(\d{1,2}))?$/)

  if (!t) return normalizedTime

  const hh = String(t[1]).padStart(2, '0')
  const mm = String(t[2] ?? '00').padStart(2, '0')
  return `${hh}:${mm}`
}

const AppointmentDateTimeModal = ({
  open,
  onClose,
  onConfirm,
  initialDate = '',
  initialTime = '',
  title = 'Select Appointment Date',
}) => {
  const dialogRef = useRef(null)
  const confirmBtnRef = useRef(null)

  const labelId = useId()
  const descId = useId()

  const todayMin = useMemo(() => {
    const d = new Date()
    const iso = d.toISOString().slice(0, 10)
    return iso
  }, [])

  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(initialDate)
    setTime(initialTime)
    setErrorMsg('')

    const t = window.setTimeout(() => {
      // prefer focusing confirm button for keyboard users; fallback to first input
      confirmBtnRef.current?.focus?.()
      if (!confirmBtnRef.current) {
        const first = dialogRef.current?.querySelector('input, button, select, textarea')
        first?.focus?.()
      }
    }, 0)

    return () => window.clearTimeout(t)
  }, [open, initialDate, initialTime])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
        return
      }

      if (e.key !== 'Tab') return
      // basic focus trap
      const node = dialogRef.current
      if (!node) return

      const focusable = Array.from(
        node.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleCancel = () => {
    onClose?.()
  }

  const handleConfirm = () => {
    setErrorMsg('')

    if (!date) {
      setErrorMsg('Please select a date.')
      return
    }
    if (!time) {
      setErrorMsg('Please select a time.')
      return
    }

    const normalizedTime = formatTimeToHHMM(time)
    if (!normalizedTime || normalizedTime.length < 4) {
      setErrorMsg('Please enter a valid time (HH:MM).')
      return
    }

    onConfirm?.({ date, time: normalizedTime })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        aria-describedby={descId}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-100"
      >
        <div className="p-6 border-b flex justify-between items-center">
          <h2 id={labelId} className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleConfirm()
          }}
          className="p-6 space-y-4"
        >
          <p id={descId} className="text-sm text-gray-600">
            Choose an appointment date and time.
          </p>

          {errorMsg ? (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {errorMsg}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1" htmlFor="appointment-date">
                Date
              </label>
              <input
                id="appointment-date"
                type="date"
                min={todayMin}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1" htmlFor="appointment-time">
                Time
              </label>
              <input
                id="appointment-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">(Uses 24-hour format)</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-sm"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointmentDateTimeModal

