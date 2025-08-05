
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProductInputSchema, 
  updateProductInputSchema,
  createCustomerInputSchema,
  createTransactionInputSchema,
  convertPointsToCashbackInputSchema
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateProduct } from './handlers/update_product';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createTransaction } from './handlers/create_transaction';
import { getCustomerLoyaltyInfo } from './handlers/get_customer_loyalty_info';
import { convertPointsToCashback } from './handlers/convert_points_to_cashback';
import { getTransactions } from './handlers/get_transactions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  getProducts: publicProcedure
    .query(() => getProducts()),
  
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
  
  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),
  
  // Transaction management
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  
  getTransactions: publicProcedure
    .input(z.object({ customerId: z.number().optional() }).optional())
    .query(({ input }) => getTransactions(input?.customerId)),
  
  // Loyalty program
  getCustomerLoyaltyInfo: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(({ input }) => getCustomerLoyaltyInfo(input.customerId)),
  
  convertPointsToCashback: publicProcedure
    .input(convertPointsToCashbackInputSchema)
    .mutation(({ input }) => convertPointsToCashback(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
