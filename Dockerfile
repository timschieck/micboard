FROM alpine:3.21

LABEL org.opencontainers.image.authors="tim@jacensolo.com"

WORKDIR /usr/src/app

ENV NODE_VERSION=22.13.1-r0 \
    PYTHON_VERSION=3.12.9-r0

RUN apk update

# Install Node.js, Python 3, and necessary dependencies
RUN apk update 
RUN apk add nodejs=${NODE_VERSION} npm
RUN apk add python3=${PYTHON_VERSION} py3-pip py3-tornado
RUN apk add bash


COPY . .

RUN npm config set loglevel verbose
RUN npm install --omit=dev
RUN npm run build

EXPOSE 8058

CMD ["python3", "py/micboard.py"]
