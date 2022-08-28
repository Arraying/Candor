import { Client } from "minio";
import { Readable } from "stream";

/**
 * Downloads a file from S3.
 * @param runId The run ID.
 * @param fileName The file name.
 * @returns A stream of the download.
 */
export async function downloadStream(runId: string, fileName: string): Promise<Readable> {
    const client = await getClient();
    return await client.getObject(process.env.S3_BUCKET as string, `${runId}/${fileName}`);
}

/**
 * Downloads a file from S3.
 * @param runId The run ID.
 * @param fileName The file name.
 * @param diskPath The path on disk where it should be downloaded.
 */
export async function downloadFile(runId: string, fileName: string, diskPath: string) {
    const client = await getClient();
    return await client.fGetObject(process.env.S3_BUCKET as string, `${runId}/${fileName}`, diskPath);
}

/**
 * Gets the S3 client and does credential checking.
 * @returns The client.
 */
async function getClient(): Promise<Client> {
    // Make sure the credentials are present.
    if (!process.env.S3_BUCKET
        || !process.env.S3_REGION
        || !process.env.S3_ENDPOINT
        || !process.env.S3_PORT
        || !process.env.S3_ACCESS
        || !process.env.S3_SECRET) {
        throw new Error("Invalid S3 credentials");
    }
    // Construct the client.
    const s3 = new Client({
        endPoint: process.env.S3_ENDPOINT,
        port: parseInt(process.env.S3_PORT),
        accessKey: process.env.S3_ACCESS,
        secretKey: process.env.S3_SECRET,
        useSSL: process.env.S3_SSL === "true",
    });
    return s3;
}