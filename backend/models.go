package main

import (
	"time"
)

type Port struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"unique;not null"`
	Category    string    `json:"category"`
	Status      string    `json:"status" gorm:"default:broken"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Lock *Lock `json:"lock,omitempty" gorm:"foreignKey:PortID"`
	PRs  []PR  `json:"prs,omitempty" gorm:"foreignKey:PortID"`
}

type Lock struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	PortID        uint      `json:"port_id" gorm:"not null"`
	DeveloperID   string    `json:"developer_id"`
	DeveloperName string    `json:"developer_name" gorm:"not null"`
	LockedAt      time.Time `json:"locked_at"`
	ExpiresAt     time.Time `json:"expires_at"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PR struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	PortID    uint      `json:"port_id" gorm:"not null"`
	PRNumber  int       `json:"pr_number"`
	PRURL     string    `json:"pr_url"`
	Status    string    `json:"status" gorm:"default:open"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Builds []Build `json:"builds,omitempty" gorm:"foreignKey:PRID"`
}

type Build struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	PRID        uint       `json:"pr_id" gorm:"not null"`
	BuildID     string     `json:"build_id"`
	Status      string     `json:"status" gorm:"default:pending"`
	LogURL      string     `json:"log_url"`
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
