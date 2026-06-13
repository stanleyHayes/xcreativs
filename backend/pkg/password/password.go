package password

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Hash hashes a plaintext password using bcrypt.
func Hash(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(bytes), nil
}

// Verify checks a plaintext password against a bcrypt hash.
func Verify(plain, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
	return err == nil
}
