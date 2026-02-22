import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import { createHealthAppointment, listHealthAppointments, updateHealthAppointmentStatus, listDoctors, getMyPatient, createPatient, getMyDoctor, createDoctor } from '../../api/health'

const STATUS_LABELS = { pending: 'Na čekanju', confirmed: 'Potvrđeno', cancelled: 'Otkazano', completed: 'Završeno' }

export default function HealthAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ doctor_id: '', date_time: '', type: 'pregled', notes: '' })
  const [needsProfile, setNeedsProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', specialty: 'Opšta medicina' })
  const [profileSaving, setProfileSaving] = useState(false)

  const isDoctor = ['lekar', 'medicinska_sestra', 'administrator'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try {
      if (isDoctor) {
        try {
          await getMyDoctor()
        } catch {
          setNeedsProfile(true)
          setProfileForm({ first_name: user?.firstName || '', last_name: user?.lastName || '', specialty: 'Opšta medicina' })
          setLoading(false)
          return
        }
      } else if (user?.role === 'pacijent') {
        try {
          await getMyPatient()
        } catch {
          setNeedsProfile(true)
          setProfileForm({ first_name: user?.firstName || '', last_name: user?.lastName || '' })
          setLoading(false)
          return
        }
      }
      const [appts, docs] = await Promise.all([listHealthAppointments(), listDoctors()])
      setAppointments(appts.data || [])
      setDoctors(docs.data || [])
    } catch {
      setError('Greška pri učitavanju.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreateProfile = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      if (isDoctor) {
        await createDoctor({ first_name: profileForm.first_name, last_name: profileForm.last_name, specialty: profileForm.specialty })
      } else {
        await createPatient({ first_name: profileForm.first_name, last_name: profileForm.last_name })
      }
      setNeedsProfile(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri kreiranju profila.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, date_time: new Date(form.date_time).toISOString() }
      await createHealthAppointment(payload)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška.')
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateHealthAppointmentStatus(id, { status })
      load()
    } catch { setError('Greška pri ažuriranju.') }
  }

  if (needsProfile) {
    return (
      <Layout>
        <div className="page-header">
          <div>
            <h1 className="page-title">Zakazivanje pregleda</h1>
            <p className="page-subtitle">Potrebno je kreirati profil pre korišćenja</p>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card">
          <div className="card-title">{isDoctor ? 'Kreiranje profila lekara' : 'Kreiranje profila pacijenta'}</div>
          <form onSubmit={handleCreateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Ime</label>
                <input value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} required placeholder="Vaše ime" />
              </div>
              <div className="form-group">
                <label>Prezime</label>
                <input value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} required placeholder="Vaše prezime" />
              </div>
              {isDoctor && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Specijalnost</label>
                  <select value={profileForm.specialty} onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}>
                    <option value="Opšta medicina">Opšta medicina</option>
                    <option value="Pedijatrija">Pedijatrija</option>
                    <option value="Kardiologija">Kardiologija</option>
                    <option value="Neurologija">Neurologija</option>
                    <option value="Ortopedija">Ortopedija</option>
                    <option value="Dermatologija">Dermatologija</option>
                    <option value="Ginekologija">Ginekologija</option>
                    <option value="Psihijatrija">Psihijatrija</option>
                  </select>
                </div>
              )}
            </div>
            <button className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Kreiranje...' : 'Kreiraj profil'}
            </button>
          </form>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Zakazivanje pregleda</h1>
          <p className="page-subtitle">Online booking termina kod doktora</p>
        </div>
        {!isDoctor && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Zakaži pregled'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-title">Novi zahtjev za pregled</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Doktor</label>
                <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} required>
                  <option value="">Izaberite doktora</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} — {d.specialty}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Datum i vreme pregleda</label>
                <input type="datetime-local" value={form.date_time} onChange={(e) => setForm({ ...form, date_time: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Tip pregleda</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  <option value="pregled">Opšti pregled</option>
                  <option value="laboratorija">Laboratorija</option>
                  <option value="vakcinacija">Vakcinacija</option>
                  <option value="specijalista">Specijalista</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Napomena</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opišite simptome ili razlog..." />
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
          <div className="empty-state"><div className="empty-state-icon">🏥</div><p>Nema zakazanih pregleda.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Datum</th><th>Tip</th><th>Status</th>{isDoctor && <th>Akcija</th>}</tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date_time ? new Date(a.date_time).toLocaleString('sr-RS') : '—'}</td>
                    <td>{a.type}{a.notes && ` — ${a.notes}`}</td>
                    <td><span className={`badge badge-${a.status === 'confirmed' ? 'approved' : a.status}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                    {isDoctor && a.status === 'pending' && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatus(a.id, 'confirmed')}>Potvrdi</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'cancelled')}>Otkaži</button>
                      </td>
                    )}
                    {isDoctor && a.status === 'confirmed' && (
                      <td><button className="btn btn-secondary btn-sm" onClick={() => handleStatus(a.id, 'completed')}>Završi</button></td>
                    )}
                    {isDoctor && !['pending', 'confirmed'].includes(a.status) && <td>—</td>}
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
