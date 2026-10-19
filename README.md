# Carrossel: 7 repos pro Claude (@wessgarcia)

- `slides/01.png` … `slides/09.png`: arquivos finais em 1080×1350 (4:5, formato de feed do Instagram)
- `LEGENDA.md`: legenda pronta pra postar
- `src/carrossel.html`: fonte editável (todos os slides num arquivo só)
- `render.mjs`: gera os PNGs de novo (`node render.mjs`, precisa do Playwright)

## Vídeos (versão animada)

- `videos/01.mp4` … `videos/09.mp4`: um MP4 por slide, 1080×1350, 30 fps, 7 s (H.264)
- `src/anim.css` + `src/anim.js`: a coreografia das animações (só entra na renderização dos vídeos)
- `render-video.mjs`: gera os vídeos de novo (`node render-video.mjs [segundos] [fps] [slides]`, precisa do Playwright e do ffmpeg)

## Vídeos com som

- `videos/com-som/01.mp4` … `09.mp4`: os mesmos vídeos com trilha + efeitos (AAC 192k, ~-13 LUFS)
- `audio/sintetizar.py`: gera a trilha (124 BPM, 66 s) e os 7 efeitos por síntese, sem custo (`python3 audio/sintetizar.py`, precisa de numpy e scipy)
- `mix-audio.mjs`: mixa tudo nos vídeos (`node mix-audio.mjs`). Para usar outros sons, substitua os arquivos em `audio/` mantendo os nomes

Trilha de fundo atual: `audio/musica.mp3` (The Innovator's Surge, enviada pelo usuário). A versão sintetizada ficou em `audio/musica-sintetica.mp3`. Os vídeos com som foram normalizados para -14 LUFS.
