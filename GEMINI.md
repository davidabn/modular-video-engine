# 🎬 Video Editor Pro (Modular Engine)

Este projeto é um motor de edição de vídeo híbrido (Python + Remotion) projetado para ser usado com o **Antigravity** ou **Gemini CLI**.

## 🚀 Como começar (Para Humanos e IAs)

1.  **Clone o repositório**:
    ```bash
    git clone <seu-repo-url>
    cd modular-video-engine
    ```
2.  **Rode o Setup Universal (Mac/Windows/Linux)**:
    ```bash
    python3 setup.py
    ```
    Isso instala: Python Venv, Node modules e o **FFmpeg portátil** (não precisa de `brew` ou instalar nada no sistema).

---

## 🤖 Instruções para o Agente (Antigravity/Gemini CLI)

Se você é o agente operando este projeto:

1.  **Auto-Setup**: Se detectar falta de FFmpeg ou dependências, execute `python3 setup.py` imediatamente.
2.  **Ative a Skill Local**:
    ```bash
    activate_skill video-editor-pro/SKILL.md
    ```
2.  **Fluxo de Trabalho Obrigatório**:
    -   **NUNCA** renderize sem confirmação ("pode renderizar").
    -   Use o `orchestrator.py` para cortes, legendas e manipulação de vídeo.
    -   Use o Remotion (`editor-master/`) apenas para sobreposições e animações.
    -   Sempre use o **Fast Render** (`python3 editor-master/fast_render.py`) para o resultado final.

3.  **Regras de Estilo**:
    -   Estilo Visual: **Dan Koe** (P&B, Glow, Jitter).
    -   Legendas: Luma Masking (Renderizar sobre preto #000000).

---

## 📂 Estrutura do Projeto

-   `video-editor-pro/`: Scripts de processamento (VAD, Legendas, Zoom).
-   `editor-master/`: Projeto Remotion para animações e preview.
-   `projects/`: Armazena vídeos processados e transcrições.
-   `setup.sh`: Script de instalação automatizada.

Para mais detalhes, consulte `video-editor-pro/SKILL.md`.
