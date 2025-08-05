
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
  });

  it('should return all products', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'Product 1',
        description: 'First product',
        price: '19.99',
        stock_quantity: 10,
        category: 'Electronics'
      },
      {
        name: 'Product 2',
        description: 'Second product',
        price: '29.99',
        stock_quantity: 5,
        category: 'Books'
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    
    // Verify first product
    expect(result[0].name).toEqual('Product 1');
    expect(result[0].description).toEqual('First product');
    expect(result[0].price).toEqual(19.99);
    expect(typeof result[0].price).toEqual('number');
    expect(result[0].stock_quantity).toEqual(10);
    expect(result[0].category).toEqual('Electronics');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second product
    expect(result[1].name).toEqual('Product 2');
    expect(result[1].description).toEqual('Second product');
    expect(result[1].price).toEqual(29.99);
    expect(typeof result[1].price).toEqual('number');
    expect(result[1].stock_quantity).toEqual(5);
    expect(result[1].category).toEqual('Books');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle products with null descriptions', async () => {
    // Insert product with null description
    await db.insert(productsTable).values({
      name: 'Product with null description',
      description: null,
      price: '15.50',
      stock_quantity: 3,
      category: 'Home'
    }).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Product with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].price).toEqual(15.50);
    expect(result[0].stock_quantity).toEqual(3);
    expect(result[0].category).toEqual('Home');
  });

  it('should return products in insertion order', async () => {
    // Insert products in specific order
    await db.insert(productsTable).values([
      {
        name: 'First Product',
        description: 'Added first',
        price: '10.00',
        stock_quantity: 1,
        category: 'Test'
      },
      {
        name: 'Second Product',
        description: 'Added second',
        price: '20.00',
        stock_quantity: 2,
        category: 'Test'
      },
      {
        name: 'Third Product',
        description: 'Added third',
        price: '30.00',
        stock_quantity: 3,
        category: 'Test'
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Product');
    expect(result[1].name).toEqual('Second Product');
    expect(result[2].name).toEqual('Third Product');
  });
});
