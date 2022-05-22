![Candor](https://i.imgur.com/p4sM3iM.png)


> **An extremely simple containerized CI server.**

### Philosophy

1. Each pipeline should run in complete isolation from the host.
2. A pipeline may have multiple stages, which will be executed one after another.
3. Pipeline stages all perform work in a single directory, which gets passed from one stage to the next.
4. If a stage fails, all subsequent stages are skipped and the pipeline fails.
5. At the end, select files from the working directory may be permanently archived if required.


### Components

##### Runner

The runner that executes a pipeline according to a pipeline plan.

Technologies:
- TypeScript
- Express.js
- Docker
- S3

##### Frontend

The frontend of the CI web dashboard.

Technologies:
- Svelte

##### Backend

The backend of the CI web dashboard.

Technologies:
- TypeScript
- Express.js
- PostgreSQL

### Plans

A plan describes how the pipeline should function.
Plans are at their core written in JSON.

When sending a pipeline request to a runner, the following format is required:
```json
{
    "tag": "veryrandomtaghere", // optional, will default to "untagged"
    "plan": // pipeline plan
}
```

The following describes the current pipeline plan.

Field | Type | Nullable | Description
-- | -- | -- | --
stages | stage[] | No | A possibly empty array of pipeline stages.
archive | string[] | Yes | The paths of all the filenames that will be archived.

The following describes the current stage plan.

Field | Type | Nullable | Description
-- | -- | -- | --
name | string | No | The name of the stage.
image | string | No | The name of the Docker image to use for the stage.
environment | string[] | Yes | A possibly empty array of `KEY=VALUE` environment variables.
script | string[] | Yes | A possibly empty array of shell commands to execute in the container.