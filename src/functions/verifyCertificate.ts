import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodb.client"

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id } = event.pathParameters
  const response = await document.query({
    TableName: "certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    }
  }).promise()
  const userCertificate = response.Items[0]
  if (!userCertificate) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid certificate",
      })
    }
  }
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "valid certificate",
      name: userCertificate.name,
      url: `https://ignite-certificate-caleb1.s3.amazonaws.com/${id}.pdf`
    })
  }
}