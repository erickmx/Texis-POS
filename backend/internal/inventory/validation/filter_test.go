package validation

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseProductFilter(t *testing.T) {
	t.Run("defaults", func(t *testing.T) {
		f := ParseProductFilter(map[string]string{})
		assert.Equal(t, 1, f.Page)
		assert.Equal(t, 20, f.Limit)
		assert.Equal(t, "", f.Search)
		assert.Equal(t, "created_at", f.SortBy)
		assert.Equal(t, "desc", f.SortOrder)
	})

	t.Run("valid overrides", func(t *testing.T) {
		f := ParseProductFilter(map[string]string{
			"page":       "2",
			"limit":      "10",
			"search":     "blue",
			"sort_by":    "title",
			"sort_order": "asc",
		})
		assert.Equal(t, 2, f.Page)
		assert.Equal(t, 10, f.Limit)
		assert.Equal(t, "blue", f.Search)
		assert.Equal(t, "title", f.SortBy)
		assert.Equal(t, "asc", f.SortOrder)
	})

	t.Run("invalid integers stored as zero", func(t *testing.T) {
		f := ParseProductFilter(map[string]string{
			"page":  "abc",
			"limit": "xyz",
		})
		assert.Equal(t, 1, f.Page)
		assert.Equal(t, 20, f.Limit)
	})
}

func TestProductFilter_Validate(t *testing.T) {
	t.Run("valid filter", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 20, SortBy: "created_at", SortOrder: "desc"}
		assert.Empty(t, f.Validate())
	})

	t.Run("negative page", func(t *testing.T) {
		f := ProductFilter{Page: -1, Limit: 20, SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "page", errs[0].Field)
	})

	t.Run("limit zero", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 0, SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "limit", errs[0].Field)
	})

	t.Run("limit over 100", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 101, SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "limit", errs[0].Field)
	})

	t.Run("search too long", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 20, Search: strings.Repeat("a", 201), SortBy: "created_at", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "search", errs[0].Field)
	})

	t.Run("invalid sort_by", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 20, SortBy: "price", SortOrder: "desc"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "sort_by", errs[0].Field)
	})

	t.Run("invalid sort_order", func(t *testing.T) {
		f := ProductFilter{Page: 1, Limit: 20, SortBy: "created_at", SortOrder: "up"}
		errs := f.Validate()
		assert.Len(t, errs, 1)
		assert.Equal(t, "sort_order", errs[0].Field)
	})

	t.Run("multiple errors", func(t *testing.T) {
		f := ProductFilter{Page: -1, Limit: 0, SortBy: "invalid", SortOrder: "invalid"}
		errs := f.Validate()
		assert.Len(t, errs, 4)
		fields := make([]string, len(errs))
		for i, e := range errs {
			fields[i] = e.Field
		}
		assert.Contains(t, fields, "page")
		assert.Contains(t, fields, "limit")
		assert.Contains(t, fields, "sort_by")
		assert.Contains(t, fields, "sort_order")
	})
}
