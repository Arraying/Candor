/**
 * Represents a task used to clean up.
 */
export type CleanJob = () => Promise<void>;

/**
 * Keeps track of every task that needs to be cleaned up.
 * This works as a FIFO data structure like a stack.
 * Images can only be removed once containers are removed, same with volumes.
 */
export class Cleaner {
    jobs: CleanJob[]

    /**
     * Initially start with no jobs that need to be cleaned.
     */
    constructor() {
        this.jobs = [];
    }

    /**
     * Add a job to the head cleaning list.
     * @param job The job that will be cleaned.
     */
    addJob(job: CleanJob): void {
        this.jobs.unshift(job);
    }

    /**
     * Clean everything.
     * This will try to clean everything.
     * If a cleaning job fails, it will not impact other jobs.
     * This promise will not reject.
     */
    async clean(): Promise<void> {
        for (const job of this.jobs) {
            try {
                await job();
            } catch (exception) {
                console.error(`Something went wrong cleaning: ${exception}`);
            }
        }
    }
}