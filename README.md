![Candor](https://i.imgur.com/p4sM3iM.png)


> **An extremely simple containerized CI server.**

### Philosophy

0. The runner and associated dashboard should run in containers.
1. Each pipeline should run in complete isolation from the host.
2. A pipeline may have multiple stages, which will be executed one after another.
3. Pipeline stages all perform work in a single directory, which gets passed from one stage to the next.
4. If a stage fails, all subsequent stages are skipped and the pipeline fails.
5. At the end, select files from the working directory may be permanently archived if required.


### Components

#### Runner

The runner that executes a pipeline according to a pipeline plan.

Technologies:
- TypeScript
- Express.js
- Docker
- S3

#### Frontend

The frontend of the CI web dashboard.

Technologies:
- Svelte

#### Backend

The backend of the CI web dashboard.

Technologies:
- TypeScript
- Express.js
- PostgreSQL

#### Bootstrap

Provides a super simple way to spin up a fully functioning Candor CI stack. This create the following.
- A locally hosted S3 server to handle archives.
- A single pipeline runner.
- A web server to serve the dashboard.
- A database server for the dashboard.

**Warning:** This exposes the Docker socket to the runner's container. 
If you believe this is not worth the risk, please run the runner on baremetal instead.

### Runner

The runner executes a pipeline plan and, if applicable, archives artifacts.

#### Plans

A plan describes how the pipeline should function.
Plans are at their core written in JSON.

When sending a pipeline request to a runner, the following format is required:
```json
{
    "runId": "12345",
    "tag": "veryrandomtaghere",
    "plan": {}
}
```
The `runId` is optional (defaults to a random hex string).
If the pipeline is being triggered by a panel or something that has a run ID, this will force the runner to use this ID to make debugging easier.
The `tag` is also optional (defaults to "untagged"), and specifies some grouping of pipelines.
Multiple pipeline plans can have the same tag, or they can each have their own.

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
runtime | string | Yes | The runtime for the container. Defaults to the default system runtime.
environment | string[] | Yes | A possibly empty array of `KEY=VALUE` environment variables.
script | string[] | Yes | A possibly empty array of shell commands to execute in the container.

#### Archiving

At the end of the pipeline, any file can be archived from the working directory and uploaded to S3 storage.

Archived files will be uploaded to `tag/filename` in S3, where `tag` is the pipeline run's tag and `filename` is the base file name of the file to be archived. Note that when archiving, everything will be flattened: path structures in the working directory are disregarded. For example, `foo/bar.txt` and `baz/bar.txt` both resolve to `bar.txt` and will overwrite eachother. As a workaround, archived files should be renamed before achiving. Furthermore, if folders are specified, these will be skipped and not uploaded to S3.

#### Container Runtimes

Pipeline containers do not get started with `--priveleged` nor do they have access to the Docker daemon.
In order to provide functionality to e.g. build and publish an image, Docker needs to run inside of Docker.
Such functionality is supported using third party runtimes like `sysbox`. 

Candor makes no assumption about runtimes. 
It is up to the host system to install and configure additional container runtimes if the default runtime does not meet system requirements or expectations.