package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	ssoURL := os.Getenv("SSO_SERVICE_URL")
	schoolURL := os.Getenv("SCHOOL_SERVICE_URL")
	healthURL := os.Getenv("HEALTH_SERVICE_URL")

	proxy := func(c *gin.Context, target string) {
		remote, err := url.Parse(target)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid target url"})
			return
		}
		proxy := httputil.NewSingleHostReverseProxy(remote)
		proxy.Director = func(req *http.Request) {
			req.Header = c.Request.Header
			req.Host = remote.Host
			req.URL.Scheme = remote.Scheme
			req.URL.Host = remote.Host
			req.URL.Path = c.Param("path")
		}
		proxy.ServeHTTP(c.Writer, c.Request)
	}

	r.Any("/api/auth/*path", func(c *gin.Context) {
		proxy(c, ssoURL)
	})

	r.Any("/api/sso/*path", func(c *gin.Context) {
		proxy(c, ssoURL)
	})

	r.Any("/api/school/*path", func(c *gin.Context) {
		proxy(c, schoolURL)
	})

	r.Any("/api/health/*path", func(c *gin.Context) {
		proxy(c, healthURL)
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "api-gateway"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
