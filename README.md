# Candor

An extremely simple containerized CI server.

### Philosophy

- There exists only a single pipeline per project.
- Each pipeline should run in complete isolation from the host.
- A pipeline may have multiple stages, which will be executed one after another.
- Pipeline stages all perform work in a single folder, which gets passed from one stage to the next.
- At the end, certain files may be archived.