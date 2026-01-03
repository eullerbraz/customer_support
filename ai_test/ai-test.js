import { GoogleGenAI } from '@google/genai';

import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'customer_support',
  user: 'postgres',
  password: 'postgres',
});

const {
  rows: [customer],
} = await pool.query('SELECT * FROM customers WHERE id = $1', [
  'e840c2d4-a915-447f-a811-043d79a5162e',
]);

const { rows: purchases } = await pool.query(
  'SELECT * FROM purchases WHERE "customer_id" = $1',
  [customer.id]
);

function getCustomerAge(birthDate) {
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function getDaysSincePurchase(purchaseDate) {
  const today = new Date();
  const timeDiff = today - purchaseDate;
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff;
}

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
Você é um atendende de uma empresa de e-commerce. Você está conversando com os clientes que podem ter dúvidas sobre suas compras recentes no site. Responda os clientes de forma amigável.

Não informe nada a respeito de você para o cliente, diga apenas que você é um atendente virtual.

Caso o cliente pergunte sobre algo não relacionado à empresa ou aos nossos serviços, indique que não pode ajudá-lo com isso. Caso o cliente pergunte sobre algo relacionado à empresa mas que não é explicitamente sobre suas compras passadas, direcione ele ao atendimento humano pelo número (11) 12345-6789.

Altere o tom das suas respostas de acordo com a idade do cliente. Se o cliente for jovem, dialogue de forma mais informal e descontraída. Se o cliente for mais velho, trate-o com mais formalidade e respeito.

Se o cliente reclamar sobre o atraso nas suas compras, verifique se a compra excedeu o SLA de entrega de acordo com a região do cliente:
Norte: 10 dias úteis
Nordeste: 7 dias úteis
Centro-Oeste: 5 dias úteis
Sudeste: 2 dias úteis
Sul: 5 dias úteis

Você não pode realizar nenhuma ação a não ser reponder perguntas sobre os dados a seguir. Caso o cliente necessite de alguma ação por parte da empresa (como contestar compras), direcione-o ao suporte.

<CLIENTE>
  Nome: ${customer.name}
  Email: ${customer.email}
  Idade: ${getCustomerAge(customer.birthdate)} anos
  Estado: ${customer.state}
</CLIENTE>

<COMPRAS>
${purchases
  .map((purchase) => {
    return `
- Produto: ${purchase.product}
    - Data da Compra: ${purchase.date.toISOString().split('T')[0]}
    - Dias desde a compra: ${getDaysSincePurchase(purchase.date)} dias
    - Status: ${purchase.status}
    - Valor: R$ ${purchase.price}`;
  })
  .join('\n')}
</COMPRAS>
`;

const response = await genai.models.generateContent({
  model: 'gemini-2.0-flash',
  config: {
    systemInstruction,
  },
  contents:
    'Olá, minha última compra do Refinado Concreto Salsicha não chegou ainda. O que está acontecendo?',
});

console.log(response.candidates[0].content.parts[0].text);
