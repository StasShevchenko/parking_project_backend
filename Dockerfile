FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install -g cross-env
RUN npm install -g sequelize-cli
RUN npm install
RUN npm run build
CMD ["cross-env", "NODE_ENV=production", "node", "dist/main.js"]