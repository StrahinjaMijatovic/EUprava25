package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 2. Pregled i preuzimanje dokumenata

type CreateDocumentRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	Type      string `json:"type" binding:"required"`
	Content   string `json:"content" binding:"required"`
}

func createDocument(c *gin.Context) {
	role := getRole(c)
	if role != "admin" && role != "administracija" && role != "nastavnik" {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}
	var req CreateDocumentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	doc := SchoolDocument{
		StudentID: req.StudentID,
		Type:      req.Type,
		Content:   req.Content,
		IssuedBy:  getUserID(c),
	}
	if result := db.Create(&doc); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, doc)
}

func listDocuments(c *gin.Context) {
	role := getRole(c)
	userID := getUserID(c)
	var docs []SchoolDocument
	query := db
	studentID := c.Query("student_id")
	if role == "ucenik" {
		var student Student
		if result := db.Where("user_id = ?", userID).First(&student); result.Error == nil {
			query = query.Where("student_id = ?", student.ID)
		}
	} else if role == "roditelj" {
		if studentID != "" {
			query = query.Where("student_id = ?", studentID)
		} else {
			var student Student
			if result := db.Where("parent_user_id = ?", userID).First(&student); result.Error == nil {
				query = query.Where("student_id = ?", student.ID)
			}
		}
	} else if studentID != "" {
		query = query.Where("student_id = ?", studentID)
	}
	if docType := c.Query("type"); docType != "" {
		query = query.Where("type = ?", docType)
	}
	query.Order("created_at desc").Scopes(paginate(c)).Find(&docs)
	c.JSON(http.StatusOK, docs)
}

func getDocument(c *gin.Context) {
	id := c.Param("id")
	var doc SchoolDocument
	if result := db.First(&doc, "id = ?", id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "document not found"})
		return
	}
	c.JSON(http.StatusOK, doc)
}