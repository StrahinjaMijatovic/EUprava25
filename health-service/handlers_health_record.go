package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// 4. Uvid u zdravstvene podatke i eKarton

type CreateHealthRecordRequest struct {
	PatientID  string `json:"patient_id" binding:"required"`
	Diagnosis  string `json:"diagnosis" binding:"required"`
	Treatment  string `json:"treatment"`
	RecordDate string `json:"record_date"`
}

func createHealthRecord(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "medicinska_sestra" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateHealthRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	recDate := time.Now()
	if req.RecordDate != "" {
		if d, err := time.Parse("2006-01-02", req.RecordDate); err == nil {
			recDate = d
		}
	}
	record := HealthRecord{
		PatientID:  req.PatientID,
		DoctorID:   getUserID(c),
		Diagnosis:  req.Diagnosis,
		Treatment:  req.Treatment,
		RecordDate: recDate,
	}
	if result := db.Create(&record); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, record)
}

func listHealthRecords(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var records []HealthRecord
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
	query.Order("record_date desc").Scopes(paginate(c)).Find(&records)
	c.JSON(http.StatusOK, records)
}

// Lab rezultati

type CreateLabResultRequest struct {
	PatientID  string `json:"patient_id" binding:"required"`
	TestName   string `json:"test_name" binding:"required"`
	Result     string `json:"result" binding:"required"`
	ResultDate string `json:"result_date"`
}

func createLabResult(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "medicinska_sestra" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateLabResultRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	resDate := time.Now()
	if req.ResultDate != "" {
		if d, err := time.Parse("2006-01-02", req.ResultDate); err == nil {
			resDate = d
		}
	}
	labResult := LabResult{
		PatientID:  req.PatientID,
		TestName:   req.TestName,
		Result:     req.Result,
		ResultDate: resDate,
		DoctorID:   getUserID(c),
	}
	if result := db.Create(&labResult); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, labResult)
}

func listLabResults(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var results []LabResult
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
	query.Order("result_date desc").Scopes(paginate(c)).Find(&results)
	c.JSON(http.StatusOK, results)
}