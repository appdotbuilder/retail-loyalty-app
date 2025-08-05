
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
// Using type-only imports for better TypeScript compliance
import type { 
  Product, 
  Customer, 
  CreateProductInput, 
  CreateCustomerInput, 
  CreateTransactionInput,
  Transaction,
  CustomerLoyaltyInfo,
  ConvertPointsToCashbackInput
} from '../../server/src/schema';

interface CartItem {
  product: Product;
  quantity: number;
}

// STUB DATA - This is temporary demo data since backend handlers are placeholders
const STUB_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Premium Coffee Beans",
    description: "Arabica coffee beans from local farms",
    price: 75000,
    stock_quantity: 50,
    category: "Beverages",
    created_at: new Date('2024-01-15')
  },
  {
    id: 2,
    name: "Organic Rice 5kg",
    description: "Premium organic white rice",
    price: 85000,
    stock_quantity: 30,
    category: "Groceries",
    created_at: new Date('2024-01-16')
  },
  {
    id: 3,
    name: "Fresh Milk 1L",
    description: "Daily fresh milk from local dairy",
    price: 15000,
    stock_quantity: 100,
    category: "Dairy",
    created_at: new Date('2024-01-17')
  },
  {
    id: 4,
    name: "Chocolate Cookies",
    description: "Homemade chocolate chip cookies",
    price: 25000,
    stock_quantity: 75,
    category: "Snacks",
    created_at: new Date('2024-01-18')
  }
];

const STUB_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "Budi Santoso",
    email: "budi@email.com",
    phone: "081234567890",
    points_balance: 1250,
    cashback_balance: 50000,
    created_at: new Date('2024-01-10')
  },
  {
    id: 2,
    name: "Siti Rahayu",
    email: "siti@email.com",
    phone: "081987654321",
    points_balance: 850,
    cashback_balance: 25000,
    created_at: new Date('2024-01-12')
  },
  {
    id: 3,
    name: "Ahmad Rahman",
    email: "ahmad@email.com",
    phone: null,
    points_balance: 2100,
    cashback_balance: 75000,
    created_at: new Date('2024-01-14')
  }
];

const STUB_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    customer_id: 1,
    total_amount: 160000,
    points_earned: 160,
    cashback_used: 0,
    created_at: new Date('2024-01-20T10:30:00')
  },
  {
    id: 2,
    customer_id: 2,
    total_amount: 90000,
    points_earned: 90,
    cashback_used: 10000,
    created_at: new Date('2024-01-21T14:15:00')
  },
  {
    id: 3,
    customer_id: 3,
    total_amount: 250000,
    points_earned: 250,
    cashback_used: 25000,
    created_at: new Date('2024-01-22T09:45:00')
  }
];

function App() {
  // State management with proper typing
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState<CustomerLoyaltyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usingStubData, setUsingStubData] = useState(false);
  
  // Form states
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    description: null,
    price: 0,
    stock_quantity: 0,
    category: ''
  });

  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: null
  });

  const [cashbackToUse, setCashbackToUse] = useState<number>(0);
  const [pointsToConvert, setPointsToConvert] = useState<number>(0);

  // Load data functions with fallback to stub data
  const loadProducts = useCallback(async () => {
    try {
      const result = await trpc.getProducts.query();
      setProducts(result);
      setUsingStubData(false);
    } catch {
      console.warn('Backend not available, using stub data for products');
      setProducts(STUB_PRODUCTS);
      setUsingStubData(true);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch {
      console.warn('Backend not available, using stub data for customers');
      setCustomers(STUB_CUSTOMERS);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const result = await trpc.getTransactions.query();
      setTransactions(result);
    } catch {
      console.warn('Backend not available, using stub data for transactions');
      setTransactions(STUB_TRANSACTIONS);
    }
  }, []);

  const loadLoyaltyInfo = useCallback(async (customerId: number) => {
    try {
      const result = await trpc.getCustomerLoyaltyInfo.query({ customerId });
      setLoyaltyInfo(result);
    } catch {
      console.warn('Backend not available, using stub data for loyalty info');
      // Generate stub loyalty info based on customer
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const customerTransactions = STUB_TRANSACTIONS.filter(t => t.customer_id === customerId);
        const totalSpent = customerTransactions.reduce((sum, t) => sum + t.total_amount, 0);
        setLoyaltyInfo({
          customer_id: customerId,
          name: customer.name,
          points_balance: customer.points_balance,
          cashback_balance: customer.cashback_balance,
          total_transactions: customerTransactions.length,
          total_spent: totalSpent
        });
      }
    }
  }, [customers]);

  // useEffect with proper dependencies
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadTransactions();
  }, [loadProducts, loadCustomers, loadTransactions]);

  useEffect(() => {
    if (selectedCustomer) {
      loadLoyaltyInfo(selectedCustomer);
    } else {
      setLoyaltyInfo(null);
    }
  }, [selectedCustomer, loadLoyaltyInfo]);

  // Product management with stub data simulation
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (usingStubData) {
        // Simulate adding to stub data
        const newProduct: Product = {
          id: Math.max(...products.map(p => p.id)) + 1,
          ...productForm,
          created_at: new Date()
        };
        setProducts((prev: Product[]) => [...prev, newProduct]);
      } else {
        const response = await trpc.createProduct.mutate(productForm);
        setProducts((prev: Product[]) => [...prev, response]);
      }
      
      setProductForm({
        name: '',
        description: null,
        price: 0,
        stock_quantity: 0,
        category: ''
      });
    } catch (error) {
      console.error('Failed to create product:', error);
      // Fallback to stub behavior
      if (!usingStubData) {
        const newProduct: Product = {
          id: Math.max(...products.map(p => p.id)) + 1,
          ...productForm,
          created_at: new Date()
        };
        setProducts((prev: Product[]) => [...prev, newProduct]);
        setUsingStubData(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Customer management with stub data simulation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (usingStubData) {
        // Simulate adding to stub data
        const newCustomer: Customer = {
          id: Math.max(...customers.map(c => c.id)) + 1,
          ...customerForm,
          points_balance: 0,
          cashback_balance: 0,
          created_at: new Date()
        };
        setCustomers((prev: Customer[]) => [...prev, newCustomer]);
      } else {
        const response = await trpc.createCustomer.mutate(customerForm);
        setCustomers((prev: Customer[]) => [...prev, response]);
      }
      
      setCustomerForm({
        name: '',
        email: '',
        phone: null
      });
    } catch (error) {
      console.error('Failed to create customer:', error);
      // Fallback to stub behavior
      if (!usingStubData) {
        const newCustomer: Customer = {
          id: Math.max(...customers.map(c => c.id)) + 1,
          ...customerForm,
          points_balance: 0,
          cashback_balance: 0,
          created_at: new Date()
        };
        setCustomers((prev: Customer[]) => [...prev, newCustomer]);
        setUsingStubData(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cart management
  const addToCart = (product: Product) => {
    setCart((prev: CartItem[]) => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev: CartItem[]) => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev: CartItem[]) =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Transaction processing with stub data simulation
  const processTransaction = async () => {
    if (!selectedCustomer || cart.length === 0) return;
    
    setIsLoading(true);
    try {
      const transactionInput: CreateTransactionInput = {
        customer_id: selectedCustomer,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        })),
        cashback_used: cashbackToUse || undefined
      };

      if (usingStubData) {
        // Simulate transaction with stub data
        const newTransaction: Transaction = {
          id: Math.max(...transactions.map(t => t.id)) + 1,
          customer_id: selectedCustomer,
          total_amount: finalTotal,
          points_earned: pointsEarned,
          cashback_used: cashbackToUse,
          created_at: new Date()
        };
        
        setTransactions((prev: Transaction[]) => [...prev, newTransaction]);
        
        // Update customer balances
        setCustomers((prev: Customer[]) =>
          prev.map(customer => 
            customer.id === selectedCustomer
              ? {
                  ...customer,
                  points_balance: customer.points_balance + pointsEarned - Math.floor(cashbackToUse / 100),
                  cashback_balance: customer.cashback_balance - cashbackToUse + (pointsToConvert * 100)
                }
              : customer
          )
        );
        
        // Update product stock
        setProducts((prev: Product[]) =>
          prev.map(product => {
            const cartItem = cart.find(item => item.product.id === product.id);
            return cartItem
              ? { ...product, stock_quantity: product.stock_quantity - cartItem.quantity }
              : product;
          })
        );
      } else {
        await trpc.createTransaction.mutate(transactionInput);
        await loadProducts();
        await loadTransactions();
      }
      
      // Clear cart and reload data
      setCart([]);
      setCashbackToUse(0);
      if (selectedCustomer) {
        await loadLoyaltyInfo(selectedCustomer);
      }
    } catch (error) {
      console.error('Failed to process transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Points conversion with stub data simulation
  const convertPoints = async () => {
    if (!selectedCustomer || pointsToConvert <= 0) return;

    setIsLoading(true);
    try {
      const input: ConvertPointsToCashbackInput = {
        customer_id: selectedCustomer,
        points_to_convert: pointsToConvert
      };

      if (usingStubData) {
        // Simulate points conversion
        setCustomers((prev: Customer[]) =>
          prev.map(customer =>
            customer.id === selectedCustomer
              ? {
                  ...customer,
                  points_balance: customer.points_balance - pointsToConvert,
                  cashback_balance: customer.cashback_balance + (pointsToConvert * 100)
                }
              : customer
          )
        );
      } else {
        await trpc.convertPointsToCashback.mutate(input);
      }
      
      setPointsToConvert(0);
      if (selectedCustomer) {
        await loadLoyaltyInfo(selectedCustomer);
      }
    } catch (error) {
      console.error('Failed to convert points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const finalTotal = Math.max(0, cartTotal - cashbackToUse);
  const pointsEarned = Math.floor(finalTotal / 1000); // 1 point per 1000 Rupiah

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏪 Retail Store Manager</h1>
          <p className="text-gray-600">Complete retail management with loyalty rewards</p>
        </div>

        {usingStubData && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              ⚠️ <strong>Demo Mode:</strong> Backend is not available. Using sample data for demonstration. 
              All features are functional but data changes are temporary.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pos">🛒 Point of Sale</TabsTrigger>
            <TabsTrigger value="products">📦 Products</TabsTrigger>
            <TabsTrigger value="customers">👥 Customers</TabsTrigger>
            <TabsTrigger value="loyalty">⭐ Loyalty</TabsTrigger>
            <TabsTrigger value="transactions">📊 Transactions</TabsTrigger>
          </TabsList>

          {/* Point of Sale Tab */}
          <TabsContent value="pos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Selection */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>🛍️ Available Products</CardTitle>
                    <CardDescription>Select products to add to cart</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No products available. Add some products first! 📦</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product: Product) => (
                          <Card key={product.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{product.name}</h3>
                                <Badge variant="secondary">{product.category}</Badge>
                              </div>
                              {product.description && (
                                <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                              )}
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xl font-bold text-green-600">
                                  Rp {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Stock: {product.stock_quantity}
                                </span>
                              </div>
                              <Button 
                                onClick={() => addToCart(product)}
                                disabled={product.stock_quantity === 0}
                                className="w-full"
                              >
                                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cart and Checkout */}
              <div className="space-y-4">
                {/* Customer Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>👤 Select Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(value ? parseInt(value) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Shopping Cart */}
                <Card>
                  <CardHeader>
                    <CardTitle>🛒 Shopping Cart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Cart is empty</p>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item: CartItem) => (
                          <div key={item.product.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-600">Rp {item.product.price.toLocaleString()} each</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Checkout */}
                {cart.length > 0 && selectedCustomer && (
                  <Card>
                    <CardHeader>
                      <CardTitle>💳 Checkout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loyaltyInfo && loyaltyInfo.cashback_balance > 0 && (
                        <div>
                          <Label>Use Cashback (Available: Rp {loyaltyInfo.cashback_balance.toLocaleString()})</Label>
                          <Input
                            type="number"
                            value={cashbackToUse}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              setCashbackToUse(Math.min(parseFloat(e.target.value) || 0, loyaltyInfo.cashback_balance, cartTotal))
                            }
                            max={Math.min(loyaltyInfo.cashback_balance, cartTotal)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>Rp {cartTotal.toLocaleString()}</span>
                        </div>
                        {cashbackToUse > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Cashback Used:</span>
                            <span>-Rp {cashbackToUse.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>Rp {finalTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Points to Earn:</span>
                          <span>⭐ {pointsEarned} points</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={processTransaction}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? 'Processing...' : 'Complete Purchase 🎉'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Products Management Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>➕ Add New Product</CardTitle>
                  <CardDescription>Add products to your store inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <Input
                      placeholder="Product name"
                      value={productForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={productForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                    />
                    <Input
                      placeholder="Category"
                      value={productForm.category}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, category: e.target.value }))
                      }
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Price (Rupiah)"
                      value={productForm.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                      step="0.01"
                      min="0"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Stock quantity"
                      value={productForm.stock_quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductForm((prev: CreateProductInput) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                      }
                      min="0"
                      required
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Adding...' : 'Add Product 📦'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📋 Product List</CardTitle>
                  <CardDescription>Current inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No products yet. Add one!</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {products.map((product: Product) => (
                        <Card key={product.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{product.name}</h3>
                              {product.description && (
                                <p className="text-sm text-gray-600">{product.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <Badge>{product.category}</Badge>
                                <span className="text-green-600 font-bold">
                                  Rp {product.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Stock: {product.stock_quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Management Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>➕ Add New Customer</CardTitle>
                  <CardDescription>Register new customers for loyalty program</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCustomer} className="space-y-4">
                    <Input
                      placeholder="Customer name"
                      value={customerForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomerForm((prev: CreateCustomerInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={customerForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomerForm((prev: CreateCustomerInput) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                    <Input
                      placeholder="Phone number (optional)"
                      value={customerForm.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCustomerForm((prev: CreateCustomerInput) => ({
                          ...prev,
                          phone: e.target.value || null
                        }))
                      }
                    />
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Adding...' : 'Add Customer 👤'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>👥 Customer List</CardTitle>
                  <CardDescription>Registered customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {customers.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No customers yet. Add one!</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customers.map((customer: Customer) => (
                        <Card key={customer.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{customer.name}</h3>
                              <p className="text-sm text-gray-600">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span className="text-blue-600">⭐ {customer.points_balance} points</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-green-600">💰 Rp {customer.cashback_balance.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Loyalty Program Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>⭐ Customer Loyalty Dashboard</CardTitle>
                <CardDescription>Manage points and cashback conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Select Customer</Label>
                    <Select value={selectedCustomer?.toString() || ''} onValueChange={(value) => setSelectedCustomer(value ? parseInt(value) : null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: Customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {loyaltyInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <CardHeader>
                          <CardTitle className="text-blue-700">🎯 Loyalty Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span>Customer:</span>
                            <span className="font-semibold">{loyaltyInfo.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Points Balance:</span>
                            <span className="font-bold text-blue-600">⭐ {loyaltyInfo.points_balance}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cashback Balance:</span>
                            <span className="font-bold text-green-600">💰 Rp {loyaltyInfo.cashback_balance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Transactions:</span>
                            <span>{loyaltyInfo.total_transactions}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Spent:</span>
                            <span className="font-semibold">Rp {loyaltyInfo.total_spent.toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-green-50 to-green-100">
                        <CardHeader>
                          <CardTitle className="text-green-700">💱 Convert Points to Cashback</CardTitle>
                          <CardDescription>100 points = Rp 10,000 cashback</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Points to Convert</Label>
                            <Input
                              type="number"
                              value={pointsToConvert}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setPointsToConvert(Math.min(parseInt(e.target.value) || 0, loyaltyInfo.points_balance))
                              }
                              max={loyaltyInfo.points_balance}
                              min="0"
                              step="100"
                            />
                          </div>
                          {pointsToConvert > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-700">
                                {pointsToConvert} points → Rp {(pointsToConvert * 100).toLocaleString()} cashback
                              </p>
                            </div>
                          )}
                          <Button 
                            onClick={convertPoints}
                            disabled={isLoading || pointsToConvert <= 0 || pointsToConvert > loyaltyInfo.points_balance}
                            className="w-full"
                          >
                            {isLoading ? 'Converting...' : 'Convert Points 🔄'}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!loyaltyInfo && selectedCustomer && (
                    <div className="text-center py-8 text-gray-500">
                      Loading customer loyalty information...
                    </div>
                  )}

                  {!selectedCustomer && (
                    <div className="text-center py-8 text-gray-500">
                      Select a customer to view loyalty information
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Transaction History</CardTitle>
                <CardDescription>View all store transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transactions yet. Complete some sales first! 🛒</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction: Transaction) => {
                      const customer = customers.find(c => c.id === transaction.customer_id);
                      return (
                        <Card key={transaction.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">Transaction #{transaction.id}</p>
                              <p className="text-sm text-gray-600">
                                Customer: {customer?.name || `ID: ${transaction.customer_id}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                Date: {transaction.created_at.toLocaleDateString()} {transaction.created_at.toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">Rp {transaction.total_amount.toLocaleString()}</p>
                              <p className="text-sm text-blue-600">⭐ {transaction.points_earned} points earned</p>
                              {transaction.cashback_used > 0 && (
                                <p className="text-sm text-green-600">💰 Rp {transaction.cashback_used.toLocaleString()} cashback used</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
