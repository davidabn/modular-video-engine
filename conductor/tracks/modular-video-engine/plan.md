# 🛠️ Plano de Implementação: Motor de Edição Modular e Inteligente (Modular Video Engine)

O objetivo é transformar o sistema em um editor modular onde o usuário tem controle total sobre os cortes (vía frames ou silêncio) e as legendas são ajustadas matematicamente para evitar re-transcrições desnecessárias.

---

## 🟢 Fase 1: Flexibilidade no Corte (Gatilhos e Limites)
Objetivo: Dar controle ao usuário sobre a agressividade do silêncio e realizar cortes manuais por frames.

- [x] **Task 1.1: Controle de Silêncio no VAD**
  - [x] Atualizar `processor.py` para aceitar `min_silence_ms` como argumento.
  - [x] Passar esse parâmetro para a função `get_speech_timestamps` do Silero VAD.
- [x] **Task 1.2: Implementar Trim por Frames**
  - [x] Criar função `apply_trim(start_frame, end_frame)` no `orchestrator.py`.
  - [x] Converter frames para segundos (`frame / fps`) e usar `trim` do FFmpeg.
- [x] **Task 1.3: Novos Argumentos CLI**
  - [x] Adicionar `--min-silence` (default: 500ms) ao `orchestrator.py`.
  - [x] Adicionar `--trim-start` e `--trim-end` (em frames) ao `orchestrator.py`.

---

## 🟡 Fase 2: O Motor de Sincronia (Shift Engine)
Objetivo: Ajustar as legendas existentes matematicamente para evitar re-transcrição custosa após edições.

- [x] **Task 2.1: Utilitário de Ajuste de Timestamps**
  - [x] Criar função `adjust_subtitles(json_path, offset_start, cut_segments)`.
  - [x] Lógica para "puxar" legendas para trás baseado nos tempos removidos.
- [x] **Task 2.2: Integração Automática com Transcrição**
  - [x] Sempre que um `--trim` ou `--cut` for chamado, verificar se já existe `transcript.json`.
  - [x] Oferecer/Executar o ajuste matemático em vez de chamar a API do AssemblyAI novamente.

---

## 🔵 Fase 3: Desacoplamento Total (Modularidade)
Objetivo: Separar as responsabilidades no `orchestrator.py`.

- [x] **Task 3.1: Refatoração do Fluxo Principal**
  - [x] Desacoplar `--cut` de `--subtitles`.
  - [x] Garantir que `--subtitles` funcione tanto no vídeo original quanto em vídeos já processados.
- [ ] **Task 3.2: Gerenciamento de Estado de Versão**
  - [ ] Atualizar `project_state.json` para rastrear qual versão do vídeo (Original vs. Cut) a legenda atual pertence.
  - [ ] Evitar conflitos de nomes de arquivos.

---

## 📂 Arquivos Chave:
- `video-editor-pro/scripts/orchestrator.py` (O Cérebro)
- `video-editor-pro/scripts/processor.py` (O Executor)
- `editor-master/project_state.json` (O Estado)
