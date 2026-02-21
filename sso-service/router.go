package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Deps struct {
	AuthHandler AuthHandler
	JWTSecret   []byte
}

func New(deps Deps) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "sso-service"})
	})

	api := r.Group("")
	{
		api.POST("/register", deps.AuthHandler.Register)
		api.POST("/login", deps.AuthHandler.Login)
		api.GET("/verify", Auth(deps.JWTSecret), deps.AuthHandler.Verify)
	}
	return r
}
