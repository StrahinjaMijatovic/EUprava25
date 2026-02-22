package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 3. Slanje i primanje poruka sa lekarom

type CreateMessageRequest struct {
	ReceiverID string `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

func createMessage(c *gin.Context) {
	var req CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	msg := Message{
		SenderID:   getUserID(c),
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		IsRead:     false,
	}
	if result := db.Create(&msg); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusCreated, msg)
}

func listMessages(c *gin.Context) {
	userID := getUserID(c)
	otherUserID := c.Query("with")
	if otherUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing 'with' query parameter"})
		return
	}
	var msgs []Message
	db.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		userID, otherUserID, otherUserID, userID,
	).Order("created_at asc").Scopes(paginate(c)).Find(&msgs)

	// Mark incoming messages as read
	db.Model(&Message{}).
		Where("receiver_id = ? AND sender_id = ? AND is_read = false", userID, otherUserID).
		Update("is_read", true)

	c.JSON(http.StatusOK, msgs)
}

func listConversations(c *gin.Context) {
	userID := getUserID(c)
	var msgs []Message
	// Get the latest message per unique conversation partner
	db.Raw(`
		SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
		*
		FROM messages
		WHERE sender_id = ? OR receiver_id = ?
		ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
	`, userID, userID).Scan(&msgs)
	c.JSON(http.StatusOK, msgs)
}