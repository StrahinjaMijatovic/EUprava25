package main

import (
	"log"
)

func main() {
	cfg := Load()
	pool := NewPool(cfg.Database)

	jwtMaker := Maker{Secret: cfg.JWTSecret, TTL: cfg.JWTTTL}
	authSvc := AuthService{DB: pool, JWTMaker: jwtMaker}
	authH := AuthHandler{Svc: authSvc}

	r := New(Deps{
		AuthHandler: authH,
		JWTSecret:   cfg.JWTSecret,
	})

	log.Printf("SSO listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
