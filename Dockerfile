# Use Alpine - 90% smaller than regular node image
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install 

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs
USER appuser

# Expose port
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]