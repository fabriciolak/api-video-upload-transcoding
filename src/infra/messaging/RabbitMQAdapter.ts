import amqp from 'amqplib';
import { set } from 'zod';

async function connect(uri: string = "amqp://localhost"): Promise<amqp.Channel> {
  try {
    const connection = await amqp.connect(uri);
    const channel = await connection.createChannel();

    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

async function createQueue(channel: amqp.Channel, queue: string): Promise<amqp.Channel> {
  return new Promise((resolve, reject) => {
    try {
      channel.assertQueue(queue, { durable: true })
      resolve(channel)
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

async function sendToQueue(queue: string, message: string): Promise<void> {
  try {
    const ch = await connect()
    const channel = await createQueue(ch, queue)
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true })

    setTimeout(() => {
      ch.close()
    }, 500);

  } catch (error) {
    console.error('Failed to send message to queue:', error);
    throw error;
  }
}

async function consume(queue: string, callback: (msg: string) => void): Promise<void> {
  try {
    const ch = await connect();
    const channel = await createQueue(ch, queue);

    channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
      if (!msg) {
        console.warn('No message received');
        return;
      }
      if (msg) {
        callback(msg.content.toString());
      }
    }, { noAck: true });
  } catch (error) {
    console.error('Failed to consume messages from queue:', error);
    throw error;
  }
}

export {
  consume,
  sendToQueue
}