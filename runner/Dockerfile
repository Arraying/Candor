# Stage 1: Compile.
FROM node:16-alpine as compile
WORKDIR /opt/runner
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm i
COPY . ./
RUN npm run build

# Stage 2: Clean.
FROM node:16-alpine as cleaner
WORKDIR /opt/runner
COPY --from=compile /opt/runner/package*.json ./
COPY --from=compile /opt/runner/build ./build
RUN npm i --only=production

# Step 3: Run.
FROM node:16-alpine
WORKDIR /opt/runner
COPY --from=cleaner /opt/runner ./
RUN mv ./build/src/* ./build && rm -r ./build/__tests__
CMD [ "node", "build/main.js" ]