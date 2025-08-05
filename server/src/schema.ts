
import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  stock_quantity: z.number().int(),
  category: z.string(),
  created_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  points_balance: z.number().int(),
  cashback_balance: z.number(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  total_amount: z.number(),
  points_earned: z.number().int(),
  cashback_used: z.number(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Transaction item schema
export const transactionItemSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type TransactionItem = z.infer<typeof transactionItemSchema>;

// Input schemas for creating entities
export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().positive(),
  stock_quantity: z.number().int().nonnegative(),
  category: z.string()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const createTransactionInputSchema = z.object({
  customer_id: z.number(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive()
  })),
  cashback_used: z.number().nonnegative().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Update schemas
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  category: z.string().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Loyalty program schemas
export const convertPointsToCashbackInputSchema = z.object({
  customer_id: z.number(),
  points_to_convert: z.number().int().positive()
});

export type ConvertPointsToCashbackInput = z.infer<typeof convertPointsToCashbackInputSchema>;

export const customerLoyaltyInfoSchema = z.object({
  customer_id: z.number(),
  name: z.string(),
  points_balance: z.number().int(),
  cashback_balance: z.number(),
  total_transactions: z.number().int(),
  total_spent: z.number()
});

export type CustomerLoyaltyInfo = z.infer<typeof customerLoyaltyInfoSchema>;
