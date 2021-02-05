import { APIGatewayProxyHandler, APIGatewayEvent, Context } from 'aws-lambda';
import { SQSUtil } from './sqs-util'

const sqsutil = new SQSUtil()

export const taskSubmit: APIGatewayProxyHandler = async (event: APIGatewayEvent, context: Context) => {

  if (!event.body) {
    return {
      statusCode: 412,
      body: JSON.stringify({
        message: 'No body was found',
      }),
    };
  }

  const queueName = 'sqsTaskQueue'
  let statusCode: number = 200;
  let message: string;

  try {
    const data = await sqsutil.sendMessage(event.body, {}, queueName, context)
    message = `Message ${data.MessageId} placed in the Queue: ${queueName}`;

  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;

  }

  return {
    statusCode: statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

export const taskResult: APIGatewayProxyHandler = async (_event: APIGatewayEvent, context: Context) => {
  const messages = await sqsutil.getMessages('sqsTaskQueueResult', context)
  console.log('jobResult:messages: ', messages)

  let content = { message: 'No results available now, check back later' };
  let statusCode = 202

  if (messages.length > 0) {
    statusCode = 200
    content = JSON.parse(messages[0].Body)
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(content),
  };
};

