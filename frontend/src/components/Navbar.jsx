import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const schoolRoles = ['ucenik', 'roditelj', 'nastavnik', 'administracija']
const healthRoles = ['pacijent', 'lekar', 'medicinska_sestra', 'administrator']

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const showSchool = user && (schoolRoles.includes(user.role) || user.role === 'admin')
  const showHealth = user && (healthRoles.includes(user.role) || user.role === 'admin')

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        e<span>Uprava</span>
      </NavLink>
      <ul className="navbar-nav">
        <li><NavLink to="/">Početna</NavLink></li>
        {showSchool && (
          <>
            <li><NavLink to="/school/enrollments">Upis</NavLink></li>
            <li><NavLink to="/school/grades">Ocene</NavLink></li>
            <li><NavLink to="/school/appointments">Termini</NavLink></li>
            <li><NavLink to="/school/absences">Izostanci</NavLink></li>
            <li><NavLink to="/school/documents">Dokumenta</NavLink></li>
            {/* Lekarski — ucenik/roditelj moraju kreirati zdravstveni profil */}
            {['ucenik', 'roditelj'].includes(user?.role) && (
              <li><NavLink to="/health/medical-certificates">Lekarski</NavLink></li>
            )}
          </>
        )}
        {showHealth && (
          <>
            <li><NavLink to="/health/appointments">Pregledi</NavLink></li>
            <li><NavLink to="/health/prescriptions">Recepti</NavLink></li>
            <li><NavLink to="/health/messages">Poruke</NavLink></li>
            <li><NavLink to="/health/records">eKarton</NavLink></li>
            <li><NavLink to="/health/healthcard">Zdravstvena</NavLink></li>
            <li><NavLink to="/health/medical-certificates">Potvrde</NavLink></li>
          </>
        )}
        {user && (
          <li>
            <button className="btn-logout" onClick={handleLogout}>
              Odjava ({user.role})
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
