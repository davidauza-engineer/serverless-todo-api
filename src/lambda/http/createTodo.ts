import * as AWS from 'aws-sdk';
import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as uuid from 'uuid';
import { TodoItem } from '../../models/TodoItem';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { name } = JSON.parse(event.body);

  const id = uuid.v4();
  const todo: TodoItem = { id, done: false, createdAt: new Date().toISOString(), name };

  const docClient = new AWS.DynamoDB.DocumentClient();
  await docClient.put({
    TableName: process.env.TODOS_TABLE,
    Item: todo
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify({
      item: todo
    })
  };
}
