FROM node:22-alpine
WORKDIR /app
# Copy package files first so `npm install` is cached until dependencies change
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# --host 0.0.0.0 so the dev server is reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
