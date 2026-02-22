import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const schoolCards = [
  { to: '/school/enrollments', icon: '📋', title: 'Upis u školu', desc: 'Podnošenje i praćenje zahtjeva za upis' },
  { to: '/school/grades', icon: '📊', title: 'Ocjene i dnevnik', desc: 'Pregled ocjena i izostanaka' },
  { to: '/school/appointments', icon: '📅', title: 'Zakazivanje termina', desc: 'Termini sa nastavnicima i psiholozima' },
  { to: '/school/absences', icon: '📝', title: 'Opravdanje izostanaka', desc: 'Slanje ljekarski opravdanja' },
  { to: '/school/documents', icon: '📄', title: 'Dokumenta', desc: 'Uvjerenja, diplome i izvještaji' },
]

const healthCards = [
  { to: '/health/appointments', icon: '🏥', title: 'Zakazivanje pregleda', desc: 'Online booking termina kod ljekara' },
  { to: '/health/prescriptions', icon: '💊', title: 'E-recepti', desc: 'Pregled i upravljanje receptima' },
  { to: '/health/messages', icon: '✉️', title: 'Poruke ljekarima', desc: 'Direktna komunikacija sa ljekarima' },
  { to: '/health/records', icon: '🩺', title: 'eKarton', desc: 'Medicinska dokumentacija i nalazi' },
  { to: '/health/healthcard', icon: '💳', title: 'Zdravstvena knjižica', desc: 'Zahtjev i status zdravstvene knjižice' },
]

const roleGroups = {
  ucenik: schoolCards,
  roditelj: schoolCards,
  nastavnik: schoolCards,
  administracija: schoolCards,
  pacijent: healthCards,
  lekar: healthCards,
  medicinska_sestra: healthCards,
  administrator: healthCards,
  admin: [...schoolCards, ...healthCards],
}

const roleLabel = {
  ucenik: 'Učenik',
  roditelj: 'Roditelj',
  nastavnik: 'Nastavnik',
  administracija: 'Administracija',
  pacijent: 'Pacijent',
  lekar: 'Lekar',
  medicinska_sestra: 'Medicinska sestra',
  administrator: 'Administrator',
  admin: 'Super admin',
}

export default function Dashboard() {
  const { user } = useAuth()
  const cards = roleGroups[user?.role] || []

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dobrodošli na eUprava portal</h1>
          <p className="page-subtitle">
            Prijavljeni kao: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}) — {roleLabel[user?.role] || user?.role}
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="alert alert-info">
          Vaš nalog ({user?.role}) nije pridružen ni jednom servisu. Kontaktirajte administratora.
        </div>
      ) : (
        <div className="dashboard-grid">
          {cards.map((card) => (
            <Link key={card.to} to={card.to} className="dash-card">
              <div className="dash-card-icon">{card.icon}</div>
              <div className="dash-card-title">{card.title}</div>
              <div className="dash-card-desc">{card.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
