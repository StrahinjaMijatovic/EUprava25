package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 2. Pregled izdatih elektronskih recepata

type CreatePrescriptionRequest struct {
	PatientID  string `json:"patient_id" binding:"required"`
	Medication string `json:"medication" binding:"required"`
	Dosage     string `json:"dosage" binding:"required"`
	Duration   string `json:"duration"`
}

func createPrescription(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only doctors can issue prescriptions"})
		return
	}
	var req CreatePrescriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	presc := Prescription{
		PatientID:  req.PatientID,
		DoctorID:   getUserID(c),
		Medication: req.Medication,
		Dosage:     req.Dosage,
		Duration:   req.Duration,
		Status:     "active",
		IssuedAt:   time.Now(),
	}
	if result := db.Create(&presc); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, presc)
}

func listPrescriptions(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var prescs []Prescription
	query := db
	patientID := c.Query("patient_id")
	if role == "pacijent" {
		var patient Patient
		if result := db.Where("user_id = ?", userID).First(&patient); result.Error == nil {
			query = query.Where("patient_id = ?", patient.ID)
		}
	} else if patientID != "" {
		query = query.Where("patient_id = ?", patientID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("issued_at desc").Scopes(paginate(c)).Find(&prescs)
	c.JSON(http.StatusOK, prescs)
}

type UpdatePrescriptionStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

func updatePrescriptionStatus(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only doctors or admins can update prescription status"})
		return
	}
	id := c.Param("id")
	var req UpdatePrescriptionStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result := db.Model(&Prescription{}).Where("id = ?", id).Update("status", req.Status)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "prescription updated"})
}