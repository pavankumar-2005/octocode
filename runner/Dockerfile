# Debian (not Alpine) so we can install a full JDK; all packages are native arm64 on Apple Silicon.
FROM node:22-bookworm-slim
# The mkdir works around a known Debian-slim bug where the JDK install fails without man1.
RUN mkdir -p /usr/share/man/man1 \
 && apt-get update \
 && apt-get install -y --no-install-recommends gcc g++ libc6-dev openjdk-17-jdk-headless \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# Run user code as the unprivileged "node" user, never as root.
USER node
EXPOSE 7000
CMD ["npm", "start"]
