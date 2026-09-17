import test from 'node:test';
import assert from 'node:assert/strict';
import { sendHelpRequest } from '../server/helpRequests.js';

test('encaminha sala e mensagem codificadas com POST JSON vazio', async () => {
  let calls = 0;
  const result = await sendHelpRequest({ room: ' 204/A ', message: ' Atenção & áudio? #1 + teste ' }, {
    webhook: 'https://example.test/help',
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url.searchParams.get('room'), '204/A');
      assert.equal(url.searchParams.get('message'), 'Atenção & áudio? #1 + teste');
      assert.equal(url.hash, '');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.equal(options.body, '{}');
      return new Response('{}');
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 1);
});

test('rejeita campos inválidos antes de acessar o webhook', async () => {
  for (const input of [null, {}, { room: 123, message: 'a' }, { room: ' ', message: 'a' }, { room: '1', message: ' ' }, { room: 'a'.repeat(81), message: 'a' }, { room: '1', message: 'a'.repeat(1001) }]) {
    await assert.rejects(sendHelpRequest(input, { fetchImpl: () => assert.fail('Não deve enviar') }), { status: 400 });
  }
});

test('falha do webhook ou conexão não confirma envio e não repete pedido', async () => {
  for (const failure of [() => new Response('secret upstream', { status: 500 }), () => { throw new Error('secret URL'); }]) {
    let calls = 0;
    await assert.rejects(sendHelpRequest({ room: '1', message: 'Ajuda' }, {
      fetchImpl: async () => { calls++; return failure(); },
    }), error => error.status === 502 && !error.message.includes('secret'));
    assert.equal(calls, 1);
  }
});

test('interrompe webhook que não responde', async () => {
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(sendHelpRequest({ room: '1', message: 'Ajuda' }, {
      timeoutMs: 10,
      fetchImpl: async (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })),
    }), { status: 502 });
  } finally { clearTimeout(keepAlive); }
});
