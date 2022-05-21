# Candor

An extremely simple containerized CI server.

### Overview

1. There exists only a single pipeline per project.
2. Each pipeline should run in complete isolation from the host.
3. A pipeline may have multiple stages, which will be executed one after another.
4. Pipeline stages all perform work in a single folder, which gets passed from one stage to the next.
5. At the end, certain files may be archived.

### Plans

A plan describes how the pipeline should function.
Plans are written in JSON.