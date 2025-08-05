
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const results = await db.select()
      .from(customersTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(customer => ({
      ...customer,
      cashback_balance: parseFloat(customer.cashback_balance)
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
};
