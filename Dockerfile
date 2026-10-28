FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY addon.js server.js ./
COPY landing.html ./
COPY data ./data
COPY public ./public
USER node
ENV PORT=7000
EXPOSE 7000
CMD ["node", "server.js"]
