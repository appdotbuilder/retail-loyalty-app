
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTransactions(customerId?: number): Promise<Transaction[]> {
  try {
    const baseQuery = db.select().from(transactionsTable);
    
    const query = customerId !== undefined 
      ? baseQuery.where(eq(transactionsTable.customer_id, customerId))
      : baseQuery;

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      total_amount: parseFloat(transaction.total_amount),
      cashback_used: parseFloat(transaction.cashback_used)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
}
