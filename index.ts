import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as AWS from 'aws-sdk';

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        switch (event.httpMethod) {
            case 'POST':
                return await createItem(event);
            case 'GET':
                return await getItem(event);
            case 'PUT':
                return await updateItem(event);
            case 'DELETE':
                return await deleteItem(event);
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Invalid HTTP Method' })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error })
        };
    }
};

const createItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body || '{}');
    const params = {
        TableName: TABLE_NAME,
        Item: { id: body.id, ...body }
    };
    await dynamoDB.put(params).promise();
    return { statusCode: 201, body: JSON.stringify({ message: 'Item created' }) };
};

const getItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id;
    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing id parameter' }) };
    }
    const params = { TableName: TABLE_NAME, Key: { id } };
    const result = await dynamoDB.get(params).promise();
    return { statusCode: 200, body: JSON.stringify(result.Item) };
};

const updateItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const body = JSON.parse(event.body || '{}');
    if (!body.id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing id in body' }) };
    }
    const params = {
        TableName: TABLE_NAME,
        Key: { id: body.id },
        UpdateExpression: 'set info = :info',
        ExpressionAttributeValues: { ':info': body.info },
        ReturnValues: 'UPDATED_NEW'
    };
    await dynamoDB.update(params).promise();
    return { statusCode: 200, body: JSON.stringify({ message: 'Item updated' }) };
};

const deleteItem = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.queryStringParameters?.id;
    if (!id) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing id parameter' }) };
    }
    const params = { TableName: TABLE_NAME, Key: { id } };
    await dynamoDB.delete(params).promise();
    return { statusCode: 200, body: JSON.stringify({ message: 'Item deleted' }) };
};
