import fs from "fs";
import path from "path";

/**
 * Archives files from a pipeline run.
 * @param archivePath The path of the persistent archive.
 * @param workingDirectory The path of the workspace on the host, not container.
 * @param toArchive Null or a list of file names to archive.
 */
export function archiveFiles(archivePath: string, workingDirectory: string, toArchive?: string[]) {
    // Iterate through every archived file (if applicable).
    for (const fileName of toArchive || []) {
        const fromPath = path.join(workingDirectory, fileName);
        const toPath = path.join(archivePath, fileName);
        fs.copyFileSync(fromPath, toPath);
    }
}