package category

import (
	"context"
	"errors"
)

var ErrCategoryNotFound = errors.New("category not found")

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetAll(ctx context.Context) ([]Category, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, dto CreateCategoryDTO) (*Category, error) {
	return s.repo.Create(ctx, dto)
}

func (s *Service) Update(ctx context.Context, id string, dto UpdateCategoryDTO) (*Category, error) {
	return s.repo.Update(ctx, id, dto)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) GetByProductID(ctx context.Context, productID string) ([]Category, error) {
	return s.repo.GetByProductID(ctx, productID)
}
