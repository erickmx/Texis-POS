package auth

import (
	"strings"

	"github.com/gofiber/fiber/v3"
)

// verifyToken is a helper to validate the token and return claims.
func verifyToken(svc AuthService, c fiber.Ctx) (*Claims, error) {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Missing session token")
	}

	// Check for Bearer prefix
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Invalid token format")
	}

	tokenString := parts[1]
	claims, err := svc.VerifyToken(tokenString)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Unauthorized: Invalid or expired token")
	}

	return claims, nil
}

// IsAuthenticated checks if the request has a valid JWT token.
func IsAuthenticated(svc AuthService) fiber.Handler {
	return func(c fiber.Ctx) error {
		claims, err := verifyToken(svc, c)
		if err != nil {
			return err
		}

		// Store claims in locals for further use
		c.Locals("user_role", claims.Role)

		return c.Next()
	}
}

// RequireRole checks if the authenticated user has a specific role.
func RequireRole(svc AuthService, requiredRole string) fiber.Handler {
	return func(c fiber.Ctx) error {
		claims, err := verifyToken(svc, c)
		if err != nil {
			return err
		}

		if claims.Role != requiredRole {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: Access restricted",
			})
		}

		// Store claims in locals for further use
		c.Locals("user_role", claims.Role)

		return c.Next()
	}
}

// IsAdmin is a middleware that ensures the user has the 'admin' role.
func IsAdmin(svc AuthService) fiber.Handler {
	return RequireRole(svc, "admin")
}

// IsSeller is a middleware that ensures the user has the 'seller' role.
func IsSeller(svc AuthService) fiber.Handler {
	return RequireRole(svc, "seller")
}
