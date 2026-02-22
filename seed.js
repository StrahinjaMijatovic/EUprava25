// EUprava25 - Seed skripta (Node.js, bez eksternih zavisnosti)
// Pokretanje: node seed.js

const BASE = "http://localhost:8080/api";

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      console.log(`  ✗ ${method} ${path} -> ${res.status}: ${text}`);
      return null;
    }
    return data;
  } catch (e) {
    console.log(`  ✗ ${method} ${path} -> ${e.message}`);
    return null;
  }
}

const post  = (p, b, t) => req("POST",  p, b, t);
const get   = (p, t)    => req("GET",   p, null, t);
const patch = (p, b, t) => req("PATCH", p, b, t);

function ok(label, result) {
  if (result) console.log(`  ✓ ${label}`);
  return result;
}

function section(title) {
  console.log(`\n${"─".repeat(55)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(55));
}

async function main() {
  // ── 1. Registracija ────────────────────────────────────
  section("1. Registracija korisnika");

  const USERS = [
    ["pacijent@test.rs",        "test1234", "pacijent",          "Ana",       "Petrović"],
    ["lekar@test.rs",           "test1234", "lekar",             "Marko",     "Jovanović"],
    ["medicinska@test.rs",      "test1234", "medicinska_sestra", "Jelena",    "Nikolić"],
    ["zdravstvo.admin@test.rs", "test1234", "administrator",     "Zdravko",   "Adminović"],
    ["ucenik@test.rs",          "test1234", "ucenik",            "Petar",     "Lazarević"],
    ["roditelj@test.rs",        "test1234", "roditelj",          "Milica",    "Lazarević"],
    ["nastavnik@test.rs",       "test1234", "nastavnik",         "Ivan",      "Đorđević"],
    ["skola.admin@test.rs",     "test1234", "administracija",    "Sanja",     "Mitrović"],
  ];

  for (const [email, pwd, role, fn, ln] of USERS) {
    const r = await post("/auth/register", { email, password: pwd, role, first_name: fn, last_name: ln });
    console.log(r ? `  ✓ Registrovan: ${email} [${role}]` : `  → Već postoji: ${email}`);
  }

  // ── 2. Login ───────────────────────────────────────────
  section("2. Prijava i tokeni");

  async function login(email, pwd) {
    const r = await post("/auth/login", { email, password: pwd });
    if (r?.token) { console.log(`  ✓ Token: ${email}`); return r.token; }
    console.log(`  ✗ Login failed: ${email}`); return null;
  }

  const T = {};
  T.pacijent   = await login("pacijent@test.rs",        "test1234");
  T.lekar      = await login("lekar@test.rs",            "test1234");
  T.med_sestra = await login("medicinska@test.rs",       "test1234");
  T.zdr_admin  = await login("zdravstvo.admin@test.rs",  "test1234");
  T.ucenik     = await login("ucenik@test.rs",            "test1234");
  T.roditelj   = await login("roditelj@test.rs",          "test1234");
  T.nastavnik  = await login("nastavnik@test.rs",         "test1234");
  T.skol_admin = await login("skola.admin@test.rs",       "test1234");

  // ── 3. Zdravstvo: profili ──────────────────────────────
  section("3. Zdravstvo — Profili lekara i pacijenta");

  const doctor = ok("Profil lekara",
    await post("/health/doctors", { first_name: "Marko", last_name: "Jovanović", specialty: "Opšta medicina" }, T.lekar)
  );

  const patient = ok("Profil pacijenta",
    await post("/health/patients", { first_name: "Ana", last_name: "Petrović", date_of_birth: "1990-03-15", health_card_no: "SR-1234567" }, T.pacijent)
  );

  // ── 4. Zdravstvo: pregled ──────────────────────────────
  section("4. Zdravstvo — Zakazivanje pregleda");

  let appt = null;
  if (doctor && patient) {
    appt = ok("Pregled zakazan",
      await post("/health/appointments", { doctor_id: doctor.id, date_time: "2025-07-15T10:00:00Z", type: "opsti_pregled", notes: "Redovni godišnji pregled" }, T.pacijent)
    );
    if (appt) ok("Status -> potvrđen",
      await patch(`/health/appointments/${appt.id}/status`, { status: "confirmed", notes: "Potvrđen termin" }, T.lekar)
    );
  }

  // ── 5. Zdravstvo: recepti ──────────────────────────────
  section("5. Zdravstvo — E-recepti");

  let presc = null;
  if (patient) {
    presc = ok("Recept izdat",
      await post("/health/prescriptions", { patient_id: patient.id, medication: "Brufen 400mg", dosage: "1 tableta 3x dnevno", duration: "7 dana" }, T.lekar)
    );
  }

  // ── 6. Zdravstvo: poruke ───────────────────────────────
  section("6. Zdravstvo — Poruke");

  const lekarV = await get("/auth/verify", T.lekar);
  const patV   = await get("/auth/verify", T.pacijent);

  if (lekarV && patV) {
    ok("Poruka: pacijent → lekar",
      await post("/health/messages", { receiver_id: lekarV.sub, content: "Poštovani doktore, imam pitanje o terapiji." }, T.pacijent)
    );
    ok("Poruka: lekar → pacijent",
      await post("/health/messages", { receiver_id: patV.sub, content: "Nastavite terapiju još 3 dana." }, T.lekar)
    );
  }

  // ── 7. Zdravstvo: eKarton ─────────────────────────────
  section("7. Zdravstvo — eKarton i lab nalazi");

  if (patient) {
    ok("Zdravstveni zapis",
      await post("/health/health-records", { patient_id: patient.id, diagnosis: "Akutni bronhitis (J20)", treatment: "Antibiotska terapija 7 dana", record_date: "2025-06-01" }, T.lekar)
    );
    ok("Lab nalaz",
      await post("/health/lab-results", { patient_id: patient.id, test_name: "KKS", result: "Sve vrednosti u referentnom opsegu", result_date: "2025-06-02" }, T.med_sestra)
    );
  }

  // ── 8. Zdravstvo: knjižica ─────────────────────────────
  section("8. Zdravstvo — Zahtjev za zdravstvenu knjižicu");

  const hcr = ok("Zahtjev za knjižicu",
    await post("/health/health-card-requests", { request_type: "new", notes: "Bulevar oslobođenja 12, Novi Sad" }, T.pacijent)
  );
  if (hcr) ok("Status -> izdata",
    await patch(`/health/health-card-requests/${hcr.id}/status`, { status: "issued", notes: "Knjižica izdata" }, T.zdr_admin)
  );

  // ── 9. Škola: razredi i predmeti ──────────────────────
  section("9. Škola — Razredi i predmeti");

  const klasa = ok("Razred 7A",
    await post("/school/classes", { name: "7A", year: 7 }, T.skol_admin)
  );

  let subject_mat = null, subject_srp = null;
  if (klasa) {
    subject_mat = ok("Predmet: Matematika",
      await post("/school/subjects", { name: "Matematika", class_id: klasa.id }, T.skol_admin)
    );
    subject_srp = ok("Predmet: Srpski jezik",
      await post("/school/subjects", { name: "Srpski jezik", class_id: klasa.id }, T.skol_admin)
    );
  }

  // ── 10. Škola: učenici ────────────────────────────────
  section("10. Škola — Učenici");

  const ucenikV   = await get("/auth/verify", T.ucenik);
  const roditeljV = await get("/auth/verify", T.roditelj);

  let student = null;
  if (ucenikV && klasa) {
    student = ok("Učenik kreiran",
      await post("/school/students", {
        user_id: ucenikV.sub,
        first_name: "Petar",
        last_name: "Lazarević",
        date_of_birth: "2012-09-10",
        parent_user_id: roditeljV?.sub,
        class_id: klasa.id,
      }, T.skol_admin)
    );
  }

  // ── 11. Škola: upis ───────────────────────────────────
  section("11. Škola — Zahtjev za upis");

  const enrollment = ok("Zahtjev za upis",
    await post("/school/enrollments", { first_name: "Petar", last_name: "Lazarević", date_of_birth: "2012-09-10", school_year: "2025/2026", notes: "Upis u 7. razred" }, T.roditelj)
  );
  if (enrollment) ok("Upis odobren",
    await patch(`/school/enrollments/${enrollment.id}/status`, { status: "approved", notes: "Dokumentacija kompletna" }, T.skol_admin)
  );

  // ── 12. Škola: ocjene i prisustvo ─────────────────────
  section("12. Škola — Ocjene i prisustvo");

  if (student && subject_mat) {
    ok("Ocjena: Matematika (4)",
      await post("/school/grades", { student_id: student.id, subject_id: subject_mat.id, value: 4, comment: "Dobar rad" }, T.nastavnik)
    );
    ok("Ocjena: Srpski jezik (5)",
      await post("/school/grades", { student_id: student.id, subject_id: subject_srp.id, value: 5, comment: "Odličan esej" }, T.nastavnik)
    );
    ok("Prisustvo - prisutan",
      await post("/school/attendance", { student_id: student.id, subject_id: subject_mat.id, date: "2025-06-10", status: "present" }, T.nastavnik)
    );
    ok("Prisustvo - odsutan",
      await post("/school/attendance", { student_id: student.id, subject_id: subject_mat.id, date: "2025-06-11", status: "absent" }, T.nastavnik)
    );
  }

  // ── 13. Škola: opravdavanje ───────────────────────────
  section("13. Škola — Opravdavanje izostanaka");

  if (student) {
    const absence = ok("Zahtjev za opravdanje",
      await post("/school/absences", { student_id: student.id, start_date: "2025-06-11", end_date: "2025-06-11", reason: "Bolest - prehlada" }, T.roditelj)
    );
    if (absence) ok("Opravdanje odobreno",
      await patch(`/school/absences/${absence.id}/status`, { status: "approved" }, T.skol_admin)
    );
  }

  // ── 14. Škola: termin ─────────────────────────────────
  section("14. Škola — Zakazivanje termina");

  ok("Termin zakazan",
    await post("/school/appointments", { type: "parent_teacher", date_time: "2025-07-20T16:00:00Z", notes: "Razgovor o napretku učenika" }, T.roditelj)
  );

  // ── 15. Medicinska potvrda ────────────────────────────
  section("15. Integracija — Medicinska potvrda");

  if (patient) {
    ok("Medicinska potvrda izdata",
      await post("/health/medical-certificates", { patient_id: patient.id, patient_name: "Ana Petrović", type: "sport", valid_from: "2025-09-01", valid_to: "2026-06-30", notes: "Sposobna za nastavu fizičkog" }, T.lekar)
    );
  }

  // ── Završetak ─────────────────────────────────────────
  section("✓ Seed završen!");
  console.log(`
  Lozinka za sve naloge: test1234
  ┌─────────────────────────────────┬──────────────────┐
  │ Email                           │ Uloga            │
  ├─────────────────────────────────┼──────────────────┤
  │ pacijent@test.rs                │ Pacijent         │
  │ lekar@test.rs                   │ Lekar            │
  │ medicinska@test.rs              │ Medicinska sestra│
  │ zdravstvo.admin@test.rs         │ Admin zdravstvo  │
  │ ucenik@test.rs                  │ Učenik           │
  │ roditelj@test.rs                │ Roditelj         │
  │ nastavnik@test.rs               │ Nastavnik        │
  │ skola.admin@test.rs             │ Admin škola      │
  └─────────────────────────────────┴──────────────────┘
`);
}

main().catch(console.error);
