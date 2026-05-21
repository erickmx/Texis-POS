package auth

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAuthService(t *testing.T) {
	jwtSecret := "test-secret"
	adminUser := "admin"
	adminPass := "admin123"
	sellerUser := "seller"
	sellerPass := "seller123"

	svc := NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass)
	ctx := context.Background()

	t.Run("Login Success - Admin", func(t *testing.T) {
		token, err := svc.Login(ctx, adminUser, adminPass, "127.0.0.1", "")
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		claims, err := svc.VerifyToken(token)
		assert.NoError(t, err)
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("Login Success - Seller", func(t *testing.T) {
		token, err := svc.Login(ctx, sellerUser, sellerPass, "127.0.0.1", "")
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		claims, err := svc.VerifyToken(token)
		assert.NoError(t, err)
		assert.Equal(t, "seller", claims.Role)
	})

	t.Run("Login Failure - Invalid Credentials", func(t *testing.T) {
		token, err := svc.Login(ctx, "wrong", "wrong", "127.0.0.2", "")
		assert.Error(t, err)
		assert.Empty(t, token)
		assert.Equal(t, ErrUnauthorized, err)
	})

	t.Run("Honeypot Triggered", func(t *testing.T) {
		token, err := svc.Login(ctx, adminUser, adminPass, "127.0.0.3", "bot-triggered")
		assert.Error(t, err)
		assert.Empty(t, token)
		assert.Equal(t, ErrHoneypotTriggered, err)
	})

	t.Run("IP Lockout Triggered", func(t *testing.T) {
		testIP := "192.168.1.50"
		// 5 failed attempts
		for i := 0; i < 5; i++ {
			_, err := svc.Login(ctx, "wrong", "wrong", testIP, "")
			assert.Equal(t, ErrUnauthorized, err)
		}

		// 6th attempt should return BlockedError
		_, err := svc.Login(ctx, adminUser, adminPass, testIP, "")
		assert.Error(t, err)
		
		blockedErr, ok := err.(*BlockedError)
		assert.True(t, ok)
		assert.True(t, blockedErr.Remaining > 0 && blockedErr.Remaining <= 1*time.Hour)
	})

	t.Run("RefreshToken Success", func(t *testing.T) {
		token, err := svc.Login(ctx, adminUser, adminPass, "127.0.0.1", "")
		assert.NoError(t, err)

		refreshedToken, err := svc.RefreshToken(ctx, token)
		assert.NoError(t, err)
		assert.NotEmpty(t, refreshedToken)

		claims, err := svc.VerifyToken(refreshedToken)
		assert.NoError(t, err)
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("VerifyToken Failure - Invalid Secret", func(t *testing.T) {
		token, _ := svc.Login(ctx, adminUser, adminPass, "127.0.0.1", "")
		
		// Create a service with a different secret
		otherSvc := NewService("wrong-secret", adminUser, adminPass, sellerUser, sellerPass)
		claims, err := otherSvc.VerifyToken(token)
		assert.Error(t, err)
		assert.Nil(t, claims)
	})

	t.Run("VerifyToken Failure - Malformed Token", func(t *testing.T) {
		claims, err := svc.VerifyToken("not-a-token")
		assert.Error(t, err)
		assert.Nil(t, claims)
	})
}
