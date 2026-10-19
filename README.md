# Carrossel: 7 repos pro Claude (@wessgarcia)

- `slides/01.png` … `slides/09.png`: arquivos finais em 1080×1350 (4:5, formato de feed do Instagram)
- `LEGENDA.md`: legenda pronta pra postar
- `src/carrossel.html`: fonte editável (todos os slides num arquivo só)
- `render.mjs`: gera os PNGs de novo (`node render.mjs`, precisa do Playwright)

## Vídeos (versão animada)

- `videos/01.mp4` … `videos/09.mp4`: um MP4 por slide, 1080×1350, 30 fps, 7 s (H.264)
- `src/anim.css` + `src/anim.js`: a coreografia das animações (só entra na renderização dos vídeos)
- `render-video.mjs`: gera os vídeos de novo (`node render-video.mjs [segundos] [fps] [slides]`, precisa do Playwright e do ffmpeg)
