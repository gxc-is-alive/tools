# Stage 1: Build the application
FROM node:18 AS builder

WORKDIR /app

# Install build dependencies including sqlite3 dependencies
RUN apt-get update && apt-get install -y python3 make g++ libvips-dev pkg-config libsqlite3-dev

# Copy package.json and the lockfile (if it exists)
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the source and build the application
COPY . .
RUN pnpm run build

# Stage 2: Create the production image
FROM node:18

WORKDIR /app

# Install runtime dependencies including sqlite3
RUN apt-get update && apt-get install -y libvips sqlite3

# Copy package.json and the lockfile again for production install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml* ./pnpm-lock.yaml

# Install pnpm and ONLY production dependencies
RUN npm install -g pnpm
RUN pnpm install --prod

# Reinstall native modules for the current platform
RUN pnpm remove sharp sqlite3 && pnpm add sharp sqlite3

# Now copy the rest of the application files
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src

# Create directories for persistent data
RUN mkdir -p /app/data /app/uploads /app/uploads/storage

# Create volumes for persistent data
VOLUME ["/app/data", "/app/uploads"]

# Expose port and run
EXPOSE 3001
CMD ["node", "server.js"] 