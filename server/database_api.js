import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'customer_support',
  user: 'postgres',
  password: 'postgres',
});

async function getCustomerInfo(email) {
  const customer = await getCustomer(email);

  const purchases = await getCustomerPurchases(customer);

  return {
    customer,
    purchases,
  };
}

async function getCustomer(email) {
  const query = 'SELECT * FROM customers WHERE email = $1';
  const params = [email];

  return (await pool.query(query, params)).rows[0];
}

async function getCustomerPurchases(customer) {
  const query = 'SELECT * FROM purchases WHERE customer_id = $1';
  const params = [customer.id];

  return (await pool.query(query, params)).rows;
}

export { getCustomerInfo };
