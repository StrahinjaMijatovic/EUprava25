package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreatePatientRequest struct {
	FirstName    string `json:"first_name" binding:"required"`
	LastName     string `json:"last_name" binding:"required"`
	DateOfBirth  string `json:"date_of_birth"`
	HealthCardNo string `json:"health_card_no"`
}

func createPatient(c *gin.Context) {
	var req CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var dob time.Time
	if req.DateOfBirth != "" {
		if d, err := time.Parse("2006-01-02", req.DateOfBirth); err == nil {
			dob = d
		}
	}
	patient := Patient{
		UserID:       getUserID(c),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		DateOfBirth:  dob,
		HealthCardNo: req.HealthCardNo,
	}
	if result := db.Create(&patient); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, patient)
}

func getPatient(c *gin.Context) {
	id := c.Param("id")
	var patient Patient
	var err error
	if id == "me" {
		err = db.Where("user_id = ?", getUserID(c)).First(&patient).Error
	} else {
		err = db.First(&patient, "id = ?", id).Error
	}
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "patient not found"})
		return
	}
	c.JSON(http.StatusOK, patient)
}

func listPatients(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "administrator" && role != "medicinska_sestra" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var patients []Patient
	db.Scopes(paginate(c)).Find(&patients)
	c.JSON(http.StatusOK, patients)
}

type CreateDoctorRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Specialty string `json:"specialty"`
}

func createDoctor(c *gin.Context) {
	role := getRole(c)
	if role != "lekar" && role != "administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateDoctorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	doctor := Doctor{
		UserID:    getUserID(c),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Specialty: req.Specialty,
	}
	if result := db.Create(&doctor); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, doctor)
}

func getMyDoctor(c *gin.Context) {
	var doctor Doctor
	if err := db.Where("user_id = ?", getUserID(c)).First(&doctor).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "doctor profile not found"})
		return
	}
	c.JSON(http.StatusOK, doctor)
}

func listDoctors(c *gin.Context) {
	var doctors []Doctor
	query := db
	if specialty := c.Query("specialty"); specialty != "" {
		query = query.Where("specialty ILIKE ?", "%"+specialty+"%")
	}
	query.Scopes(paginate(c)).Find(&doctors)
	c.JSON(http.StatusOK, doctors)
}