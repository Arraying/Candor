import { Cleaner } from "../cleaner";
import { Client } from "minio";
import Dockerode from "dockerode";
import fs from "fs";
import path from "path";
import tar from "tar";
import tmp from "tmp";
import { workingDirectory } from "../pipeline";

// Constant region.
const region = "eu-west-1";

/**
 * Archives all the required files to S3 storage.
 * @param client The Docker client.
 * @param lastSuccessfulContainer The ID of the last successfully exited contianer.
 * @param runId The run ID for the pipeline run.
 * @param toArchive A non-null array of file paths to archive.
 * @param cleaner The cleaner.
 * @returns A promise of flat file names that were archived.
 */
export async function archiveFiles(client: Dockerode, lastSuccessfulContainer: string, runId: string, toArchive: string[], cleaner: Cleaner): Promise<string[]> {
    // Create a temporary directory which will be used to copy the files from the container.
    const { name, removeCallback } = tmp.dirSync({ unsafeCleanup: true });
    // Clean it up at the end.
    cleaner.addJob(async (): Promise<void> => removeCallback());
    // Check if there even is anything to archive.
    if (toArchive.length === 0) {
        return [];
    }
    // If the credentials are not specified, return.
    if (!process.env.S3_ENDPOINT
        || !process.env.S3_PORT
        || !process.env.S3_ACCESS
        || !process.env.S3_SECRET) {
        return [];
    }
    const result = [];
    // Create the S3 client. This can't be done earlier because the environment variables won't be there.
    const s3 = new Client({
        endPoint: process.env.S3_ENDPOINT,
        port: parseInt(process.env.S3_PORT),
        accessKey: process.env.S3_ACCESS,
        secretKey: process.env.S3_SECRET,
        useSSL: process.env.S3_SSL === "true",
    });
    // Check if the bucket exists.
    const bucket = process.env.S3_BUCKET || "candor";
    const bucketExists = await s3.bucketExists(bucket);
    if (!bucketExists) {
        // Create it so it can be written to.
        await s3.makeBucket(bucket, region);
    }
    // Resovle the container.
    const container = await client.getContainer(lastSuccessfulContainer);
    // For every artifact, copy it into the temporary working directory.
    for (const fileName of toArchive) {
        // The base name of the file, everything gets flattened.
        const baseName = path.basename(fileName);
        // Location on the temporary file.
        const temporaryFilePathTar = path.join(name, `${baseName}.tar`);
        // Create a raw writeable stream to write the file archive.
        const writeStream = fs.createWriteStream(temporaryFilePathTar);
        // Get a raw readable stream of the file archive.
        const readStream = await container.getArchive({
            // Using path.join here will not work if the host is Windows, we must always use Unix separators.
            path: `${workingDirectory}/${fileName}`,
        });
        // Create a promise of the writing process.
        const fileTransfer = new Promise((resolve, reject) => {
            readStream
                // Write the readable stream directly into the file.
                .pipe(writeStream)
                // Reject the promise if there is some sort of error.
                .on("error", reject)
                // Resolve the promise once writing is done.
                .on("finish", resolve);
        });
        // Wait for the file transfer to be finished.
        await fileTransfer;
        // Untar the file.
        await tar.x({
            // Extract in the temporary directory.
            cwd: name,
            // Use fully qualified name here, this won't affect extraction.
            file: temporaryFilePathTar,
        });
        // The name of the file in the temporary filesystem.
        const realFileName = path.join(name, baseName);
        // If file is a directory, skip it.
        if (await (await fs.promises.lstat(realFileName)).isDirectory) {
            continue;
        }
        // The path of the file in S3 storage.
        const archivedPath = `${runId}/${baseName}`;
        // Write the file to S3.
        await s3.fPutObject(bucket, archivedPath, realFileName);
        // Register it.
        result.push(baseName);
    }
    return result;
}
