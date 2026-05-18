import { productSchema, CATEGORIES } from '../product';

describe('productSchema', () => {
  const validData = {
    name: 'Artisan Notebook',
    description: 'Handcrafted binding',
    category: 'notebooks',
    satCode: '12345678',
    buyPrice: 12.5,
    salePrice: 24.0,
    stock: 42,
    image: null,
  };

  it('should validate a complete valid product.', () => {
    const result = productSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should validate with optional fields omitted.', () => {
    const minimal = {
      name: 'Pen',
      category: 'fine_pens',
      buyPrice: 10,
      salePrice: 20,
      stock: 5,
    };
    const result = productSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('should reject an empty product name.', () => {
    const result = productSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject a product name exceeding 120 characters.', () => {
    const result = productSchema.safeParse({
      ...validData,
      name: 'a'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('should reject a missing category.', () => {
    const result = productSchema.safeParse({ ...validData, category: undefined });
    expect(result.success).toBe(false);
  });

  it('should reject an invalid category.', () => {
    const result = productSchema.safeParse({
      ...validData,
      category: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid category values.', () => {
    CATEGORIES.forEach((cat) => {
      const result = productSchema.safeParse({ ...validData, category: cat });
      expect(result.success).toBe(true);
    });
  });

  it('should reject a SAT code with fewer than 8 digits.', () => {
    const result = productSchema.safeParse({ ...validData, satCode: '1234567' });
    expect(result.success).toBe(false);
  });

  it('should reject a SAT code with more than 8 digits.', () => {
    const result = productSchema.safeParse({ ...validData, satCode: '123456789' });
    expect(result.success).toBe(false);
  });

  it('should reject a SAT code with non-numeric characters.', () => {
    const result = productSchema.safeParse({ ...validData, satCode: '1234abcd' });
    expect(result.success).toBe(false);
  });

  it('should accept an empty SAT code.', () => {
    const result = productSchema.safeParse({ ...validData, satCode: '' });
    expect(result.success).toBe(true);
  });

  it('should reject a negative buy price.', () => {
    const result = productSchema.safeParse({ ...validData, buyPrice: -5 });
    expect(result.success).toBe(false);
  });

  it('should reject a zero buy price.', () => {
    const result = productSchema.safeParse({ ...validData, buyPrice: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject a negative sale price.', () => {
    const result = productSchema.safeParse({ ...validData, salePrice: -5 });
    expect(result.success).toBe(false);
  });

  it('should reject a negative stock value.', () => {
    const result = productSchema.safeParse({ ...validData, stock: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject a non-integer stock value.', () => {
    const result = productSchema.safeParse({ ...validData, stock: 5.5 });
    expect(result.success).toBe(false);
  });

  it('should accept a stock value of zero.', () => {
    const result = productSchema.safeParse({ ...validData, stock: 0 });
    expect(result.success).toBe(true);
  });

  it('should coerce string numbers to actual numbers.', () => {
    const result = productSchema.safeParse({
      ...validData,
      buyPrice: '12.5',
      salePrice: '24',
      stock: '42',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.buyPrice).toBe('number');
      expect(typeof result.data.salePrice).toBe('number');
      expect(typeof result.data.stock).toBe('number');
    }
  });
});
