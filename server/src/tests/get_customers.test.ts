
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers with correct data types', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
          points_balance: 100,
          cashback_balance: '25.50'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: null,
          points_balance: 0,
          cashback_balance: '0.00'
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);

    // Check first customer
    const john = result.find(c => c.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john!.email).toEqual('john@example.com');
    expect(john!.phone).toEqual('555-0123');
    expect(john!.points_balance).toEqual(100);
    expect(john!.cashback_balance).toEqual(25.50);
    expect(typeof john!.cashback_balance).toBe('number');
    expect(john!.created_at).toBeInstanceOf(Date);

    // Check second customer
    const jane = result.find(c => c.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane!.email).toEqual('jane@example.com');
    expect(jane!.phone).toBeNull();
    expect(jane!.points_balance).toEqual(0);
    expect(jane!.cashback_balance).toEqual(0.00);
    expect(typeof jane!.cashback_balance).toBe('number');
    expect(jane!.created_at).toBeInstanceOf(Date);
  });

  it('should return customers in database insertion order', async () => {
    // Create customers in specific order
    await db.insert(customersTable)
      .values({
        name: 'First Customer',
        email: 'first@example.com',
        points_balance: 50,
        cashback_balance: '10.00'
      })
      .execute();

    await db.insert(customersTable)
      .values({
        name: 'Second Customer',
        email: 'second@example.com',
        points_balance: 75,
        cashback_balance: '15.25'
      })
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Customer');
    expect(result[1].name).toEqual('Second Customer');
  });
});
