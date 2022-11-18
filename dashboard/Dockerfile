# Stage 1: Compile frontend.
FROM node:16-alpine as compile_frontend
WORKDIR /opt/frontend
# Copy all the NPM and Rollup files.
COPY frontend/package*.json ./
COPY frontend/rollup.config.js ./
# Install dependencies and compile assets.
RUN npm ci
COPY frontend ./
# Inject build version.
ARG CANDOR_BUILD_VERSION=developer
ENV CANDOR_VERSION=$CANDOR_BUILD_VERSION
RUN npm run build

# Stage 2: Compile backend.
FROM node:16-alpine as compile_backend
WORKDIR /opt/backend
# Copy all the NPM and TS files.
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
# Install dependencies and compile.
RUN npm ci
COPY backend ./
RUN npm run build

# Stage 3: Clean backend.
FROM node:16-alpine as cleaner_backend
WORKDIR /opt/backend
# Copy all the NPM files.
COPY --from=compile_backend /opt/backend/package*.json ./
COPY --from=compile_backend /opt/backend/build ./build
# Install runtime dependencies.
RUN npm ci --only=production

# Step 4: Run.
FROM node:16-alpine
WORKDIR /opt/dashboard
COPY entrypoint.sh ./entrypoint.sh
# Put the compiled backend sources into /opt/dashboard/server.
COPY --from=cleaner_backend /opt/backend ./
RUN mv ./build ./server && mkdir -p /var/log/candor/
# Also copy the migrations.
COPY backend/src/migration ./server/migration
# Put the compiled frontend into /opt/dashboard/public.
COPY --from=compile_frontend /opt/frontend/public/ ./public
# Set some Docker-specific environment variables.
ARG CANDOR_BUILD_VERSION=developer
ENV CANDOR_VERSION=$CANDOR_BUILD_VERSION
ENV DASHBOARD_PORT=3000
ENV DASHBOARD_PUBLIC=/opt/dashboard/public
ENV DASHBOARD_LOGS=/var/log/candor/
# Serve (performs migrations and starts the app).
ENTRYPOINT [ "./entrypoint.sh" ]