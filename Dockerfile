# Use Alpine - 90% smaller than regular node image
FROM node:20-slim

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install 

# Copy source code
COPY . .


# Expose port
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]