FROM node:22-alpine
WORKDIR /app
# Copy package files first so `npm install` is cached until dependencies change
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
