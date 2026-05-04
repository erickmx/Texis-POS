package auth

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims defines the JWT payload structure.
type Claims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// AuthService defines the business logic for authentication.
type AuthService interface {
	Login(ctx context.Context, username, password string) (string, error)
	VerifyToken(tokenString string) (*Claims, error)
}

type authService struct {
	jwtSecret  []byte
	adminUser  string
	adminPass  string
	sellerUser string
	sellerPass string
}

// NewService creates a new instance of AuthService.
func NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass string) AuthService {
	return &authService{
		jwtSecret:  []byte(jwtSecret),
		adminUser:  adminUser,
		adminPass:  adminPass,
		sellerUser: sellerUser,
		sellerPass: sellerPass,
	}
}

func (s *authService) Login(ctx context.Context, username, password string) (string, error) {
	var role string
	if username == s.adminUser && password == s.adminPass {
		role = "admin"
	} else if username == s.sellerUser && password == s.sellerPass {
		role = "seller"
	} else {
		return "", errors.New("unauthorized")
	}

	claims := &Claims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *authService) VerifyToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
