
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, productsTable, transactionsTable, transactionItemsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCustomerId: number;
  let testProductId1: number;
  let testProductId2: number;

  beforeEach(async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        points_balance: 50,
        cashback_balance: '100.00'
      })
      .returning()
      .execute();
    testCustomerId = customerResult[0].id;

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 1',
        description: 'Product 1 for testing',
        price: '15000.00',
        stock_quantity: 10,
        category: 'Electronics'
      })
      .returning()
      .execute();
    testProductId1 = product1Result[0].id;

    const product2Result = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        description: 'Product 2 for testing',
        price: '25000.00',
        stock_quantity: 5,
        category: 'Books'
      })
      .returning()
      .execute();
    testProductId2 = product2Result[0].id;
  });

  it('should create a transaction with single item', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 2
        }
      ]
    };

    const result = await createTransaction(input);

    expect(result.customer_id).toEqual(testCustomerId);
    expect(result.total_amount).toEqual(30000); // 15000 * 2
    expect(result.points_earned).toEqual(30); // 30000 / 1000
    expect(result.cashback_used).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a transaction with multiple items', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 1
        },
        {
          product_id: testProductId2,
          quantity: 2
        }
      ]
    };

    const result = await createTransaction(input);

    expect(result.total_amount).toEqual(65000); // 15000 + (25000 * 2)
    expect(result.points_earned).toEqual(65); // 65000 / 1000
    expect(result.cashback_used).toEqual(0);
  });

  it('should create transaction with cashback used', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 2
        }
      ],
      cashback_used: 50
    };

    const result = await createTransaction(input);

    expect(result.total_amount).toEqual(30000);
    expect(result.cashback_used).toEqual(50);
    expect(result.points_earned).toEqual(29); // (30000 - 50) / 1000 = 29.95, floored to 29
  });

  it('should update product stock quantities', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 3
        },
        {
          product_id: testProductId2,
          quantity: 1
        }
      ]
    };

    await createTransaction(input);

    const product1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProductId1))
      .execute();
    expect(product1[0].stock_quantity).toEqual(7); // 10 - 3

    const product2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProductId2))
      .execute();
    expect(product2[0].stock_quantity).toEqual(4); // 5 - 1
  });

  it('should update customer points and cashback balance', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 2
        }
      ],
      cashback_used: 25
    };

    await createTransaction(input);

    const customer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, testCustomerId))
      .execute();

    expect(customer[0].points_balance).toEqual(79); // 50 + 29 points earned
    expect(parseFloat(customer[0].cashback_balance)).toEqual(75); // 100 - 25
  });

  it('should create transaction items records', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 2
        },
        {
          product_id: testProductId2,
          quantity: 1
        }
      ]
    };

    const transaction = await createTransaction(input);

    const transactionItems = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transaction_id, transaction.id))
      .execute();

    expect(transactionItems).toHaveLength(2);

    const item1 = transactionItems.find(item => item.product_id === testProductId1);
    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(parseFloat(item1!.unit_price)).toEqual(15000);
    expect(parseFloat(item1!.total_price)).toEqual(30000);

    const item2 = transactionItems.find(item => item.product_id === testProductId2);
    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(1);
    expect(parseFloat(item2!.unit_price)).toEqual(25000);
    expect(parseFloat(item2!.total_price)).toEqual(25000);
  });

  it('should throw error for non-existent customer', async () => {
    const input: CreateTransactionInput = {
      customer_id: 99999,
      items: [
        {
          product_id: testProductId1,
          quantity: 1
        }
      ]
    };

    await expect(createTransaction(input)).rejects.toThrow(/customer not found/i);
  });

  it('should throw error for non-existent product', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: 99999,
          quantity: 1
        }
      ]
    };

    await expect(createTransaction(input)).rejects.toThrow(/product.*not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 15 // More than available stock (10)
        }
      ]
    };

    await expect(createTransaction(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error for insufficient cashback balance', async () => {
    const input: CreateTransactionInput = {
      customer_id: testCustomerId,
      items: [
        {
          product_id: testProductId1,
          quantity: 1
        }
      ],
      cashback_used: 150 // More than customer's balance (100)
    };

    await expect(createTransaction(input)).rejects.toThrow(/insufficient cashback/i);
  });

  it('should throw error when cashback exceeds total amount', async () => {
    // Create a customer with high cashback balance to pass the cashback balance check
    const highCashbackCustomerResult = await db.insert(customersTable)
      .values({
        name: 'High Cashback Customer',
        email: 'highcashback@example.com',
        phone: '9876543210',
        points_balance: 0,
        cashback_balance: '50000.00' // High balance
      })
      .returning()
      .execute();

    const input: CreateTransactionInput = {
      customer_id: highCashbackCustomerResult[0].id,
      items: [
        {
          product_id: testProductId1,
          quantity: 1 // 15000 total
        }
      ],
      cashback_used: 20000 // More than total amount but within customer's balance
    };

    await expect(createTransaction(input)).rejects.toThrow(/cashback.*cannot exceed.*total/i);
  });
});
