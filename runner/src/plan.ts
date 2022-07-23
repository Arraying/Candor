/**
 * Represents a request to run the pipeline.
 * The run ID is an optional ID so the same ID can be used for the runner and scheduler.
 */
export interface RunRequestRaw {
    runId?: string
    plan?: Plan
}

/**
 * A request with everything present.
 */
export interface RunRequest {
    runId: string
    plan: Plan
}

/**
 * Represents a pipeline plan.
 * The stages dictate what is done at each stage.
 * The archive dictates what artifacts should be archived at the end of the run.
 */
export interface Plan {
    stages: Stage[]
    archive?: string[]
}

/**
 * Represents a pipeline stage.
 * Each stage must have a name and an image.
 * Optionally, a runtime, environment variables and scripts can be provided.
 */
export interface Stage {
    name: string
    image: string
    runtime?: string
    environment?: string[]
    script?: string[]
}

/**
 * Performs validation on the plan to see if it is legal syntax and valid.
 * @param plan The plan.
 * @returns True if the plan is valid, false otherwise.
 */
export function isPlanValid(plan: Plan): boolean {
    if (plan.stages == null) {
        return false;
    }
    for (const stage of plan.stages) {
        if (stage.name == null || stage.name === "") {
            return false;
        }
        else if (stage.image == null || stage.image === "") {
            return false;
        }
    }
    return true;
}