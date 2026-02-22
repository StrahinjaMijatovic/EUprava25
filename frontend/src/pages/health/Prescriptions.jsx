import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createPrescription, listPrescriptions, updatePrescriptionStatus, listPatients } from '../../api/health'

const STATUS_LABELS = { active: 'Aktivan', used: 'Iskorišten', expired: 'Istekao' }

export default function Prescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patient_id: '', medication: '', dosage: '', duration: '' })

  const isDoctor = ['lekar', 'administrator'].includes(user?.role)

  const load = async () => {
    try {
      const res = await listPrescriptions()
      setPrescriptions(res.data || [])
      if (isDoctor) {
        const pats = await listPatients()
        setPatients(pats.data || [])
      }
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createPrescription(form)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">E-recepti</h1>
          <p className="page-subtitle">Pregled i upravljanje elektronskim receptima</p>
        </div>
        {isDoctor && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Novi recept'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && isDoctor && (
        <div className="card">
          <div className="card-title">Novi e-recept</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Pacijent</label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
                  <option value="">Izaberite pacijenta</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Naziv lijeka</label>
                <input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Doziranje</label>
                <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="npr. 500mg 2x dnevno" required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Trajanje / Upute</label>
                <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="npr. 7 dana, uzimati uz obrok" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Izdaj recept</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="spinner" /> : prescriptions.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">💊</div><p>Nema recepata.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lijek</th><th>Doza</th><th>Trajanje</th><th>Status</th></tr></thead>
              <tbody>
                {prescriptions.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.medication}</strong></td>
                    <td>{p.dosage}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.duration || '—'}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-approved' : p.status === 'expired' ? 'badge-rejected' : 'badge-pending'}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
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
