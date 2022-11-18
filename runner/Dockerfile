# Stage 1: Compile.
FROM node:16-alpine as compile
WORKDIR /opt/runner
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY . ./
RUN npm run build

# Stage 2: Clean.
FROM node:16-alpine as cleaner
WORKDIR /opt/runner
COPY --from=compile /opt/runner/package*.json ./
COPY --from=compile /opt/runner/build ./build
RUN npm ci --only=production

# Step 3: Run.
FROM node:16-alpine
WORKDIR /opt/runner
COPY --from=cleaner /opt/runner ./
RUN mv ./build/src ./server && rm -r ./build
ARG CANDOR_BUILD_VERSION=developer
ENV CANDOR_VERSION=$CANDOR_BUILD_VERSION
ENV RUNNER_PORT=3001
ENV RUNNER_LOGS=/var/log/candor/
ENTRYPOINT [ "node", "server/index.js" ]