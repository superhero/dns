FROM node:lts-bullseye

ENV DEBIAN_FRONTEND noninteractive

COPY package.json /opt/dns/package.json
COPY src          /opt/dns/src

WORKDIR /opt/dns

RUN npm install --omit=dev
RUN ln -snf /usr/share/zoneinfo/UTC /etc/localtime && echo "UTC" > /etc/timezone

VOLUME /var/run/docker.sock

EXPOSE 53/tcp
EXPOSE 53/udp

CMD [ "npm", "start" ]
