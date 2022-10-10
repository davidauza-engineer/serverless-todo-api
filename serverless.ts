import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

const serverlessConfiguration: AWS = {
  service: 'todo-api',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-iam-roles-per-function'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: process.env.stage || 'dev',
    region: process.env.region || 'us-east-1',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      TODOS_TABLE: `Todos-${this.provider.stage}`
    }
  },
  // import the function via paths
  functions: {
    createTodo: {
      handler: 'src/lambda/http/createTodo.handler',
      events: {
        http: {
          method: 'POST',
          path: 'todos'
        }
      },
      iamRoleStatements: {
        Effect: 'Allow',
        Action: 'dynamodb:PutItem',
        resource: `arn:aws:dynamodb:${this.provider.region}:*:table/${this.provider.environment.TODOS_TABLE}`
      }
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      TodosDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: this.provider.environment.TODOS_TABLE,
          AttributeDefinitions: {
            AttributeName: 'id',
            AttributeType: 'string'
          },
          KeySchema: {
            AttributeName: 'id',
            KeyType: 'HASH'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
      }
    }
  }
};

module.exports = serverlessConfiguration;
