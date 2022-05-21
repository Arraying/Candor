export interface Plan {
    stages: Stage[]
    archive?: string[]
}

export interface Stage {
    name: string
    image: string
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
        if (stage.name == null || stage.name === '') {
            return false;
        }
        else if (stage.image == null || stage.image === '') {
            return false;
        }
    }
    return true;
}