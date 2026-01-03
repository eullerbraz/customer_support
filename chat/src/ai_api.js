export default async function getResponse(email, prompt) {
  console.log(email);

  const response = await fetch('http://localhost:3000/support', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      message: prompt,
    }),
  });

  const data = await response.json();

  return data.response;
}
