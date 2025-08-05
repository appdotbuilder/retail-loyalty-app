
import { db } from '../db';
import { customersTable, transactionsTable } from '../db/schema';
import { type CustomerLoyaltyInfo } from '../schema';
import { eq, sum, count } from 'drizzle-orm';

export async function getCustomerLoyaltyInfo(customerId: number): Promise<CustomerLoyaltyInfo> {
  try {
    // Get customer basic info
    const customerResult = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    if (customerResult.length === 0) {
      throw new Error(`Customer with id ${customerId} not found`);
    }

    const customer = customerResult[0];

    // Get transaction summary
    const transactionSummary = await db.select({
      total_transactions: count(transactionsTable.id),
      total_spent: sum(transactionsTable.total_amount)
    })
      .from(transactionsTable)
      .where(eq(transactionsTable.customer_id, customerId))
      .execute();

    const summary = transactionSummary[0];

    return {
      customer_id: customer.id,
      name: customer.name,
      points_balance: customer.points_balance,
      cashback_balance: parseFloat(customer.cashback_balance), // Convert numeric to number
      total_transactions: summary.total_transactions || 0,
      total_spent: summary.total_spent ? parseFloat(summary.total_spent) : 0 // Convert numeric to number
    };
  } catch (error) {
    console.error('Failed to get customer loyalty info:', error);
    throw error;
  }
}
