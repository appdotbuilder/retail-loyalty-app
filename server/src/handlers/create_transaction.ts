
import { db } from '../db';
import { customersTable, productsTable, transactionsTable, transactionItemsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    const cashbackUsed = input.cashback_used || 0;

    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Validate customer exists and has sufficient cashback
      const customer = await tx.select()
        .from(customersTable)
        .where(eq(customersTable.id, input.customer_id))
        .execute();

      if (customer.length === 0) {
        throw new Error('Customer not found');
      }

      const customerData = customer[0];
      const customerCashbackBalance = parseFloat(customerData.cashback_balance);

      if (cashbackUsed > customerCashbackBalance) {
        throw new Error('Insufficient cashback balance');
      }

      // 2. Validate all products exist and have sufficient stock, calculate total
      let totalAmount = 0;
      const productUpdates: Array<{ id: number; newStock: number }> = [];

      for (const item of input.items) {
        const product = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();

        if (product.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const productData = product[0];
        if (productData.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${productData.name}`);
        }

        const productPrice = parseFloat(productData.price);
        const itemTotalPrice = productPrice * item.quantity;
        totalAmount += itemTotalPrice;

        productUpdates.push({
          id: item.product_id,
          newStock: productData.stock_quantity - item.quantity
        });
      }

      // Apply cashback discount
      const finalAmount = totalAmount - cashbackUsed;
      if (finalAmount < 0) {
        throw new Error('Cashback used cannot exceed total amount');
      }

      // 3. Calculate points earned (1 point per 1000 Rupiah spent on final amount)
      const pointsEarned = Math.floor(finalAmount / 1000);

      // 4. Update product stock quantities
      for (const update of productUpdates) {
        await tx.update(productsTable)
          .set({ stock_quantity: update.newStock })
          .where(eq(productsTable.id, update.id))
          .execute();
      }

      // 5. Update customer points and cashback balances
      const newPointsBalance = customerData.points_balance + pointsEarned;
      const newCashbackBalance = customerCashbackBalance - cashbackUsed;

      await tx.update(customersTable)
        .set({
          points_balance: newPointsBalance,
          cashback_balance: newCashbackBalance.toString()
        })
        .where(eq(customersTable.id, input.customer_id))
        .execute();

      // 6. Create transaction record
      const transactionResult = await tx.insert(transactionsTable)
        .values({
          customer_id: input.customer_id,
          total_amount: totalAmount.toString(),
          points_earned: pointsEarned,
          cashback_used: cashbackUsed.toString()
        })
        .returning()
        .execute();

      const transaction = transactionResult[0];

      // 7. Create transaction items records
      for (const item of input.items) {
        const product = await tx.select()
          .from(productsTable)
          .where(eq(productsTable.id, item.product_id))
          .execute();

        const productPrice = parseFloat(product[0].price);
        const itemTotalPrice = productPrice * item.quantity;

        await tx.insert(transactionItemsTable)
          .values({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: productPrice.toString(),
            total_price: itemTotalPrice.toString()
          })
          .execute();
      }

      return {
        ...transaction,
        total_amount: parseFloat(transaction.total_amount),
        cashback_used: parseFloat(transaction.cashback_used)
      };
    });

    return result;
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}
