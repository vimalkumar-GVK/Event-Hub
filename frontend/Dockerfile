# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# VITE_API_URL: set to full backend URL to call backend directly from the browser.
# Leave empty (default) to rely on the nginx proxy (/api, /ws forwarded to NGINX_BACKEND_URL).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:alpine

# Copy built static assets
COPY --from=build /app/dist /usr/share/nginx/html

# Store the nginx config as a template; envsubst fills in NGINX_BACKEND_URL at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# envsubst replaces ${NGINX_BACKEND_URL} in the template before nginx starts.
# The nginx Docker image automatically processes files in /etc/nginx/templates/.
CMD ["nginx", "-g", "daemon off;"]
