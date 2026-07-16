FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Give the built-in 'node' user ownership of the application files
RUN chown -R node:node /app

# Switch to the non-root user provided by the Node image
USER node

EXPOSE 3001

CMD ["node", "server.js"]