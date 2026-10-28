# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "fastapi==0.162.0",
#     "pyngrok==9.1.0",
# ]
# ///

import marimo

__generated_with = "0.25.2"
app = marimo.App(width="medium", auto_download=["html"])


@app.cell
def _():
    from pyngrok import ngrok

    token = ""
    ngrok.set_auth_token(token)
    ngrok.connect(8000, "http")
    return


@app.cell
def _(transcribe_audio):
    from fastapi import FastAPI, UploadFile, File, Header
    import os, uuid, traceback

    app = FastAPI()
    UPLOAD_DIR = "/tmp/whisper-uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    @app.get("/health")
    def health():
        return {"status": "ok"}


    @app.post("/transcribe")
    async def transcribe(file: UploadFile = File(...), x_api_key: str = Header(...)):
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{suffix}")

        try:
            with open(file_path, "wb") as f:
                f.write(await file.read())

            text = transcribe_audio(file_path)

            return {"text": text}

        except Exception:
            traceback.print_exc()
            raise

        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    return (app,)


@app.cell
def _(app):
    import asyncio
    import uvicorn

    server = uvicorn.Server(
        uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="debug", access_log=True)
    )

    asyncio.create_task(server.serve())
    return


@app.cell
def _():
    import subprocess

    def transcribe_audio(file_path):
        WHISPER_BIN = "/marimo/whisper.cpp/build/bin/whisper-cli"
        WHISPER_MODEL = "/marimo/ggml-persian-v4.bin"
        result = subprocess.run(
            [
                WHISPER_BIN,
                "-m", WHISPER_MODEL,
                "-f", file_path,
                "-l", "fa",
                "-t", "4",
                "-nt",
                "--no-prints"
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise RuntimeError(result.stderr)

        return result.stdout.strip()

    #transcribe_audio("test.wav")
    return (transcribe_audio,)


@app.cell
def _():
    from gdrive_fsspec import GoogleDriveFileSystem

    fs = GoogleDriveFileSystem(
        auth_kwargs={"use_local_webserver": False},
        use_listings_cache=False,
        skip_instance_cache=True
    )

    print(fs.ls("/"))
    return (fs,)


@app.cell
def _(fs):
    fs.get("ggml-persian-v4.bin", "ggml-persian-v4.bin")
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
