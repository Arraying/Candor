import ajv from "ajv";

// JSON schema.
const configSchema = {
    title: "Config",
    description: "A pipeline config",
    type: "object",
    properties: {
        stages: {
            description: "An array of pipeline stages",
            type: "array",
            items: {
                description: "A pipeline stage",
                type: "object",
                properties: {
                    name: {
                        description: "The name of the stage",
                        type: "string"
                    },
                    image: {
                        description: "The name of the Docker image",
                        type: "string"
                    },
                    runtime: {
                        description: "The name of the custom runtime",
                        type: [
                        "string",
                        "null"
                        ]
                    },
                    environment: {
                        description: "List of environment variables to be set",
                        type: [
                        "array",
                        "null"
                        ],
                        items: {
                        description: "A key=value pair or just key to take from the shell",
                        type: "string"
                        }
                    },
                    script: {
                        description: "List of commands to execute",
                        type: [
                        "array",
                        "null"
                        ],
                        items: {
                        description: "A command",
                        type: "string"
                        }
                    }
                },
                additionalProperties: false,
                required: [
                    "name",
                    "image"
                ]
            },
            minItems: 0
        },
        archive: {
            description: "List of file paths to archive",
            type: [
                "array",
                "null"
            ],
            items: {
                description: "The file path to archive",
                type: "string"
            }
        }
    },
    additionalProperties: false,
    required: [
        "stages"
    ]
}

const validator = new ajv({ allErrors: true });
const validate = validator.compile(configSchema);

/**
 * Validates the config to see if it is valid.
 * @param json The JSON config.
 * @returns True if it is valid, false otherwise.
 */
export function isConfigValid(json: object): boolean {
    return validate(json);
}