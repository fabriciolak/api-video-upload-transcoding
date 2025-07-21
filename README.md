Visão geral do desafio
Lidar com uploads de vídeo e processar grandes arquivos de mídia com eficiência é um recurso essencial para plataformas como TikTok e YouTube. Este desafio se concentra em projetar uma API robusta que permita aos usuários enviar vídeos, processá-los usando FFmpeg para transcodificação e armazenar as versões otimizadas para streaming.

Declaração do Problema
Seu sistema deve suportar:

Envios de vídeos – Os usuários devem poder enviar vídeos via API.
Transcodificação de vídeo – O sistema deve processar e converter vídeos em várias resoluções (por exemplo, 1080p, 720p, 480p) usando FFmpeg.
Armazenamento e recuperação – Os vídeos processados devem ser armazenados com segurança e acessíveis para streaming.
Escalabilidade – O sistema deve lidar com uploads simultâneos e transcodificação de forma eficiente.
Requisitos do sistema
Pontos de extremidade da API de vídeo
POST /videos/upload→ Carregar um vídeo.
GET /videos/{video_id}/status→ Verifique o progresso da transcodificação.
GET /videos/{video_id}/stream→ Recupere o vídeo processado.
Considerações de desempenho
Uploads em blocos para lidar com arquivos grandes de forma eficiente.
Processamento de vídeo assíncrono usando um sistema baseado em filas.
Integração FFmpeg para conversão e compactação de formatos.