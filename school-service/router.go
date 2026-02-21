package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func setupRouter(jwtSecret []byte) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "school-service"})
	})

	// File upload (requires auth)
	r.POST("/uploads", AuthMiddleware(jwtSecret), handleFileUpload)

	api := r.Group("", AuthMiddleware(jwtSecret))
	{
		// 1. Elektronska prijava i evidencija učenika
		api.POST("/enrollments", createEnrollment)
		api.GET("/enrollments", listEnrollments)
		api.GET("/enrollments/:id", getEnrollment)
		api.PATCH("/enrollments/:id/status", updateEnrollmentStatus)

		// Učenici
		api.POST("/students", createStudent)
		api.GET("/students", listStudents)
		api.GET("/students/:id", getStudent)

		// Odeljenja i predmeti
		api.POST("/classes", createClass)
		api.GET("/classes", listClasses)
		api.POST("/subjects", createSubject)
		api.GET("/subjects", listSubjects)

		// 2. Pregled i preuzimanje dokumenata
		api.POST("/documents", createDocument)
		api.GET("/documents", listDocuments)
		api.GET("/documents/:id", getDocument)

		// 3. Elektronski dnevnik - ocene
		api.POST("/grades", createGrade)
		api.GET("/grades", listGrades)
		api.DELETE("/grades/:id", deleteGrade)

		// 3. Elektronski dnevnik - prisustvo
		api.POST("/attendance", createAttendance)
		api.GET("/attendance", listAttendance)

		// 4. Zakazivanje termina
		api.POST("/appointments", createSchoolAppointment)
		api.GET("/appointments", listSchoolAppointments)
		api.PATCH("/appointments/:id/status", updateSchoolAppointmentStatus)

		// 5. Digitalno opravdavanje izostanaka
		api.POST("/absences", createAbsenceJustification)
		api.GET("/absences", listAbsenceJustifications)
		api.PATCH("/absences/:id/status", updateAbsenceStatus)
	}

	return r
}