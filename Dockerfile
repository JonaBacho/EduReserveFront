FROM node:18-alpine

WORKDIR /app

# Installer serve globalement pour servir les fichiers statiques
RUN npm install -g serve

COPY package*.json ./

# Installer les dépendances
RUN npm ci

COPY . .

# Arguments de build pour les variables d'environnement
ARG VITE_API_URL=http://fultang.ddns.net:8011/api/v1
ARG VITE_APP_VERSION=1.0.0
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Construire l'application
RUN npm run build

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Changer les permissions
RUN chown -R nextjs:nodejs /app

# Utiliser l'utilisateur non-root
USER nextjs

EXPOSE 9001

# Commande de démarrage avec serve
CMD ["serve", "-s", "dist", "-l", "9001"]