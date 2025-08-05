
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  price: 19.99,
  stock_quantity: 100,
  category: 'electronics'
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual(testInput.description);
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.stock_quantity).toEqual(100);
    expect(result.category).toEqual('electronics');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual(testInput.description);
    expect(parseFloat(products[0].price)).toEqual(19.99);
    expect(products[0].stock_quantity).toEqual(100);
    expect(products[0].category).toEqual('electronics');
    expect(products[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle product with null description', async () => {
    const inputWithNullDescription: CreateProductInput = {
      ...testInput,
      description: null
    };

    const result = await createProduct(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Product');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
  });

  it('should handle decimal prices with proper precision', async () => {
    const inputWithDecimalPrice: CreateProductInput = {
      ...testInput,
      price: 123.456
    };

    const result = await createProduct(inputWithDecimalPrice);

    // PostgreSQL numeric(10, 2) rounds to 2 decimal places
    expect(result.price).toEqual(123.46);
    expect(typeof result.price).toEqual('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(123.46);
  });
});
