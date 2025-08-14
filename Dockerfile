FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .


EXPOSE 5173


CMD ["yarn", "dev", "--host", "0.0.0.0", "--port", "5173"]