package http

import (
	"net/mail"
	"strings"
	"unicode/utf8"
)

// Validator provides common input validation helpers.
type Validator struct {
	Errors map[string]string
}

// NewValidator creates a new Validator instance.
func NewValidator() *Validator {
	return &Validator{Errors: make(map[string]string)}
}

// Valid returns true if there are no validation errors.
func (v *Validator) Valid() bool {
	return len(v.Errors) == 0
}

// Check adds an error if the condition is false.
func (v *Validator) Check(ok bool, field, message string) {
	if !ok {
		v.Errors[field] = message
	}
}

// Required checks that a string is not empty after trimming.
func (v *Validator) Required(field, value, message string) {
	v.Check(strings.TrimSpace(value) != "", field, message)
}

// Email checks that a string is a valid email address.
func (v *Validator) Email(field, value string) {
	if strings.TrimSpace(value) == "" {
		return
	}
	if _, err := mail.ParseAddress(value); err != nil {
		v.Errors[field] = "invalid email address"
	}
}

// MinLength checks that a string has at least the given length in runes.
func (v *Validator) MinLength(field, value string, min int) {
	if utf8.RuneCountInString(value) < min {
		v.Errors[field] = "too short"
	}
}

// MaxLength checks that a string does not exceed the given length in runes.
func (v *Validator) MaxLength(field, value string, max int) {
	if utf8.RuneCountInString(value) > max {
		v.Errors[field] = "too long"
	}
}

// In checks that a value is in a list of allowed values.
func (v *Validator) In(field, value string, allowed ...string) {
	for _, a := range allowed {
		if value == a {
			return
		}
	}
	v.Errors[field] = "invalid value"
}
