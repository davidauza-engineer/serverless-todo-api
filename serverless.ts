import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'todo-api',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-offline',
    'serverless-iam-roles-per-function',
    'serverless-dynamodb-local'
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: "${opt:stage, 'dev'}",
    region: "${opt:region, 'us-east-1'}" as 'us-east-1',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      TODOS_TABLE: "Todos-${self:provider.stage}"
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [ 'dynamodb:PutItem' ],
            Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}"
          }
        ]
      }
    }
  },
  // import the function via paths
  functions: {
    createTodo: {
      handler: 'src/lambda/http/createTodo.handler',
      events: [
        {
          http: {
            method: 'POST',
            path: 'todo'
          }
        }
      ],
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
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    'serverless-offline': {
      httpPort: 3003
    },
    dynamodb: {
      start: {
        port: 8000,
        inMemory: true,
        migrate: true
      },
      stages: [ 'dev' ]
    }
  },
  resources: {
    Resources: {
      TodosDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: "${self:provider.environment.TODOS_TABLE}",
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'string'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ],
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
