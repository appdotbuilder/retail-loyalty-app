
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type ConvertPointsToCashbackInput } from '../schema';
import { convertPointsToCashback } from '../handlers/convert_points_to_cashback';
import { eq } from 'drizzle-orm';

// Test input for conversion
const testInput: ConvertPointsToCashbackInput = {
  customer_id: 1,
  points_to_convert: 200
};

describe('convertPointsToCashback', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should convert points to cashback successfully', async () => {
    // Create a customer with points
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        points_balance: 500,
        cashback_balance: '50.00'
      })
      .execute();

    const result = await convertPointsToCashback(testInput);

    // Verify conversion (200 points * 0.1 = 20.00 cashback)
    expect(result.points_balance).toEqual(300); // 500 - 200
    expect(result.cashback_balance).toEqual(70.00); // 50.00 + 20.00
    expect(result.name).toEqual('Test Customer');
    expect(result.email).toEqual('test@example.com');
    expect(typeof result.cashback_balance).toBe('number');
  });

  it('should update customer record in database', async () => {
    // Create a customer with points
    await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: null,
        points_balance: 1000,
        cashback_balance: '0.00'
      })
      .execute();

    await convertPointsToCashback(testInput);

    // Verify database was updated
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, 1))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].points_balance).toEqual(800); // 1000 - 200
    expect(parseFloat(customers[0].cashback_balance)).toEqual(20.00); // 0 + 20.00
  });

  it('should throw error when customer does not exist', async () => {
    await expect(convertPointsToCashback(testInput))
      .rejects.toThrow(/customer with id 1 not found/i);
  });

  it('should throw error when customer has insufficient points', async () => {
    // Create a customer with insufficient points
    await db.insert(customersTable)
      .values({
        name: 'Poor Customer',
        email: 'poor@example.com',
        phone: null,
        points_balance: 50, // Less than required 200
        cashback_balance: '0.00'
      })
      .execute();

    await expect(convertPointsToCashback(testInput))
      .rejects.toThrow(/insufficient points/i);
  });

  it('should handle conversion with existing cashback balance', async () => {
    // Create a customer with existing cashback
    await db.insert(customersTable)
      .values({
        name: 'Rich Customer',
        email: 'rich@example.com',
        phone: null,
        points_balance: 1000,
        cashback_balance: '125.50'
      })
      .execute();

    const result = await convertPointsToCashback(testInput);

    // Verify existing cashback is preserved and new is added
    expect(result.points_balance).toEqual(800); // 1000 - 200
    expect(result.cashback_balance).toEqual(145.50); // 125.50 + 20.00
  });

  it('should handle exact points conversion', async () => {
    // Customer has exactly the points they want to convert
    await db.insert(customersTable)
      .values({
        name: 'Exact Customer',
        email: 'exact@example.com',
        phone: null,
        points_balance: 200, // Exactly what they want to convert
        cashback_balance: '0.00'
      })
      .execute();

    const result = await convertPointsToCashback(testInput);

    expect(result.points_balance).toEqual(0); // 200 - 200
    expect(result.cashback_balance).toEqual(20.00); // 0 + 20.00
  });
});
