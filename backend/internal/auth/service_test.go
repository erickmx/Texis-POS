package auth

import (
	"context"
	"testing"

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
		token, err := svc.Login(ctx, adminUser, adminPass)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		claims, err := svc.VerifyToken(token)
		assert.NoError(t, err)
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("Login Success - Seller", func(t *testing.T) {
		token, err := svc.Login(ctx, sellerUser, sellerPass)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)

		claims, err := svc.VerifyToken(token)
		assert.NoError(t, err)
		assert.Equal(t, "seller", claims.Role)
	})

	t.Run("Login Failure - Invalid Credentials", func(t *testing.T) {
		token, err := svc.Login(ctx, "wrong", "wrong")
		assert.Error(t, err)
		assert.Empty(t, token)
		assert.Equal(t, "unauthorized", err.Error())
	})

	t.Run("VerifyToken Failure - Invalid Secret", func(t *testing.T) {
		token, _ := svc.Login(ctx, adminUser, adminPass)
		
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
