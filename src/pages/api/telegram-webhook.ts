import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot, { Message } from 'node-telegram-bot-api';

const token = '7619715543:AAGh_F3d-Fy4xiBBjeM3OX9kY3ocS3t7L1g';

let clients: NextApiResponse[] = [];
let bot: TelegramBot | null = null;

function sendEventsToAllClients(data: string) {
  clients.forEach((res) => {
    res.write(`data: ${data}\n\n`);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!bot) {
    bot = new TelegramBot(token, { polling: false });

    // Set webhook URL - replace with your actual public URL
    const webhookUrl = 'https://nextjs-geist-font-example-gglorphans-projects.vercel.app/api/telegram-webhook';
    await bot.setWebHook(webhookUrl);

    bot.on('message', (msg: Message) => {
      const text = msg.text || '';
      if (/(PUT|CALL)\s+Signal\s+EUR[A-Z]{3}\s+M\d+/i.test(text)) {
        const signal = {
          text,
          date: new Date(msg.date * 1000).toISOString(),
        };
        sendEventsToAllClients(JSON.stringify(signal));
      }
    });
  }

  if (req.method === 'POST') {
    bot.processUpdate(req.body);
    res.status(200).send('OK');
  } else if (req.method === 'GET') {
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
  } else {
    res.status(405).end();
  }
}
