package auth

import (
	"context"
	"errors"
	"sync"
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
	Login(ctx context.Context, username, password, clientIP, honeypot string) (string, error)
	VerifyToken(tokenString string) (*Claims, error)
	RefreshToken(ctx context.Context, currentTokenString string) (string, error)
}

var (
	ErrHoneypotTriggered = errors.New("honeypot triggered")
	ErrUnauthorized      = errors.New("unauthorized")
)

// BlockedError is returned when an IP is currently blocked due to excessive failed attempts.
type BlockedError struct {
	Remaining time.Duration
}

func (e *BlockedError) Error() string {
	return "IP blocked"
}

type ipTracker struct {
	attempts  int
	blockedAt time.Time
}

type authService struct {
	jwtSecret  []byte
	adminUser  string
	adminPass  string
	sellerUser string
	sellerPass string

	// IP Lockout Cache
	ipMu    sync.RWMutex
	ipCache map[string]*ipTracker
}

// NewService creates a new instance of AuthService.
func NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass string) AuthService {
	return &authService{
		jwtSecret:  []byte(jwtSecret),
		adminUser:  adminUser,
		adminPass:  adminPass,
		sellerUser: sellerUser,
		sellerPass: sellerPass,
		ipCache:    make(map[string]*ipTracker),
	}
}

func (s *authService) Login(ctx context.Context, username, password, clientIP, honeypot string) (string, error) {
	if honeypot != "" {
		return "", ErrHoneypotTriggered
	}

	// Check IP lockout
	s.ipMu.Lock()
	if clientIP != "" {
		if tracker, exists := s.ipCache[clientIP]; exists {
			if tracker.attempts >= 5 {
				if time.Since(tracker.blockedAt) < time.Hour {
					remaining := time.Hour - time.Since(tracker.blockedAt)
					s.ipMu.Unlock()
					return "", &BlockedError{Remaining: remaining}
				}
				// Lockout expired, reset attempts
				tracker.attempts = 0
			}
		} else {
			s.ipCache[clientIP] = &ipTracker{}
		}
	}
	s.ipMu.Unlock()

	var role string
	var authenticated bool
	if username == s.adminUser && password == s.adminPass {
		role = "admin"
		authenticated = true
	} else if username == s.sellerUser && password == s.sellerPass {
		role = "seller"
		authenticated = true
	}

	if !authenticated {
		if clientIP != "" {
			s.ipMu.Lock()
			tracker := s.ipCache[clientIP]
			if tracker == nil {
				tracker = &ipTracker{}
				s.ipCache[clientIP] = tracker
			}
			tracker.attempts++
			if tracker.attempts >= 5 {
				tracker.blockedAt = time.Now()
			}
			s.ipMu.Unlock()
		}
		return "", ErrUnauthorized
	}

	// Reset attempts on successful login
	if clientIP != "" {
		s.ipMu.Lock()
		if tracker, exists := s.ipCache[clientIP]; exists {
			tracker.attempts = 0
		}
		s.ipMu.Unlock()
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

func (s *authService) RefreshToken(ctx context.Context, currentTokenString string) (string, error) {
	claims, err := s.VerifyToken(currentTokenString)
	if err != nil {
		return "", err
	}

	// Create a new token with updated times
	newClaims := &Claims{
		Role: claims.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
	return token.SignedString(s.jwtSecret)
}

