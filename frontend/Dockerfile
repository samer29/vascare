# Build stage
FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage (serve static files)
FROM node:22-alpine

RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/build ./build

EXPOSE 3002
CMD ["serve", "-s", "build", "-l", "3002"]
