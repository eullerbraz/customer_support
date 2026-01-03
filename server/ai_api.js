import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

function getPurchasesString(purchases) {
  return purchases
    .map((purchase) => {
      return `
- Produto: ${purchase.product}
    - Data da Compra: ${purchase.date.toISOString().split('T')[0]}
    - Dias desde a compra: ${getDaysSincePurchase(purchase.date)} dias
    - Status: ${purchase.status}
    - Valor: R$ ${purchase.price}`;
    })
    .join('\n');
}

const getSystemInstruction = (customer, purchases) => `
Você é um atendende de uma empresa de e-commerce. Você está conversando com os clientes que podem ter dúvidas sobre suas compras recentes no site. Responda os clientes de forma amigável.

Não informe nada a respeito de você para o cliente, diga apenas que você é um atendente virtual.

Caso o cliente pergunte sobre algo não relacionado à empresa ou aos nossos serviços, indique que não pode ajudá-lo com isso. Caso o cliente pergunte sobre algo relacionado à empresa mas que não é explicitamente sobre suas compras passadas, direcione ele ao atendimento humano pelo número (11) 12345-6789.

Altere o tom das suas respostas de acordo com a idade do cliente. Se o cliente for jovem, dialogue de forma mais informal e descontraída. Se o cliente for mais velho, trate-o com mais formalidade e respeito. Se possível chame o cliente pelo nome.

Se o cliente reclamar sobre o atraso nas suas compras, verifique se a compra excedeu o SLA de entrega de acordo com a região do cliente:
Norte: 10 dias úteis
Nordeste: 7 dias úteis
Centro-Oeste: 5 dias úteis
Sudeste: 2 dias úteis
Sul: 5 dias úteis

Se houver algum problema, redirecione o cliente para o suporte indicando o número do suporte acima.

Você não pode realizar nenhuma ação a não ser reponder perguntas sobre os dados a seguir. Caso o cliente necessite de alguma ação por parte da empresa (como contestar compras), direcione-o ao suporte.

Ao final da interação, caso o cliente tenha pedido alguma informação, ofereça para mandar essa informação por email. Confirme se o email está correto.

<CLIENTE>
  Nome: ${customer.name}
  Email: ${customer.email}
  Idade: ${getCustomerAge(customer.birthdate)} anos
  Estado: ${customer.state}
</CLIENTE>

<COMPRAS>
${getPurchasesString(purchases)}
</COMPRAS>
`;

async function getAIResponse(customerInfo, userMessage) {
  const systemInstruction = getSystemInstruction(
    customerInfo.customer,
    customerInfo.purchases
  );

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    config: {
      systemInstruction,
    },
    contents: userMessage,
  });

  return response.candidates[0].content.parts[0].text;
}

export { getAIResponse };
