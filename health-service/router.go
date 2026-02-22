package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func setupRouter(jwtSecret []byte) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "health-service"})
	})

	api := r.Group("", AuthMiddleware(jwtSecret))
	{
		// Profili pacijenata i lekara
		api.POST("/patients", createPatient)
		api.GET("/patients", listPatients)
		api.GET("/patients/:id", getPatient)
		api.POST("/doctors", createDoctor)
		api.GET("/doctors/me", getMyDoctor)
		api.GET("/doctors", listDoctors)

		// 1. Elektronsko zakazivanje pregleda
		api.POST("/appointments", createHealthAppointment)
		api.GET("/appointments", listHealthAppointments)
		api.PATCH("/appointments/:id/status", updateHealthAppointmentStatus)

		// 2. Pregled izdatih elektronskih recepata
		api.POST("/prescriptions", createPrescription)
		api.GET("/prescriptions", listPrescriptions)
		api.PATCH("/prescriptions/:id/status", updatePrescriptionStatus)

		// 3. Slanje i primanje poruka sa lekarom
		api.POST("/messages", createMessage)
		api.GET("/messages", listMessages)
		api.GET("/conversations", listConversations)

		// 4. Uvid u zdravstvene podatke i eKarton
		api.POST("/health-records", createHealthRecord)
		api.GET("/health-records", listHealthRecords)
		api.POST("/lab-results", createLabResult)
		api.GET("/lab-results", listLabResults)

		// 5. Zahtev za zdravstvenu knjižicu
		api.POST("/health-card-requests", createHealthCardRequest)
		api.GET("/health-card-requests", listHealthCardRequests)
		api.PATCH("/health-card-requests/:id/status", updateHealthCardRequestStatus)

		// Medicinske potvrde (integracija zdravstvo ↔ škola)
		api.POST("/medical-certificates", createMedicalCertificate)
		api.GET("/medical-certificates", listMedicalCertificates)
		api.GET("/medical-certificates/:id", getMedicalCertificate)
	}

	return r
}
