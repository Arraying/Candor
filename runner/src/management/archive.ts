import { Client } from "minio";
import path from "path";

/**
 * Archives files from a pipeline run.
 * @param tag The pipeline run's tag.
 * @param workingDirectory The path of the workspace on the host, not container.
 * @param toArchive Null or a list of file names to archive.
 */
export async function archiveFiles(tag: string, workingDirectory: string, toArchive?: string[]): Promise<void> {
    // Create the S3 client. This can't be done earlier because the environment variables won't be there.
    const s3 = new Client({
        endPoint: process.env.S3_ENDPOINT!,
        port: parseInt(process.env.S3_PORT!),
        accessKey: process.env.S3_ACCESS!,
        secretKey: process.env.S3_SECRET!,
        useSSL: false
    });
    // Check if the bucket exists.
    const bucket = process.env.S3_BUCKET!;
    const bucketExists = await s3.bucketExists(bucket);
    if (!bucketExists) {
        // Create it so it can be written to.
        await s3.makeBucket(bucket, "");
    }
    // Iterate through every archived file (if applicable).
    for (const fileName of toArchive || []) {
        const fromPath = path.join(workingDirectory, fileName);
        const toPath = path.join(tag, fileName);
        await s3.fPutObject(bucket, toPath, fromPath);
    }
}