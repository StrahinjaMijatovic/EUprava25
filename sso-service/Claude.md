Specifikacija Euprava25
5 funkcionalnosti za osnovne/srednje škole
1.
Elektronska prijava i evidencija učenika – Omogućava roditeljima ili učenicima elektronsko podnošenje prijave za upis u školu, uz automatsku evidenciju i unos podataka u sistem.
2.
Pregled i preuzimanje dokumenata – Izbor i preuzimanje dokumenata kao što su potvrde o školovanju, svedočanstva ili izveštaji o postignuću.
3.
Elektronski dnevnik prisustva i ocena – Unos i pregled prisustva, izostanaka i ocena od strane nastavnika, kao i roditelja. Roditelji mogu pristupiti uvidima o detetu.
4.
Zakazivanje termina (sastanci sa nastavnicima ili testiranje učenika) – Roditelji mogu elektronski zakazati termin razgovora sa nastavnikom, psihologom ili testiranje deteta.
5.
Digitalno opravdavanje izostanaka - upload medicinskih potvrda/opravdanja
5 funkcionalnosti za zdravstvo
1.
Elektronsko zakazivanje pregleda – Građani mogu putem portala zakazati termin kod izabranog lekara, laboratorijske analize ili vakcinaciju.
2.
Pregled izdatih elektronskih recepata – Pristup istoriji izdatih e-recepata i mogućnost provere statusa svakog recepta.
3.
Slanje i primanje poruka sa lekarom – Pacijenti mogu elektronski komunicirati sa svojim lekarom (zahtev za konsultaciju, pitanja o terapiji).
4.
Uvid u zdravstvene podatke i eKarton – Omogućava korisnicima pregled zdravstvenog kartona, izveštaja o pregledu i laboratorijskih nalaza.
5.
Podnošenje zahteva za izdavanje/zamenu zdravstvene knjižice – Elektronsko podnošenje zahteva i praćenje statusa izrade ili zamene kartice/knjižice.
POVEZANOST IZMEĐU SERVISA
Razmena 1:
Pri upisu učenika ili prijavi na prijemni ispit, automatski povući iz zdravstvenog sistema potvrdu o obavljenom lekarskom pregledu (1. i 4. iz školstva povezano sa 4. iz zdravstva).
Razmena 2: Zdravstvo → Škole
•
Potvrde o zdravstvenom stanju za sport/ekskurzije
•
Medicinska opravdanja za izostanke
Razmena 3: SSO sistem ↔ Oba servisa
•
Autentifikacija i autorizacija korisnika
Tehnologije
•
Backend: Go (Golang)
•
Frontend: React
•
Baza podataka: PostgreSQL
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ React Frontend │ │ API Gateway │ │ SSO Service │
│ │◄──►│ │◄──►│ │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│
┌────────┴────────┐
│ │
┌─────────▼──────┐ ┌───────▼─────────┐
│ Škole Service │ │ Zdravstvo Service│
│ (Go + Gin) │ │ (Go + Gin) │
└─────────┬──────┘ └───────┬─────────┘
│ │
┌─────────▼──────┐ ┌───────▼─────────┐
│ PostgreSQL DB │ │ PostgreSQL DB │
└────────────────┘ └─────────────────┘
Docker servisi:
•
sso-service - autentifikacija
•
school-service - školske funkcionalnosti
•
health-service - zdravstvene funkcionalnosti
•
api-gateway - rutiranje zahteva
•
frontend - React aplikacija
•
postgres-school - baza za škole
•
postgres-health - baza za zdravstvo
•
postgres-sso - baza za korisnike
Detaljnije korisničke uloge
KORISNIČKE ULOGE:
Školstvo:
- Učenik (pregled ocena, opravdavanje)
- Roditelj (uvid u podatke deteta, zakazivanje)
- Nastavnik (unos ocena, prisustva)
- Administracija (upravljanje upisima)
Zdravstvo:
- Pacijent (zakazivanje, pregled kartona)
- Lekar (izdavanje recepata, komunikacija)
- Medicinska sestra (vakcinacija, laboratorija)
- Administrator (izdavanje knjižica)