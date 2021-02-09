import { Context } from 'aws-lambda';
import { SQS, AWSError } from 'aws-sdk';
import { ReceiveMessageResult, Message } from 'aws-sdk/clients/sqs';
import { PromiseResult } from 'aws-sdk/lib/request';


export class SQSUtil {
  private sqs = new SQS({endpoint: `http://${process.env.LOCALSTACK_HOSTNAME}:4566`})

  sendMessage = async (messageBody: string, messageAttributes = {},
    queueName: string, context: Context) => {

    const queueUrl = await this.getQueueUrl(queueName, this.sqs);

    this.dumpEnv();
    console.log(`sending message to queueUrl: ${queueUrl}`);
    console.log(`LOCALSTACK_HOSTNAME : ${process.env.LOCALSTACK_HOSTNAME}`)

    const data = await this.sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: messageAttributes
    }).promise();

    console.log(`Message ${data.MessageId} placed in the Queue: ${queueName}`);

    return data;
  }


  getMessages = async (queueName: string, context: Context) => {
    const queueUrl = await this.getQueueUrl(queueName, this.sqs);

    const params = {
      AttributeNames: ["SentTimestamp"],
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      VisibilityTimeout: 20,
      WaitTimeSeconds: 0
    };

    let messages: Message[] = [];
    try {
      const data: ReceiveMessageResult = await this.sqs.receiveMessage(params).promise()
      console.log('ReceiveMessageResult', data);

      messages = data.Messages || [];

      // Delete messages we already received
      for (const message of messages) {
        console.log('Deleting Receipt:', message.ReceiptHandle)
        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle
        };

        this.sqs.deleteMessage(deleteParams, function (err, data) {
          if (err) {
            console.log("deleteMessage ERROR", err);

          } else {
            console.log("Message Deleted", data);

          }
        });
      }

    } catch (error) {
      console.log(error)
    }

    console.log('messages', messages)
    return messages;
  }

  private getQueueUrl = async (queue: string) => {
    const response : PromiseResult<SQS.Types.GetQueueUrlResult, AWSError>= await this.sqs.getQueueUrl({
      QueueName: queue
    }).promise();
    return response.QueueUrl
  }

  private dumpEnv() {
    const env = process.env;
    Object.keys(env).forEach(function(key) {
      console.log(`export ${key} = "${env[key]}"`);
    });
  }
}