export interface Plan {
    stages: Stage[],
    archive: string[],
}

export interface Stage {
    image: string,
    environment: string[],
    script: string[],
}

export function isPlanValid(plan: Plan): boolean {
    if (plan.stages == null) {
        return false;
    }
    for (const stage of plan.stages) {
        if (stage.image == null || stage.image === '') {
            return false;
        }
    }
    return true;
}