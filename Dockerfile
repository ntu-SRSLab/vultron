FROM node:12-alpine3.10

COPY app app
COPY entrypoint.sh app/
WORKDIR app

RUN \
    rm -rf node_modules &&\
    npm install 

EXPOSE 8080

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]