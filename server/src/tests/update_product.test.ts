
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type CreateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Helper function to create a product for testing
const createTestProduct = async (input: CreateProductInput) => {
  const result = await db.insert(productsTable)
    .values({
      name: input.name,
      description: input.description,
      price: input.price.toString(),
      stock_quantity: input.stock_quantity,
      category: input.category
    })
    .returning()
    .execute();

  const product = result[0];
  return {
    ...product,
    price: parseFloat(product.price)
  };
};

// Test product data
const initialProductInput: CreateProductInput = {
  name: 'Original Product',
  description: 'Original description',
  price: 29.99,
  stock_quantity: 50,
  category: 'Electronics'
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update product name', async () => {
    // Create initial product
    const created = await createTestProduct(initialProductInput);

    const updateInput: UpdateProductInput = {
      id: created.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.description).toEqual(initialProductInput.description);
    expect(result.price).toEqual(29.99);
    expect(result.stock_quantity).toEqual(50);
    expect(result.category).toEqual('Electronics');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const created = await createTestProduct(initialProductInput);

    const updateInput: UpdateProductInput = {
      id: created.id,
      name: 'New Name',
      price: 39.99,
      stock_quantity: 75,
      category: 'Updated Electronics'
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('New Name');
    expect(result.price).toEqual(39.99);
    expect(result.stock_quantity).toEqual(75);
    expect(result.category).toEqual('Updated Electronics');
    expect(result.description).toEqual(initialProductInput.description);
  });

  it('should update description to null', async () => {
    const created = await createTestProduct(initialProductInput);

    const updateInput: UpdateProductInput = {
      id: created.id,
      description: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual(initialProductInput.name);
    expect(result.price).toEqual(29.99);
  });

  it('should save updated data to database', async () => {
    const created = await createTestProduct(initialProductInput);

    const updateInput: UpdateProductInput = {
      id: created.id,
      name: 'Database Updated',
      price: 99.99
    };

    await updateProduct(updateInput);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, created.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated');
    expect(parseFloat(products[0].price)).toEqual(99.99);
    expect(products[0].stock_quantity).toEqual(50);
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'This should fail'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle price type conversion correctly', async () => {
    const created = await createTestProduct(initialProductInput);

    const updateInput: UpdateProductInput = {
      id: created.id,
      price: 123.45
    };

    const result = await updateProduct(updateInput);

    expect(typeof result.price).toBe('number');
    expect(result.price).toEqual(123.45);

    // Verify numeric conversion in database
    const dbProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, created.id))
      .execute();

    expect(typeof dbProduct[0].price).toBe('string');
    expect(parseFloat(dbProduct[0].price)).toEqual(123.45);
  });
});
