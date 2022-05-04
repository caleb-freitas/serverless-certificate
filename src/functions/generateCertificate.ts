import { readFileSync } from "node:fs"
import { join } from "node:path"
import { APIGatewayProxyHandler } from "aws-lambda"
import { S3 } from "aws-sdk"
import { compile } from "handlebars"
import dayjs from "dayjs"
import chromium from "chrome-aws-lambda"
import { document } from "../utils/dynamodb.client"

interface ICreateCertificate {
  id: string
  name: string
  grade: string
}

interface ICertificateTemplate {
  id: string
  name: string
  grade: string
  medal: string
  date: string
}

const compileTemplate = async (data: ICertificateTemplate) => {
  const filePath = join(process.cwd(), "src", "templates", "certificate.hbs")
  const html = readFileSync(filePath, "utf-8")
  return compile(html)(data)
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate

  const response = await document.query({
    TableName: "certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    }
  }).promise()

  await document.put({
    TableName: "certificates",
    Item: {
      id,
      name,
      grade,
    }
  }).promise()

  const medalPath = join(process.cwd(), "src", "templates", "selo.png")
  const medal = readFileSync(medalPath, "base64")

  const data: ICertificateTemplate = {
    id,
    name,
    grade,
    medal,
    date: dayjs().format("DD/MM/YYYY")
  }

  const templateContent = await compileTemplate(data)

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  })

  const page = await browser.newPage()

  await page.setContent(templateContent)
  const pdf = await page.pdf({
    format: "a4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
    path: process.env.IS_OFFLINE ? "./certificate.pdf" : null
  })

  await browser.close()

  const s3 = new S3()

  await s3.createBucket({
    Bucket: "ignite-certificate-caleb1"
  }).promise()

  await s3.putObject({
    Bucket: "ignite-certificate-caleb1",
    Key: `${id}.pdf`,
    ACL: "public-read",
    Body: pdf,
    ContentType: "application/pdf"
  }).promise()

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "certificate generated with success",
      url: `https://ignite-certificate-caleb1.s3.amazonaws.com/${id}.pdf`
    })
  }
}
