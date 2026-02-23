import os
import sys
import subprocess
import platform
import urllib.request
import zipfile
import tarfile
import shutil

def run_command(command, shell=True):
    try:
        subprocess.run(command, shell=shell, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def install_ffmpeg():
    print("🔍 Checking for FFmpeg...")
    if shutil.which("ffmpeg"):
        print("✅ FFmpeg is already installed in the system.")
        return True

    print("⚠️ FFmpeg not found. Attempting to download a portable version...")
    
    os.makedirs("bin", exist_ok=True)
    system = platform.system()
    
    if system == "Darwin":  # Mac
        url = "https://evermeet.cx/ffmpeg/getrelease/zip" # Static build for Mac
        dest = "bin/ffmpeg.zip"
        print(f"Downloading FFmpeg for Mac...")
        urllib.request.urlretrieve(url, dest)
        with zipfile.ZipFile(dest, 'r') as zip_ref:
            zip_ref.extractall("bin")
        os.chmod("bin/ffmpeg", 0o755)
        print("✅ FFmpeg portable installed in ./bin/ffmpeg")
        
    elif system == "Windows":
        url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
        dest = "bin/ffmpeg.zip"
        print(f"Downloading FFmpeg for Windows...")
        urllib.request.urlretrieve(url, dest)
        with zipfile.ZipFile(dest, 'r') as zip_ref:
            zip_ref.extractall("bin")
            # Move ffmpeg.exe to bin root for easier access
            for root, dirs, files in os.walk("bin"):
                if "ffmpeg.exe" in files:
                    shutil.copy(os.path.join(root, "ffmpeg.exe"), "bin/ffmpeg.exe")
                    shutil.copy(os.path.join(root, "ffprobe.exe"), "bin/ffprobe.exe")
                    break
        print("✅ FFmpeg portable installed in ./bin/ffmpeg.exe")
        
    elif system == "Linux":
        print("Please install ffmpeg using your package manager (apt install ffmpeg, etc.)")
        return False
    
    return True

def setup_python():
    print("📦 Setting up Python environment...")
    if not os.path.exists("venv"):
        run_command(f"{sys.executable} -m venv venv")
    
    # Determine pip path
    pip_path = os.path.join("venv", "Scripts", "pip") if platform.system() == "Windows" else os.path.join("venv", "bin", "pip")
    
    run_command(f"{pip_path} install --upgrade pip")
    run_command(f"{pip_path} install -r video-editor-pro/scripts/requirements.txt")
    print("✅ Python dependencies installed.")

def setup_node():
    print("📦 Setting up Node.js dependencies...")
    if not shutil.which("npm"):
        print("❌ Error: NPM not found. Please install Node.js.")
        return
    
    os.chdir("editor-master")
    run_command("npm install")
    os.chdir("..")
    print("✅ Node.js dependencies installed.")

if __name__ == "__main__":
    print(f"🚀 Starting Smart Setup for {platform.system()}...")
    install_ffmpeg()
    setup_python()
    setup_node()
    print("
🎉 Setup complete! The agent is ready to edit videos.")
