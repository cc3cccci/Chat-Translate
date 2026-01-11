# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (use ci for consistent installs)
# Legacy peer deps flag might be needed if there are conflicts, but try standard first
RUN npm ci

# Copy source
COPY . .

# Accept build arguments
ARG VITE_API_KEY
ARG VITE_API_BASE_URL
ARG VITE_API_PROTOCOL

# Set environment variables for build
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_PROTOCOL=$VITE_API_PROTOCOL

# Build the app
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
