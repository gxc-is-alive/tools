# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and the lockfile (if it exists)
COPY package.json package-lock.json* ./

# Install all dependencies using npm
RUN npm install

# Copy the rest of the source and build the application
COPY . .
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy package.json and the lockfile again for production install
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json* ./package-lock.json

# Install ONLY production dependencies using npm
RUN npm install --omit=dev

# Now copy the rest of the application files
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist

# Expose port and run
EXPOSE 3001
CMD ["node", "server.js"] 