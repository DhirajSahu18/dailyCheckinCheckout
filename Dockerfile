FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY automation.js ./

CMD ["node", "automation.js"]
