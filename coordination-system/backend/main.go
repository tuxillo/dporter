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
	db, err = gorm.Open(sqlite.Open("coordination.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate models
	db.AutoMigrate(&Port{}, &Lock{}, &PR{}, &Build{})

	// Seed initial data
	seedPorts()

	// Setup router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.Default())

	// API routes
	api := r.Group("/api/v1")
	{
		api.GET("/ports", getPorts)
		api.POST("/ports/:id/lock", lockPort)
		api.DELETE("/ports/:id/lock", unlockPort)
		api.GET("/ports/:id/status", getPortStatus)
		api.POST("/prs", registerPR)
		api.POST("/builds/webhook", handleBuildWebhook)
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
