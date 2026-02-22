import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'

const ROLES = [
  { value: 'ucenik', label: 'Učenik' },
  { value: 'roditelj', label: 'Roditelj' },
  { value: 'nastavnik', label: 'Nastavnik' },
  { value: 'administracija', label: 'Administracija (škola)' },
  { value: 'pacijent', label: 'Pacijent' },
  { value: 'lekar', label: 'Lekar' },
  { value: 'medicinska_sestra', label: 'Medicinska sestra' },
  { value: 'administrator', label: 'Administrator (zdravstvo)' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'pacijent', first_name: '', last_name: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await apiRegister(form)
      setSuccess('Nalog je kreiran! Preusmjeravamo na prijavu...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Greška pri registraciji.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <h1>e<span>Uprava</span></h1>
          <p>Republika Srbija — Portal građana</p>
        </div>
        <h2 className="auth-title">Registracija</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Ime</label>
              <input
                type="text"
                placeholder="Ime"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prezime</label>
              <input
                type="text"
                placeholder="Prezime"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email adresa</label>
            <input
              type="email"
              placeholder="ime@primer.rs"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Lozinka</label>
            <input
              type="password"
              placeholder="Minimum 6 karaktera"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Tip korisnika</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Registracija...' : 'Registruj se'}
          </button>
        </form>
        <div className="auth-footer">
          Već imate nalog? <Link to="/login">Prijavite se</Link>
        </div>
      </div>
    </div>
  )
}
