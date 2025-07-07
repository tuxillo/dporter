package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func main() {
	// Initialize database
	var err error
	db, err = gorm.Open(sqlite.Open("dporter.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate models (including new User model)
	db.AutoMigrate(&User{}, &Port{}, &Lock{}, &PR{}, &Build{})

	// Seed initial data
	seedUsers()
	seedPorts()

	// Setup router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.Default())

	// API routes
	api := r.Group("/api/v1")
	{
		// Port routes
		api.GET("/ports", getPorts)
		api.GET("/ports_paginated", getPaginatedPorts)
		api.POST("/ports/:id/lock", lockPort)
		api.DELETE("/ports/:id/lock", unlockPort)
		api.GET("/ports/:id/status", getPortStatus)

		// PR and build routes
		api.POST("/prs", registerPR)
		api.POST("/builds/webhook", handleBuildWebhook)

		// User management routes
		api.GET("/users", getUsers)
		api.POST("/users", createUser)
		api.PUT("/users/:username", updateUser)
		api.DELETE("/users/:username", deactivateUser)
	}

	// Serve frontend static files
	r.Static("/static", "../frontend/static")

	// Serve main HTML page
	r.GET("/", func(c *gin.Context) {
		c.File("../frontend/index.html")
	})

	log.Println("Server starting on :8080")
	log.Println("Frontend available at: http://localhost:8080")
	r.Run(":8080")
}

func seedUsers() {
	users := []User{
		{Username: "tuxillo", Name: "Antonio Huete Jimenez", Email: "", Active: true},
		{Username: "dillonb", Name: "Dillon", Email: "", Active: true},
		{Username: "sephe", Name: "Sepherosa Ziehau", Email: "", Active: true},
		{Username: "zrj-rim", Name: "Rimvydas Jasinskas", Email: "", Active: true},
		{Username: "swildner", Name: "Sascha Wildner", Email: "", Active: true},
		{Username: "corecode", Name: "Simon Schubert", Email: "", Active: true},
		{Username: "y0netan1", Name: "Tomohiro Kusumi", Email: "", Active: true},
		{Username: "dclink", Name: "Daniel Carosone", Email: "", Active: true},
		// Add more known DragonFly BSD developers as needed
	}

	for _, user := range users {
		var existing User
		if err := db.Where("username = ?", user.Username).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := db.Create(&user).Error; err != nil {
					log.Printf("Failed to create user %s: %v", user.Username, err)
				} else {
					log.Printf("Created user: %s (%s)", user.Username, user.Name)
				}
			}
		}
	}
}
