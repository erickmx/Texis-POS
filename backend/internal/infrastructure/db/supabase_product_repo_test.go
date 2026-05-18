package db

import (
	"context"
	"testing"

	"github.com/erickmx/texis-pos/internal/inventory/validation"
	"github.com/erickmx/texis-pos/pkg/supabase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSupabaseProductRepository_GetTotal(t *testing.T) {
	skipIfNoSupabase(t)
	require.NoError(t, supabase.Init())
	repo := NewSupabaseProductRepository(supabase.GetClient())
	ctx := context.Background()

	total, err := repo.GetTotal(ctx)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, total, int64(0))
}

func TestSupabaseProductRepository_GetLowStock(t *testing.T) {
	skipIfNoSupabase(t)
	require.NoError(t, supabase.Init())
	repo := NewSupabaseProductRepository(supabase.GetClient())
	ctx := context.Background()

	products, err := repo.GetLowStock(ctx)
	assert.NoError(t, err)
	assert.NotNil(t, products)
	for _, p := range products {
		assert.Less(t, p.StockLevel, p.ReorderPoint)
	}
}

func TestSupabaseProductRepository_GetAllFiltered(t *testing.T) {
	skipIfNoSupabase(t)
	require.NoError(t, supabase.Init())
	repo := NewSupabaseProductRepository(supabase.GetClient())
	ctx := context.Background()

	filter := validation.ProductFilter{
		Page:      1,
		Limit:     5,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
	products, count, err := repo.GetAllFiltered(ctx, filter)
	assert.NoError(t, err)
	assert.NotNil(t, products)
	assert.GreaterOrEqual(t, count, int64(0))
}
