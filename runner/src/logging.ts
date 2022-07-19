import fs from "fs";
import path from "path";

/**
 * Creates a log stream.
 * @param runId The run ID used to identify the log files.
 * @returns A writeable stream to write the log to, must be closed manually.
 */
export function logCreate(runId: string): fs.WriteStream {
    // The exact log file.
    const logFilePath = getPath(runId);
    // Create the log file as a file that can just be appended to.
    return fs.createWriteStream(logFilePath, { flags: "a", encoding: "utf-8" });
}

/**
 * Writes the stage to log.
 * @param writeStream The stream.
 * @param index The step index (0 based).
 * @param total The total number of steps.
 */
export async function logHeader(writeStream: fs.WriteStream, index: number, total: number): Promise<void> {
    const header = `\n${"*".repeat(16)} [${index + 1}/${total}] ${"*".repeat(16)}\n`;
    await promiseWrite(writeStream, header);
}

/**
 * Logs a single piece of information.
 * @param writeStream The stream.
 * @param info A single piece of information.
 */
export async function logInfo(writeStream: fs.WriteStream, info: string): Promise<void> {
    await promiseWrite(writeStream, info);
}

/**
 * Creates the directory of logs if it does not exist yet.
 */
export function makeLogDirectory() {
    try {
        fs.mkdirSync(getLogDirectory(), { recursive: true });
    } catch (error: any) {
        if (error.code !== "EEXIST") {
            throw error;
        }
    }
}

/**
 * Gets the log base directory.
 * @returns The log directory as defined in the config or the current working directory.
 */
function getLogDirectory(): string {
    return process.env.RUNNER_LOGS || process.cwd();
}

/**
 * Creates the log path from the run ID.
 * @param runId The run ID.
 * @returns The path of the log.
 */
 function getPath(runId: string): string {
    return path.join(getLogDirectory(), `${runId}.log`);
}

/**
 * Writes to a stream and returns a promise.
 * @param stream The write stream to write to.
 * @param text The text to write.
 * @returns A promise of void.
 */
function promiseWrite(stream: fs.WriteStream, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
        stream.write(text, (error: Error | null | undefined) => {
            if (!error) {
                resolve();
            } else {
                reject(error);
            }
        })
    });
}
