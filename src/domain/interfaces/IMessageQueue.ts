export interface IMessageQueue {
  sendToQueue(queueName: string, message: string): Promise<void>;
  consumeQueue(queueName: string, callback: (msg: string) => void): Promise<void>;
}