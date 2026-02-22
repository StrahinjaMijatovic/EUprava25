package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 5. Podnošenje zahteva za zdravstvenu knjižicu

type CreateHealthCardRequestBody struct {
	RequestType string `json:"request_type" binding:"required"`
	Notes       string `json:"notes"`
}

func createHealthCardRequest(c *gin.Context) {
	var req CreateHealthCardRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var patient Patient
	if result := db.Where("user_id = ?", getUserID(c)).First(&patient); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "patient profile not found"})
		return
	}
	hcr := HealthCardRequest{
		PatientID:   patient.ID,
		RequestType: req.RequestType,
		Status:      "pending",
		Notes:       req.Notes,
	}
	if result := db.Create(&hcr); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, hcr)
}

func listHealthCardRequests(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var requests []HealthCardRequest
	query := db
	if role == "pacijent" {
		var patient Patient
		if result := db.Where("user_id = ?", userID).First(&patient); result.Error == nil {
			query = query.Where("patient_id = ?", patient.ID)
		}
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	query.Order("created_at desc").Scopes(paginate(c)).Find(&requests)
	c.JSON(http.StatusOK, requests)
}

type UpdateHealthCardStatusRequest struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

func updateHealthCardRequestStatus(c *gin.Context) {
	role := getRole(c)
	if role != "administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admins can update request status"})
		return
	}
	id := c.Param("id")
	var req UpdateHealthCardStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result := db.Model(&HealthCardRequest{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status": req.Status,
		"notes":  req.Notes,
	})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status updated"})
}