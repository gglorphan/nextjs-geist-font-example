import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';

const token = '8179510581:AAHyVZIcgZMAKVX1HJraQhYoq-JB96tSuTk';

let clients: NextApiResponse[] = [];
let bot: TelegramBot | null = null;

function sendEventsToAllClients(data: string) {
  clients.forEach((res) => {
    res.write(`data: ${data}\n\n`);
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');

    clients.push(res);

    req.on('close', () => {
      clients = clients.filter((client) => client !== res);
    });
  } else if (req.method === 'POST') {
    // For webhook (not used here)
    res.status(200).end();
  } else {
    res.status(405).end();
  }
}

import { Message } from 'node-telegram-bot-api';

// Initialize bot and start polling once
if (!bot) {
  bot = new TelegramBot(token, { polling: true });

  bot.on('message', (msg: Message) => {
    const text = msg.text || '';
    // Filter messages containing "BUY SIGNAL" or "SELL SIGNAL"
if (/(PUT|CALL)\s+Signal\s+EUR[A-Z]{3}\s+M\d+/i.test(text)) {
      const signal = {
        text,
        date: new Date(msg.date * 1000).toISOString(),
      };
      sendEventsToAllClients(JSON.stringify(signal));
    }
  });
}
