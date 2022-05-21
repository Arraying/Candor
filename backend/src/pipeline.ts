import Docker from "dockerode";
import { buildRequiredImages } from "./management/image";
import { Plan } from "./plan";

export type Status = 'Passed' | 'Failed' | 'Error';

export async function run(plan: Plan): Promise<Status> {
    try {
        // First, build the image for every stage.
        const imageIds = await buildRequiredImages(client, plan);
        return 'Passed';
    } catch (exception) {
        console.log(exception);
        return 'Error';
    }
}

const client = new Docker();
