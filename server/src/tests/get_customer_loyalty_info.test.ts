
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, transactionsTable } from '../db/schema';
import { getCustomerLoyaltyInfo } from '../handlers/get_customer_loyalty_info';

describe('getCustomerLoyaltyInfo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return loyalty info for customer with no transactions', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        points_balance: 150,
        cashback_balance: '25.50'
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    const result = await getCustomerLoyaltyInfo(customer.id);

    expect(result.customer_id).toEqual(customer.id);
    expect(result.name).toEqual('John Doe');
    expect(result.points_balance).toEqual(150);
    expect(result.cashback_balance).toEqual(25.50);
    expect(result.total_transactions).toEqual(0);
    expect(result.total_spent).toEqual(0);
  });

  it('should return loyalty info for customer with transactions', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        points_balance: 300,
        cashback_balance: '45.75'
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create test transactions
    await db.insert(transactionsTable)
      .values([
        {
          customer_id: customer.id,
          total_amount: '100.00',
          points_earned: 10,
          cashback_used: '5.00'
        },
        {
          customer_id: customer.id,
          total_amount: '250.50',
          points_earned: 25,
          cashback_used: '0.00'
        }
      ])
      .execute();

    const result = await getCustomerLoyaltyInfo(customer.id);

    expect(result.customer_id).toEqual(customer.id);
    expect(result.name).toEqual('Jane Smith');
    expect(result.points_balance).toEqual(300);
    expect(result.cashback_balance).toEqual(45.75);
    expect(result.total_transactions).toEqual(2);
    expect(result.total_spent).toEqual(350.50);
  });

  it('should handle customer with zero balances and transactions', async () => {
    // Create customer with default values
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Zero Customer',
        email: 'zero@example.com',
        phone: null
        // points_balance and cashback_balance will use defaults (0)
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    const result = await getCustomerLoyaltyInfo(customer.id);

    expect(result.customer_id).toEqual(customer.id);
    expect(result.name).toEqual('Zero Customer');
    expect(result.points_balance).toEqual(0);
    expect(result.cashback_balance).toEqual(0);
    expect(result.total_transactions).toEqual(0);
    expect(result.total_spent).toEqual(0);
    expect(typeof result.cashback_balance).toEqual('number');
    expect(typeof result.total_spent).toEqual('number');
  });

  it('should throw error for non-existent customer', async () => {
    await expect(getCustomerLoyaltyInfo(999)).rejects.toThrow(/not found/i);
  });
});
