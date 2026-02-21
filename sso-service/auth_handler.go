package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	Svc AuthService
}

var validRoles = map[string]bool{
	"pacijent": true, "lekar": true, "medicinska_sestra": true,
	"ucenik": true, "roditelj": true, "nastavnik": true,
	"administracija": true, "administrator": true, "admin": true,
}

type RegisterReq struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Role      string `json:"role"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type LoginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type TokenResp struct {
	Token string `json:"token"`
}

func (h AuthHandler) Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = "pacijent"
	}
	if !validRoles[role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	id, created, err := h.Svc.Register(c.Request.Context(), req.Email, req.Password, role, req.FirstName, req.LastName)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			c.JSON(http.StatusConflict, gin.H{"error": "email already exists"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db error: " + err.Error()})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "email": req.Email, "role": role, "first_name": req.FirstName, "last_name": req.LastName, "created_at": created})
}

func (h AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	tok, err := h.Svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	c.JSON(http.StatusOK, TokenResp{Token: tok})
}

func (h AuthHandler) Verify(c *gin.Context) {
	val, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing claims"})
		return
	}
	claims, ok := val.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid claims"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"sub": claims["sub"], "email": claims["email"], "role": claims["role"], "exp": claims["exp"],
	})
}
