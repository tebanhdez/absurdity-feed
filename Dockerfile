FROM node:24-alpine

WORKDIR /app

COPY --chown=node:node package.json server.ts index.html ./

ENV HOST=0.0.0.0 \
    PORT=8080 \
    NODE_ENV=production

USER node

EXPOSE 8080

CMD ["node", "--env-file-if-exists=.env", "server.ts"]
