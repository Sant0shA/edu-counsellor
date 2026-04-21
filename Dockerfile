FROM node:22-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY report/requirements.txt ./report/
RUN pip3 install -r report/requirements.txt --break-system-packages

COPY . .
RUN npm run build && npm prune --omit=dev

CMD ["npm", "start"]
