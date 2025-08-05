
import { db } from '../db';
import { customersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ConvertPointsToCashbackInput, type Customer } from '../schema';

export const convertPointsToCashback = async (input: ConvertPointsToCashbackInput): Promise<Customer> => {
  try {
    // First, get the current customer data
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customers.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    const customer = customers[0];
    
    // Check if customer has sufficient points
    if (customer.points_balance < input.points_to_convert) {
      throw new Error(`Insufficient points. Customer has ${customer.points_balance} points but trying to convert ${input.points_to_convert}`);
    }

    // Define conversion rate: 100 points = 10.00 Rupiah cashback (0.1 ratio)
    const conversionRate = 0.1;
    const cashbackToAdd = input.points_to_convert * conversionRate;

    // Calculate new balances
    const newPointsBalance = customer.points_balance - input.points_to_convert;
    const currentCashbackBalance = parseFloat(customer.cashback_balance);
    const newCashbackBalance = currentCashbackBalance + cashbackToAdd;

    // Update customer record
    const result = await db.update(customersTable)
      .set({
        points_balance: newPointsBalance,
        cashback_balance: newCashbackBalance.toString()
      })
      .where(eq(customersTable.id, input.customer_id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedCustomer = result[0];
    return {
      ...updatedCustomer,
      cashback_balance: parseFloat(updatedCustomer.cashback_balance)
    };
  } catch (error) {
    console.error('Points to cashback conversion failed:', error);
    throw error;
  }
};
