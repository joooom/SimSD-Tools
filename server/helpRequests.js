const DEFAULT_WEBHOOK = 'https://n8n.raag.dev/webhook/9MY1b84GOgSeF2LRWFyarw';

export async function sendHelpRequest(input, {
  webhook = process.env.SIMSD_HELP_WEBHOOK_URL || DEFAULT_WEBHOOK,
  fetchImpl = fetch,
  timeoutMs = 10000,
} = {}) {
  if (!input || typeof input.room !== 'string' || typeof input.message !== 'string') {
    throw Object.assign(new Error('Informe o número da sala e a mensagem.'), { status: 400 });
  }
  const room = input.room.trim();
  const message = input.message.trim();
  if (!room || room.length > 80 || !message || message.length > 1000) {
    throw Object.assign(new Error('Informe uma sala de até 80 caracteres e uma mensagem de até 1000 caracteres.'), { status: 400 });
  }
  try {
    const url = new URL(webhook);
    url.searchParams.set('room', room);
    url.searchParams.set('message', message);
    const response = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      signal: AbortSignal.timeout(timeoutMs), redirect: 'error',
    });
    await response.body?.cancel();
    if (!response.ok) throw new Error('Webhook recusou o pedido.');
  } catch {
    throw Object.assign(new Error('Não foi possível confirmar o envio do pedido de ajuda. Verifique a conexão e tente novamente.'), { status: 502 });
  }
  return { ok: true };
}
