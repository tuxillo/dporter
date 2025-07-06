package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func getPorts(c *gin.Context) {
	var ports []Port
	db.Preload("Lock").Find(&ports)
	c.JSON(http.StatusOK, ports)
}

func lockPort(c *gin.Context) {
	portID := c.Param("id")

	var port Port
	if err := db.First(&port, portID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Port not found"})
		return
	}

	// Check if already locked
	var existingLock Lock
	if err := db.Where("port_id = ?", portID).First(&existingLock).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Port already locked"})
		return
	}

	// Create lock
	lock := Lock{
		PortID:        port.ID,
		DeveloperName: c.PostForm("developer_name"),
		DeveloperID:   c.PostForm("developer_id"),
		LockedAt:      time.Now(),
		ExpiresAt:     time.Now().Add(24 * time.Hour), // 24 hour lock
	}

	if err := db.Create(&lock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock port"})
		return
	}

	c.JSON(http.StatusOK, lock)
}

func unlockPort(c *gin.Context) {
	portID := c.Param("id")

	if err := db.Where("port_id = ?", portID).Delete(&Lock{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlock port"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Port unlocked successfully"})
}

func getPortStatus(c *gin.Context) {
	portID := c.Param("id")

	var port Port
	if err := db.Preload("Lock").Preload("PRs").First(&port, portID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Port not found"})
		return
	}

	c.JSON(http.StatusOK, port)
}

func registerPR(c *gin.Context) {
	var pr PR
	if err := c.ShouldBindJSON(&pr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Create(&pr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register PR"})
		return
	}

	c.JSON(http.StatusCreated, pr)
}

func handleBuildWebhook(c *gin.Context) {
	// TODO: Implement GitHub webhook handling
	c.JSON(http.StatusOK, gin.H{"message": "Webhook received"})
}

func seedPorts() {
	// Check if ports already exist
	var count int64
	db.Model(&Port{}).Count(&count)
	if count > 0 {
		return
	}

	// Sample broken ports
	ports := []Port{
		{Name: "textproc/ripgrep", Category: "textproc", Status: "broken", Description: "Fast grep alternative"},
		{Name: "devel/git", Category: "devel", Status: "broken", Description: "Distributed version control system"},
		{Name: "www/nginx", Category: "www", Status: "broken", Description: "HTTP and reverse proxy server"},
		{Name: "databases/postgresql13", Category: "databases", Status: "broken", Description: "PostgreSQL database server"},
		{Name: "lang/rust", Category: "lang", Status: "broken", Description: "Rust programming language"},
	}

	db.Create(&ports)
}
