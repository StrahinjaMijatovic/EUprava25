import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuth } from '../../context/AuthContext'
import {
  createMedicalCertificate,
  listMedicalCertificates,
  listPatients,
  getMyPatient,
  createPatient,
} from '../../api/health'

const CERT_TYPES = {
  sport:     'Za fizičko vaspitanje',
  bolovanje: 'Bolovanje',
  opste:     'Opšti pregled',
  school:    'Za školu',
}

function certTypeLabel(type) {
  return CERT_TYPES[type] || type
}

const emptyForm = {
  patient_id:   '',
  patient_name: '',
  type:         'school',
  valid_from:   '',
  valid_to:     '',
  notes:        '',
}

export default function MedicalCertificates() {
  const { user } = useAuth()
  const [certs, setCerts]             = useState([])
  const [patients, setPatients]       = useState([])
  const [myPatient, setMyPatient]     = useState(null)       // pacijentski profil ucitelja
  const [profileChecked, setProfileChecked] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(emptyForm)

  // Forma za kreiranje pacijentskog profila (ucenik/roditelj)
  const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', date_of_birth: '', health_card_no: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError]   = useState('')

  const isDoctor  = user?.role === 'lekar'
  const needsProfile = ['ucenik', 'roditelj', 'pacijent'].includes(user?.role)

  const load = async () => {
    setLoading(true)
    try {
      // Provjeri pacijentski profil za nedomare
      if (needsProfile) {
        try {
          const r = await getMyPatient()
          setMyPatient(r.data)
        } catch {
          setMyPatient(null)
        }
        setProfileChecked(true)
      }

      const res = await listMedicalCertificates()
      setCerts(res.data || [])

      if (isDoctor) {
        const pats = await listPatients()
        setPatients(pats.data || [])
      }
    } catch { setError('Greška pri učitavanju.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreateProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSaving(true)
    try {
      const r = await createPatient(profileForm)
      setMyPatient(r.data)
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Greška pri kreiranju profila.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePatientChange = (e) => {
    const pid = e.target.value
    const pat = patients.find((p) => p.id === pid)
    setForm({
      ...form,
      patient_id:   pid,
      patient_name: pat ? `${pat.first_name} ${pat.last_name}` : '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createMedicalCertificate(form)
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri izdavanju potvrde.')
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Medicinske potvrde</h1>
          <p className="page-subtitle">Potvrde koje važe za potrebe škole i sporta</p>
        </div>
        {isDoctor && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zatvori' : '+ Izdaj potvrdu'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Info banner */}
      <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🔗</span>
          <div>
            <strong style={{ color: '#1d4ed8' }}>Integracija Zdravstvo ↔ Škola</strong>
            <p style={{ margin: '4px 0 0', color: '#1e40af', fontSize: 14 }}>
              Medicinska potvrda izdata od strane lekara može se priložiti uz zahtjev za upis
              ili opravdanje izostanka u školskom sistemu.
            </p>
          </div>
        </div>
      </div>

      {/* ── Korak 1: Kreiranje pacijentskog profila (za ucenike bez profila) ── */}
      {needsProfile && profileChecked && !myPatient && (
        <div className="card" style={{ border: '2px solid #fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>👤</span>
            <div>
              <div className="card-title" style={{ marginBottom: 4 }}>Korak 1 — Registracija u zdravstveni sistem</div>
              <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
                Da bi lekar mogao da vam izda medicinsku potvrdu, potrebno je da kreirate
                zdravstveni profil. Ovo je jednokratni korak.
              </p>
            </div>
          </div>

          {profileError && <div className="alert alert-error">{profileError}</div>}

          <form onSubmit={handleCreateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Ime</label>
                <input
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Prezime</label>
                <input
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Datum rođenja</label>
                <input
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Broj zdravstvene knjižice (opcionalno)</label>
                <input
                  value={profileForm.health_card_no}
                  onChange={(e) => setProfileForm({ ...profileForm, health_card_no: e.target.value })}
                  placeholder="npr. SR-1234567"
                />
              </div>
            </div>
            <button className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Kreiranje...' : 'Kreiraj zdravstveni profil'}
            </button>
          </form>
        </div>
      )}

      {/* Potvrda da profil postoji */}
      {needsProfile && myPatient && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 8
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontSize: 14, color: '#166534' }}>
            Zdravstveni profil kreiran — <strong>{myPatient.first_name} {myPatient.last_name}</strong>.
            Lekar vas može pronaći i izdati potvrdu.
          </span>
        </div>
      )}

      {/* ── Forma za izdavanje (lekar) ── */}
      {showForm && isDoctor && (
        <div className="card">
          <div className="card-title">Nova medicinska potvrda</div>
          {patients.length === 0 && (
            <div style={{ padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#713f12' }}>
              ⚠ Nema pacijenata u sistemu. Pacijent mora kreirati zdravstveni profil na stranici "Potvrde".
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Pacijent</label>
                <select value={form.patient_id} onChange={handlePatientChange} required>
                  <option value="">Izaberite pacijenta</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tip potvrde</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                  {Object.entries(CERT_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Važi od</label>
                <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Važi do</label>
                <input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Napomene</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Dodatne napomene..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary">Izdaj potvrdu</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Odustani</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista potvrda ── */}
      <div className="card">
        {loading ? (
          <div className="spinner" />
        ) : certs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>
              {needsProfile && !myPatient
                ? 'Kreirajte zdravstveni profil da biste mogli da dobijete potvrdu.'
                : 'Nema izdatih medicinskih potvrda.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pacijent</th>
                  <th>Tip</th>
                  <th>Važi od</th>
                  <th>Važi do</th>
                  <th>Status</th>
                  <th>Napomene</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => {
                  const now     = new Date()
                  const validTo = c.valid_to ? new Date(c.valid_to) : null
                  const active  = validTo && validTo >= now
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.patient_name}</strong></td>
                      <td>{certTypeLabel(c.type)}</td>
                      <td>{c.valid_from ? new Date(c.valid_from).toLocaleDateString('sr-RS') : '—'}</td>
                      <td>{c.valid_to ? new Date(c.valid_to).toLocaleDateString('sr-RS') : '—'}</td>
                      <td>
                        <span className={`badge badge-${active ? 'approved' : 'rejected'}`}>
                          {active ? 'Aktivna' : 'Istekla'}
                        </span>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
