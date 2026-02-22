import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createSchoolAppointment, listSchoolAppointments, updateSchoolAppointmentStatus } from '../../api/school'

const STATUS_LABELS = { pending: 'Na čekanju', approved: 'Odobreno', rejected: 'Odbijeno', completed: 'Završeno' }

export default function SchoolAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ appointment_type: 'parent_teacher', requested_date: '', note: '' })

  const isStaff = ['nastavnik', 'administracija', 'admin'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listSchoolAppointments()
      setAppointments(res.data || [])
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        type: form.appointment_type,
        date_time: new Date(form.requested_date).toISOString(),
        notes: form.note,
      }
      await createSchoolAppointment(payload)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateSchoolAppointmentStatus(id, { status })
      load()
    } catch { setError('Greška pri ažuriranju.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Zakazivanje termina</h1>
          <p className="page-subtitle">Termini sa nastavnicima, direktorom i psiholozima</p>
        </div>
        {!isStaff && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Zakaži termin'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Novi zahtjev za termin</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Tip sastanka</label>
                <select value={form.appointment_type} onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}>
                  <option value="parent_teacher">Roditelj — Nastavnik</option>
                  <option value="psychologist">Psiholog</option>
                  <option value="director">Direktor</option>
                  <option value="other">Ostalo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Željeni datum i vreme</label>
                <input type="datetime-local" value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Napomena</label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Opišite razlog zakazivanja..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Zakaži</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : appointments.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📅</div><p>Nema zakazanih termina.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Tip</th><th>Datum</th><th>Napomena</th><th>Status</th>{isStaff && <th>Akcija</th>}</tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.type}</td>
                    <td>{a.date_time ? new Date(a.date_time).toLocaleString('sr-RS') : '—'}</td>
                    <td>{a.notes || '—'}</td>
                    <td><span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                    {isStaff && a.status === 'pending' && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatus(a.id, 'approved')}>Odobri</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'rejected')}>Odbij</button>
                      </td>
                    )}
                    {isStaff && a.status !== 'pending' && <td>—</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
