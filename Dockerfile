# Build Stage
FROM node:18 AS builder
WORKDIR /app

# Build arguments for environment variables
# Self-hosted Supabase (Database, Auth, Storage)
ARG VITE_SUPABASE_DB_URL
ARG VITE_SUPABASE_DB_KEY
# Lovable Cloud (Edge Functions & Secrets)
ARG VITE_SUPABASE_FUNCTIONS_URL
ARG VITE_SUPABASE_FUNCTIONS_KEY
# Legacy support (fallback)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

# Set environment variables for build
ENV VITE_SUPABASE_DB_URL=$VITE_SUPABASE_DB_URL
ENV VITE_SUPABASE_DB_KEY=$VITE_SUPABASE_DB_KEY
ENV VITE_SUPABASE_FUNCTIONS_URL=$VITE_SUPABASE_FUNCTIONS_URL
ENV VITE_SUPABASE_FUNCTIONS_KEY=$VITE_SUPABASE_FUNCTIONS_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Serve with NGINX
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
