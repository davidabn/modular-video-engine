# 🎬 Video Editor Pro (Modular Engine)

Este projeto é um motor de edição de vídeo híbrido (Python + Remotion) projetado para ser usado com o **Antigravity** ou **Gemini CLI**.

## 🚀 Como começar (Para Humanos)

1.  **Clone o repositório**:
    ```bash
    git clone <seu-repo-url>
    cd editor-master
    ```
2.  **Rode o Setup**:
    ```bash
    ./setup.sh
    ```
3.  **Abra no Antigravity**:
    Basta abrir a pasta e começar a pedir edições de vídeo.

---

## 🤖 Instruções para o Agente (Antigravity/Gemini CLI)

Se você é o agente operando este projeto, siga estas diretrizes:

1.  **Ative a Skill Local**:
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
