/**
 * An extension is a mapping from the stage JSON to the extension stage format.
 * The stage is any because the pipeline schema is volatile and this will allow it to be dynamic.
 */
type Extension = (stage: any) => ExtensionStage;

/**
 * An extension must reduce to a stage with a few properties.
 * The image, runtime, environment and script must be provided.
 * The stage's environment and script will be appended to the ones here.
 * The image and runtime will be overrided if provided in the stage.
 */
type ExtensionStage = {
    image?: string
    runtime?: string
    environment?: ExtensionKV[]
    script?: string[]
}

/**
 * A key value pair.
 */
type ExtensionKV = {
    key: string
    value: any
}

/**
 * Parses a specific stage according to an extension.
 * @param name The name of the extension.
 * @param stage The stage using the extension.
 * @returns The extension stage, or null if the extension does not exist/is malformed.
 */
export async function useExtension(name: string, stage: any): Promise<ExtensionStage | null> {
    // Attempt to load the extension.
    let extensionDirectory = process.env.EXTENSION_PATH;
    // Make sure the path exists.
    if (!extensionDirectory) {
        return null;
    }
    // Give it a trailing slash.
    if (!extensionDirectory.endsWith("/")) {
        extensionDirectory += "/";
    }
    // Load the extension.
    try {
        const extension: Extension = (await import(`../${extensionDirectory}${name}.js`)).default;
        return extension(stage);
    } catch (exception) {
        console.error(exception);
        // Malformed module.
        return null;
    }
}