
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with correct fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.points_balance).toEqual(0);
    expect(result.cashback_balance).toEqual(0);
    expect(typeof result.cashback_balance).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].email).toEqual('john.doe@example.com');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].points_balance).toEqual(0);
    expect(parseFloat(customers[0].cashback_balance)).toEqual(0);
    expect(customers[0].created_at).toBeInstanceOf(Date);
  });

  it('should create customer with null phone', async () => {
    const inputWithNullPhone: CreateCustomerInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: null
    };

    const result = await createCustomer(inputWithNullPhone);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.phone).toBeNull();
    expect(result.points_balance).toEqual(0);
    expect(result.cashback_balance).toEqual(0);
  });

  it('should enforce unique email constraint', async () => {
    // Create first customer
    await createCustomer(testInput);

    // Try to create another customer with same email
    const duplicateInput: CreateCustomerInput = {
      name: 'Jane Doe',
      email: 'john.doe@example.com', // Same email
      phone: '+0987654321'
    };

    await expect(createCustomer(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should initialize balances correctly', async () => {
    const result = await createCustomer(testInput);

    // Verify initial balances are set to 0
    expect(result.points_balance).toEqual(0);
    expect(result.cashback_balance).toEqual(0);
    expect(typeof result.points_balance).toBe('number');
    expect(typeof result.cashback_balance).toBe('number');

    // Verify database values
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers[0].points_balance).toEqual(0);
    expect(parseFloat(customers[0].cashback_balance)).toEqual(0);
  });
});
