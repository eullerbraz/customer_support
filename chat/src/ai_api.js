export default async function getResponse(prompt) {
  const response = await fetch('http://localhost:3000/support', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'miguel_souza14@bol.com.br',
      message: prompt,
    }),
  });

  const data = await response.json();

  return data.response;
}
