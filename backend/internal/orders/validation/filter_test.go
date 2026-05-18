package validation

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseOrderFilter(t *testing.T) {
	t.Run("defaults", func(t *testing.T) {
		f := ParseOrderFilter(map[string]string{})
		assert.Equal(t, 1, f.Page)
		assert.Equal(t, 20, f.Limit)
		assert.Equal(t, "", f.Search)
		assert.Equal(t, "", f.Status)
		assert.Equal(t, "created_at", f.SortBy)
		assert.Equal(t, "desc", f.SortOrder)
	})

	t.Run("status populated", func(t *testing.T) {
		f := ParseOrderFilter(map[string]string{
			"status": "pending",
		})
		assert.Equal(t, "pending", f.Status)
	})

	t.Run("invalid integers stored as zero", func(t *testing.T) {
		f := ParseOrderFilter(map[string]string{
			"page":  "abc",
			"limit": "xyz",
		})
		assert.Equal(t, 1, f.Page)
		assert.Equal(t, 20, f.Limit)
	})
}

func TestOrderFilter_Validate(t *testing.T) {
	t.Run("valid filter", func(t *testing.T) {
		f := OrderFilter{Page: 1, Limit: 20, SortBy: "created_at", SortOrder: "desc"}
		assert.Empty(t, f.Validate())
	})

	t.Run("unknown status", func(t *testing.T) {
		f := OrderFilter{Page: 1, Limit: 20, Status: "completed", SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "status", errs[0].Field)
	})

	t.Run("empty status is OK", func(t *testing.T) {
		f := OrderFilter{Page: 1, Limit: 20, Status: "", SortBy: "created_at", SortOrder: "desc"}
		assert.Empty(t, f.Validate())
	})

	t.Run("multiple errors", func(t *testing.T) {
		f := OrderFilter{Page: -1, Limit: 101, Status: "completed", SortBy: "invalid", SortOrder: "invalid"}
		errs := f.Validate()
		assert.Len(t, errs, 5)
		fields := make([]string, len(errs))
		for i, e := range errs {
			fields[i] = e.Field
		}
		assert.Contains(t, fields, "page")
		assert.Contains(t, fields, "limit")
		assert.Contains(t, fields, "status")
		assert.Contains(t, fields, "sort_by")
		assert.Contains(t, fields, "sort_order")
	})

	t.Run("search too long", func(t *testing.T) {
		f := OrderFilter{Page: 1, Limit: 20, Search: strings.Repeat("a", 201), SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "search", errs[0].Field)
	})
}
