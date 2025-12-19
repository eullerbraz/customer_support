import { fakerPT_BR as faker } from '@faker-js/faker';
import { Pool } from 'pg';

function createCustomer() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const birthdate = faker.date.birthdate();
  const state = faker.location.state();
  const email = faker.internet.email({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
  });

  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    birthdate,
    state,
    email,
  };
}

function createPurchase(customerId) {
  const price = faker.commerce.price({
    min: 10,
    max: 1000,
    dec: 2,
  });

  console.log(price);

  const date = faker.date.recent({ days: 10 });

  const product = faker.commerce.productName();

  const status = faker.helpers.arrayElement([
    'confirmada',
    'pagamento confirmado',
    'em separação',
    'em trânsito',
    'entregue',
    'atrasada',
    'cancelado pelo usuário',
    'cancelado pelo vendedor',
  ]);

  return {
    id: faker.string.uuid(),
    customerId,
    product,
    price,
    date,
    status,
  };
}

function createPurchasesForCustomer(customerId) {
  const purchasesProbabilities = [
    { value: 0, weight: 10 },
    { value: 1, weight: 50 },
    { value: 2, weight: 20 },
    { value: 3, weight: 10 },
    { value: 4, weight: 7 },
    { value: 5, weight: 3 },
  ];

  const nPurchases = faker.helpers.weightedArrayElement(purchasesProbabilities);

  const purchases = [];

  for (let i = 0; i < nPurchases; i++) {
    purchases.push(createPurchase(customerId));
  }

  return purchases;
}

const customers = [];
const purchases = [];

for (let i = 0; i < 100; i++) {
  const customer = createCustomer();
  customers.push(customer);

  const customerPurchases = createPurchasesForCustomer(customer.id);

  purchases.push(...customerPurchases);
}

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'customer_support',
  user: 'postgres',
  password: 'postgres',
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE NOT NULL,
  state VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL
);`);

await pool.query(`
  DO $$ 
  BEGIN
    CREATE TYPE purchase_status AS ENUM (
      'confirmada',
      'pagamento confirmado',
      'em separação',
      'em trânsito',
      'entregue',
      'atrasada',
      'cancelado pelo usuário',
      'cancelado pelo vendedor'
    );
  EXCEPTION 
    WHEN duplicate_object THEN null;
  END $$;
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  product VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  status purchase_status NOT NULL
);`);

for (const customer of customers) {
  await pool.query(
    `
    INSERT INTO customers (id, first_name, last_name, birthdate, state, email)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING;
  `,
    [
      customer.id,
      customer.firstName,
      customer.lastName,
      customer.birthdate,
      customer.state,
      customer.email,
    ]
  );
}

for (const purchase of purchases) {
  await pool.query(
    `
    INSERT INTO purchases (id, customer_id, product, price, date, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO NOTHING;
  `,
    [
      purchase.id,
      purchase.customerId,
      purchase.product,
      purchase.price,
      purchase.date,
      purchase.status,
    ]
  );
}

await pool.end();

console.log('Data insertion completed.');
