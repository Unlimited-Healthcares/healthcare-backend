FROM node:20-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps --ignore-scripts && npm install --legacy-peer-deps @supabase/supabase-js --ignore-scripts

COPY . .

RUN npm run build

EXPOSE 3000

FROM node:20-alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production --legacy-peer-deps --ignore-scripts && \
    npm install --legacy-peer-deps bcryptjs @supabase/supabase-js --ignore-scripts

COPY . .

COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
