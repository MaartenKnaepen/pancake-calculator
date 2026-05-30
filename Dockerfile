FROM nginx:alpine

# Static site — copy the app into nginx's web root.
COPY index.html styles.css app.js manifest.json /usr/share/nginx/html/

EXPOSE 80
