package validation

import "fmt"

const (
	// maxTitleLength bounds the special request title.
	maxTitleLength = 200
	// maxPhaseLength bounds the free-text phase label while protecting the DB.
	maxPhaseLength = 2000
)

// ValidateDetailsRequest validates the editable fields present in a
// PATCH /api/orders/:id/details payload. Absent fields (nil) are skipped.
// progress_pct must be within 0-100; fiscal values must be non-negative.
func ValidateDetailsRequest(title, phase *string, progressPct *int, gastoTerceros, serviceFee *float64) []FieldError {
	var errs []FieldError
	if title != nil && len(*title) > maxTitleLength {
		errs = append(errs, FieldError{Field: "title", Message: fmt.Sprintf("title must be <= %d characters, got %d", maxTitleLength, len(*title))})
	}
	if phase != nil && len(*phase) > maxPhaseLength {
		errs = append(errs, FieldError{Field: "phase", Message: fmt.Sprintf("phase must be <= %d characters, got %d", maxPhaseLength, len(*phase))})
	}
	if progressPct != nil && (*progressPct < 0 || *progressPct > 100) {
		errs = append(errs, FieldError{Field: "progress_pct", Message: fmt.Sprintf("progress_pct must be between 0 and 100, got %d", *progressPct)})
	}
	if gastoTerceros != nil && *gastoTerceros < 0 {
		errs = append(errs, FieldError{Field: "gasto_terceros", Message: fmt.Sprintf("gasto_terceros must be >= 0, got %v", *gastoTerceros)})
	}
	if serviceFee != nil && *serviceFee < 0 {
		errs = append(errs, FieldError{Field: "service_fee", Message: fmt.Sprintf("service_fee must be >= 0, got %v", *serviceFee)})
	}
	return errs
}
