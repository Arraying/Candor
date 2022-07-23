import { Cleaner } from "../cleaner";
import Docker from "dockerode";

/**
 * Creates a volume for the purpose of the pipeline.
 * @param client The Docker client.
 * @param cleaner The cleaner.
 * @returns A promise of the volume name.
 */
export async function createVolume(client: Docker, cleaner: Cleaner): Promise<string> {
    // First create the volume.
    const volumeCreation = await client.createVolume();
    // The types think it is Name, the property is actually name.
    // eslint-disable-next-line
    const name = (volumeCreation as any).name;
    // Then get access to the volume object.
    const volume = await client.getVolume(name);
    // Clean up the volume at the end.
    cleaner.addJob(async (): Promise<void> => {
        await volume.remove();
    });
    // Return the volume name.
    return name;
}