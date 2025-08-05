
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        points_balance: 0, // Initial balance
        cashback_balance: '0' // Initial balance as string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const customer = result[0];
    return {
      ...customer,
      cashback_balance: parseFloat(customer.cashback_balance) // Convert string back to number
    };
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
