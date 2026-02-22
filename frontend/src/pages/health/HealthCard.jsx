import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createHealthCardRequest, listHealthCardRequests, updateHealthCardRequestStatus } from '../../api/health'

const STATUS_LABELS = { pending: 'Na čekanju', processing: 'U obradi', issued: 'Izdata', rejected: 'Odbijena' }

const REASON_LABELS = {
  new: 'Nova knjižica',
  lost: 'Izgubljena',
  expired: 'Istekla',
  damaged: 'Oštećena',
}

export default function HealthCard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ reason: 'new', address: '', phone: '' })

  const isAdmin = ['administrator', 'medicinska_sestra'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listHealthCardRequests()
      setRequests(res.data || [])
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        request_type: form.reason,
        notes: [form.address, form.phone].filter(Boolean).join(', '),
      }
      await createHealthCardRequest(payload)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateHealthCardRequestStatus(id, { status })
      load()
    } catch { setError('Greška pri ažuriranju.') }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Zdravstvena knjižica</h1>
          <p className="page-subtitle">Zahtjev i status zdravstvene knjižice</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Novi zahtjev'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Zahtjev za zdravstvenu knjižicu</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Razlog zahtjeva</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                  <option value="new">Nova knjižica</option>
                  <option value="lost">Izgubljena</option>
                  <option value="expired">Istekla</option>
                  <option value="damaged">Oštećena</option>
                </select>
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+38765..." required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Adresa</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Ulica i broj, grad" required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Podnesi zahtjev</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : requests.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💳</div><p>Nema zahtjeva za knjižicu.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Razlog</th><th colSpan={2}>Napomena</th><th>Status</th>{isAdmin && <th>Akcija</th>}</tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{REASON_LABELS[r.request_type] || r.request_type}</td>
                    <td colSpan={2}>{r.notes || '—'}</td>
                    <td>
                      <span className={`badge ${r.status === 'issued' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : r.status === 'processing' ? 'badge-completed' : 'badge-pending'}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'pending' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleStatus(r.id, 'processing')}>U obradu</button>
                        )}
                        {['pending', 'processing'].includes(r.status) && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => handleStatus(r.id, 'issued')}>Izdaj</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleStatus(r.id, 'rejected')}>Odbij</button>
                          </>
                        )}
                        {!['pending', 'processing'].includes(r.status) && '—'}
                      </td>
                    )}
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
