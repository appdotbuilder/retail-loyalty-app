
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, transactionsTable } from '../db/schema';
import { getTransactions } from '../handlers/get_transactions';

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all transactions when no customer filter provided', async () => {
    // Create test customers
    const customers = await db.insert(customersTable)
      .values([
        { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210' }
      ])
      .returning()
      .execute();

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          customer_id: customers[0].id,
          total_amount: '99.99',
          points_earned: 100,
          cashback_used: '5.50'
        },
        {
          customer_id: customers[1].id,
          total_amount: '149.99',
          points_earned: 150,
          cashback_used: '0.00'
        },
        {
          customer_id: customers[0].id,
          total_amount: '75.00',
          points_earned: 75,
          cashback_used: '2.25'
        }
      ])
      .returning()
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // Check numeric conversions
    result.forEach(transaction => {
      expect(typeof transaction.total_amount).toBe('number');
      expect(typeof transaction.cashback_used).toBe('number');
      expect(typeof transaction.points_earned).toBe('number');
      expect(typeof transaction.customer_id).toBe('number');
      expect(transaction.created_at).toBeInstanceOf(Date);
    });

    // Verify specific values
    const sortedResults = result.sort((a, b) => a.total_amount - b.total_amount);
    expect(sortedResults[0].total_amount).toEqual(75.00);
    expect(sortedResults[0].cashback_used).toEqual(2.25);
    expect(sortedResults[1].total_amount).toEqual(99.99);
    expect(sortedResults[1].cashback_used).toEqual(5.50);
    expect(sortedResults[2].total_amount).toEqual(149.99);
    expect(sortedResults[2].cashback_used).toEqual(0.00);
  });

  it('should return transactions filtered by customer ID', async () => {
    // Create test customers
    const customers = await db.insert(customersTable)
      .values([
        { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
        { name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210' }
      ])
      .returning()
      .execute();

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          customer_id: customers[0].id,
          total_amount: '99.99',
          points_earned: 100,
          cashback_used: '5.50'
        },
        {
          customer_id: customers[1].id,
          total_amount: '149.99',
          points_earned: 150,
          cashback_used: '0.00'
        },
        {
          customer_id: customers[0].id,
          total_amount: '75.00',
          points_earned: 75,
          cashback_used: '2.25'
        }
      ])
      .returning()
      .execute();

    const result = await getTransactions(customers[0].id);

    expect(result).toHaveLength(2);
    
    // All transactions should belong to the specified customer
    result.forEach(transaction => {
      expect(transaction.customer_id).toEqual(customers[0].id);
      expect(typeof transaction.total_amount).toBe('number');
      expect(typeof transaction.cashback_used).toBe('number');
    });

    // Verify specific transactions for customer 1
    const sortedResults = result.sort((a, b) => a.total_amount - b.total_amount);
    expect(sortedResults[0].total_amount).toEqual(75.00);
    expect(sortedResults[0].cashback_used).toEqual(2.25);
    expect(sortedResults[1].total_amount).toEqual(99.99);
    expect(sortedResults[1].cashback_used).toEqual(5.50);
  });

  it('should return empty array for non-existent customer', async () => {
    // Create test customer and transaction
    const customer = await db.insert(customersTable)
      .values({ name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' })
      .returning()
      .execute();

    await db.insert(transactionsTable)
      .values({
        customer_id: customer[0].id,
        total_amount: '99.99',
        points_earned: 100,
        cashback_used: '5.50'
      })
      .returning()
      .execute();

    const result = await getTransactions(99999); // Non-existent customer ID

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
