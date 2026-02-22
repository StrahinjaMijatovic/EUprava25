package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Medicinske potvrde (integracija sa školom)

type CreateMedicalCertificateRequest struct {
	PatientID   string `json:"patient_id" binding:"required"`
	PatientName string `json:"patient_name" binding:"required"`
	Type        string `json:"type" binding:"required"`
	ValidFrom   string `json:"valid_from" binding:"required"`
	ValidTo     string `json:"valid_to" binding:"required"`
	Notes       string `json:"notes"`
}

func createMedicalCertificate(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only doctors can issue medical certificates"})
		return
	}
	var req CreateMedicalCertificateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	validFrom, err := time.Parse("2006-01-02", req.ValidFrom)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid valid_from date"})
		return
	}
	validTo, err := time.Parse("2006-01-02", req.ValidTo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid valid_to date"})
		return
	}
	cert := MedicalCertificate{
		PatientID:   req.PatientID,
		PatientName: req.PatientName,
		Type:        req.Type,
		ValidFrom:   validFrom,
		ValidTo:     validTo,
		DoctorID:    getUserID(c),
		Notes:       req.Notes,
		IssuedAt:    time.Now(),
	}
	if result := db.Create(&cert); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, cert)
}

func listMedicalCertificates(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var certs []MedicalCertificate
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
	if certType := c.Query("type"); certType != "" {
		query = query.Where("type = ?", certType)
	}
	query.Order("issued_at desc").Scopes(paginate(c)).Find(&certs)
	c.JSON(http.StatusOK, certs)
}

func getMedicalCertificate(c *gin.Context) {
	id := c.Param("id")
	var cert MedicalCertificate
	if result := db.First(&cert, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "certificate not found"})
		return
	}
	c.JSON(http.StatusOK, cert)
}