package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const maxUploadSize = 10 << 20 // 10 MB

var allowedExtensions = map[string]bool{
	".pdf":  true,
	".doc":  true,
	".docx": true,
	".jpg":  true,
	".jpeg": true,
	".png":  true,
}

func handleFileUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file exceeds 10MB limit"})
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file type not allowed, use pdf/doc/docx/jpg/png"})
		return
	}
	uploadDir := "/uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create upload directory"})
		return
	}
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(file.Filename))
	savePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"url":      "/uploads/" + filename,
		"filename": filename,
	})
}