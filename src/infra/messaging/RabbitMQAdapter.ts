import amqp from 'amqplib';

let connection: amqp.ChannelModel | null = null
const channels: Map<string, amqp.Channel> = new Map()

async function getConnection(uri: string = "amqp://localhost"): Promise<amqp.ChannelModel> {
  if (!connection) {
    connection = await amqp.connect(process.env.RABBITMQ_URI || 'amqp://localhost');
    connection.on('close', () => {
      connection = null
      channels.clear()
    })
  }

  return connection
}

async function getChannel(queue: string): Promise<amqp.Channel> {
  if (!channels.has(queue)) {
    const conn = await getConnection()
    const ch = await conn.createChannel()
    await ch.assertQueue(queue, { durable: true });
    channels.set(queue, ch)
  }

  return channels.get(queue)!
}

async function sendToQueue(queue: string, message: string): Promise<void> {
  const ch = await getChannel(queue)
  ch.sendToQueue(queue, Buffer.from(message), { persistent: true })
}

async function consume(queue: string, callback: (msg: string) => Promise<void> | void): Promise<void> {
  const ch = await getChannel(queue)
  ch.consume(queue, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;

    try {
      await callback(msg.content.toString())
      ch.ack(msg);
    } catch (error) {
      console.error('Failed to consume messages from queue:', error);
    }
  }, { noAck: false })
}

async function closeConnection(): Promise<void> {
  for (const ch of channels.values()) {
    await ch.close()
  }
  channels.clear()

  if (connection) {
    await connection.close()
    connection = null
  }
}

export {
  consume,
  sendToQueue,
  closeConnection
}