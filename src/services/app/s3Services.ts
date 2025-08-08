import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import dotenv from "dotenv"

dotenv.config()

interface S3Response<T> {
  success: boolean
  message: string
  data?: T
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION_ID,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECURITY_KEY_ID as string,
  },
})

const getSignedUrlForGetObject = async (key: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_ID as string,
      Key: key,
    })
    return await getSignedUrl(s3Client, command, { expiresIn: 36000 })
  } catch (error) {
    throw new Error(
      `Error generating GET signed URL: ${(error as Error).message}`
    )
  }
}

const getSignedUrlForPutObject = async (
  key: string,
  contentType: string
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_ID as string,
      Key: key,
      ContentType: contentType,
    })
    return await getSignedUrl(s3Client, command, { expiresIn: 36000 })
  } catch (error) {
    throw new Error(
      `Error generating PUT signed URL: ${(error as Error).message}`
    )
  }
}

const deleteS3Object = async (key: string): Promise<S3Response<void>> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME_ID as string,
      Key: key,
    })
    await s3Client.send(command)
    return {
      success: true,
      message: `Object with key '${key}' deleted successfully.`,
    }
  } catch (error) {
    throw new Error(`Error deleting object: ${(error as Error).message}`)
  }
}

const listS3Objects = async (): Promise<
  S3Response<ListObjectsV2CommandOutput["Contents"] | undefined>
> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME_ID as string,
      Prefix: "/",
    })
    const data: ListObjectsV2CommandOutput = await s3Client.send(command)
    return {
      success: true,
      message: `Objects listed successfully.`,
      data: data.Contents, // data.Contents is of type S3.Object[] | undefined
    }
  } catch (error) {
    console.error("🚀 ~ listS3Objects ~ error:", error)
    throw new Error(`Error getting objects: ${(error as Error).message}`)
  }
}

export {
  getSignedUrlForGetObject,
  getSignedUrlForPutObject,
  deleteS3Object,
  listS3Objects,
}
