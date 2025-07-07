package main

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Port handlers
func getPorts(c *gin.Context) {
	var ports []Port
	db.Preload("Lock").Find(&ports)
	c.JSON(http.StatusOK, ports)
}

func getPaginatedPorts(c *gin.Context) {
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 20
	}

	var total int64
	db.Model(&Port{}).Count(&total)

	var ports []Port
	db.Preload("Lock").Offset((page - 1) * limit).Limit(limit).Find(&ports)

	c.JSON(http.StatusOK, gin.H{
		"ports": ports,
		"total": total,
	})
}

func lockPort(c *gin.Context) {
	portID := c.Param("id")
	developerID := c.PostForm("developer_id") // GitHub username

	// Validate user exists and is active
	var user User
	if err := db.Where("username = ? AND active = ?", developerID, true).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Unknown developer ID. Contact admin to add user.",
				"details": "Developer '" + developerID + "' is not in the authorized users list.",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while validating user"})
		return
	}

	// Check if port exists
	var port Port
	if err := db.First(&port, portID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Port not found"})
		return
	}

	// Check if already locked
	var existingLock Lock
	if err := db.Where("port_id = ?", portID).First(&existingLock).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":      "Port already locked",
			"locked_by":  existingLock.DeveloperName,
			"locked_at":  existingLock.LockedAt,
			"expires_at": existingLock.ExpiresAt,
		})
		return
	}

	// Create lock with validated user data
	lock := Lock{
		PortID:        port.ID,
		DeveloperName: user.Name,     // Use the name from user table
		DeveloperID:   user.Username, // Use the validated username
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

// User management handlers
func getUsers(c *gin.Context) {
	var users []User
	db.Where("active = ?", true).Order("name").Find(&users)
	c.JSON(http.StatusOK, users)
}

func createUser(c *gin.Context) {
	var user User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure user is marked as active
	user.Active = true

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func updateUser(c *gin.Context) {
	username := c.Param("username")

	var user User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var updateData User
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update allowed fields
	user.Name = updateData.Name
	user.Email = updateData.Email
	user.AvatarURL = updateData.AvatarURL
	user.Active = updateData.Active

	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func deactivateUser(c *gin.Context) {
	username := c.Param("username")

	var user User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.Active = false
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deactivated successfully"})
}

// PR and build handlers
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
