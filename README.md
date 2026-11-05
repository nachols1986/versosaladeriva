# Escribiéndote... (GitHub Pages)

Sitio estático completo para **Escribiéndote...** (`versosaladeriva.blogspot.com`), independiente de Blogger y de servicios externos de alojamiento de imágenes.

## Estructura del proyecto

- `index.html` — Estructura principal del blog.
- `styles.css` — Diseño editorial adaptable (escritorio y móvil).
- `app.js` — Navegación cronológica, archivo por año, buscador instantáneo y vista individual por relato.
- `posts.js` — Base de datos estática con los **71 relatos publicados** (2007–2024) más **Clara** en estado borrador (`"draft": true`).
- `images/` — Las **45 fotografías originales** del blog (incluyendo las recuperadas de Flickr de 2010, la foto en alta resolución de Josefina y la foto de Clara).

## Cómo ver el borrador de *Clara* y cómo publicarlo

- **Para previsualizar el borrador:** podés hacer clic en el botón **"Vista de autor (borradores)"** al pie de la página, o abrir el sitio agregando `?drafts=1#clara` a la URL.
- **Para publicar *Clara* definitivamente el día del cumpleaños:**
  1. Abrí `posts.js`.
  2. En el primer elemento (`"id": "clara"`), cambiá `"draft": true` por `"draft": false` y ajustá `"date": "2026-11-04"` a la fecha exacta que quieras mostrar.
  3. Hacé `git commit` y `git push`.

## Cómo publicarlo en GitHub Pages

1. Creá un repositorio en GitHub (por ejemplo `versosaladeriva` o `escribiendote`).
2. Subí el contenido de esta carpeta `site/` a la rama `main`:
   ```bash
   git init
   git add .
   git commit -m "Archivo completo Escribiéndote (2007-2026)"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```
3. En GitHub, entrá a **Settings → Pages → Build and deployment**, elegí **Deploy from a branch** (`main` / `/ (root)`) y guardá.
