export async function POST() {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Say language="fr-FR">Bonjour. Merci de confirmer votre commande Shopify.</Say></Response>`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/xml"
    }
  });
}
