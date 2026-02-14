"""
install_docker_windows.py

Windows helper to install Docker Desktop (minimal steps required to run `docker compose`).
- Requires admin elevation (the script re-launches itself with elevation if needed)
- Uses `winget` if available to install Docker Desktop
- Installs/ensures WSL2 is enabled (unless --no-wsl)
- Optional: creates a `docker-compose` shim that forwards to `docker compose`

Usage (run from an elevated PowerShell / or let the script elevate):
  python install_docker_windows.py        # interactive, will install WSL + Docker Desktop
  python install_docker_windows.py --yes  # auto-accept prompts
  python install_docker_windows.py --shim # create legacy "docker-compose" shim

Note: Docker Desktop may require sign-in/restart after install. If the installer
requests a restart or additional action, follow the on-screen prompts.

This script is intended for development machines only.
"""

import argparse
import ctypes
import os
import shutil
import subprocess
import sys
import time


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False


def relaunch_as_admin():
    """Relaunch the current script as admin and exit the original process."""
    params = ' '.join([f'"{p}"' for p in sys.argv[1:]])
    python_exe = sys.executable
    # ShellExecuteW returns >32 on success; it will show UAC prompt
    ctypes.windll.shell32.ShellExecuteW(None, "runas", python_exe, params, None, 1)
    sys.exit(0)


def run(cmd, check=True, capture_output=False, timeout=None):
    print("$ ", " ".join(cmd))
    return subprocess.run(cmd, check=check, capture_output=capture_output, text=True, timeout=timeout)


def has_cmd(name):
    return shutil.which(name) is not None


def ensure_wsl(default_yes=False):
    """Install/enable WSL2 if missing. Returns True if already present or successfully enabled."""
    if has_cmd('wsl'):
        # quick check for default version (best-effort)
        try:
            out = subprocess.run(['wsl', '--status'], capture_output=True, text=True)
            if 'Default Version: 2' in out.stdout or 'default version: 2' in out.stdout.lower():
                print('WSL appears to be installed and default version is 2.')
                return True
        except Exception:
            pass
    print('WSL2 is not fully configured or not installed.')
    if not default_yes:
        ans = input('Install WSL (required for Docker Desktop on Windows) now? [Y/n] ') or 'y'
        if ans.lower().startswith('n'):
            print('Skipping WSL install — Docker Desktop with WSL backend may not work.')
            return False
    print('Installing WSL (this may download a Linux distro and require restart).')
    run(['wsl', '--install'])
    print('Setting WSL default version to 2...')
    run(['wsl', '--set-default-version', '2'])
    print('WSL installation started. You may need to log out / restart to complete installation.')
    return True


def install_docker_with_winget(auto_yes=False):
    if not has_cmd('winget'):
        raise RuntimeError('winget not found on this system')

    # If docker already installed, skip
    if has_cmd('docker'):
        print('Docker CLI already found in PATH — skipping installation.')
        return True

    print('Installing Docker Desktop via winget (requires internet).')
    cmd = [
        'winget', 'install', '--id', 'Docker.DockerDesktop', '-e',
        '--accept-package-agreements', '--accept-source-agreements'
    ]
    run(cmd, check=True)
    return True


def start_docker_and_wait(timeout=180):
    """Attempt to start Docker Desktop and wait until `docker version` responds."""
    # try to start Docker Desktop app if present
    candidates = [
        r"C:\Program Files\Docker\Docker\Docker Desktop.exe",
        r"C:\Program Files\Docker\Docker\Docker Desktop.exe",
    ]
    started = False
    for p in candidates:
        if os.path.exists(p):
            try:
                subprocess.Popen([p])
                started = True
                break
            except Exception:
                started = False
    if not started:
        print('Could not auto-launch Docker Desktop; it may start automatically after install.')

    print('Waiting for Docker daemon to respond (timeout {}s)...'.format(timeout))
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            proc = subprocess.run(['docker', 'version'], capture_output=True, text=True)
            if proc.returncode == 0:
                print('Docker daemon is available.')
                return True
        except FileNotFoundError:
            # docker CLI not yet on PATH
            pass
        time.sleep(3)
    print('Timed out waiting for Docker. Please open Docker Desktop manually and wait for it to finish starting.')
    return False


def create_docker_compose_shim():
    """Create a small `docker-compose.cmd` shim that forwards to `docker compose`.
    This provides compatibility for scripts that call `docker-compose` (hyphen).
    """
    shim_path = r"C:\Windows\System32\docker-compose.cmd"
    if os.path.exists(shim_path):
        print('docker-compose shim already exists at', shim_path)
        return shim_path
    content = '@echo off\r\nrem shim: redirect docker-compose to `docker compose`\r\n"%ProgramFiles%\\Docker\\Docker\\resources\\bin\\docker.exe" compose %*\r\n'
    try:
        with open(shim_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Created shim at', shim_path)
        return shim_path
    except PermissionError:
        print('Permission denied creating shim at', shim_path)
        return None


def final_checks():
    print('\n--- Post-install checks')
    try:
        run(['docker', '--version'], check=False)
    except Exception:
        print('docker CLI not available in PATH yet.')
    try:
        run(['docker', 'compose', 'version'], check=False)
    except Exception:
        print('docker compose plugin not available yet.')
    print('\nIf `docker` is not available, open Docker Desktop and wait until it finishes initializing.')


def main():
    parser = argparse.ArgumentParser(description='Windows helper to install Docker Desktop + WSL2 (minimal for docker compose)')
    parser.add_argument('--yes', action='store_true', help='auto-accept prompts')
    parser.add_argument('--no-wsl', action='store_true', help="don't install WSL (skip that step)")
    parser.add_argument('--shim', action='store_true', help="create legacy 'docker-compose' shim that forwards to 'docker compose'")
    parser.add_argument('--timeout', type=int, default=180, help='seconds to wait for Docker daemon startup')

    args = parser.parse_args()

    if sys.platform != 'win32':
        print('This installer is for Windows only.')
        sys.exit(1)

    if not is_admin():
        print('Elevation required — asking for admin rights...')
        relaunch_as_admin()

    # WSL check/install
    if not args.no_wsl:
        try:
            ensure_wsl(default_yes=args.yes)
        except subprocess.CalledProcessError as e:
            print('Failed to install/enable WSL:', e)
            print('Please install WSL manually: run "wsl --install" in an elevated PowerShell and reboot if required.')
            # continue — Docker installer may still run but will likely not use WSL backend

    # Install Docker Desktop
    if not has_cmd('docker'):
        if has_cmd('winget'):
            try:
                install_docker_with_winget(auto_yes=args.yes)
            except Exception as e:
                print('winget-based installation failed:', e)
                print('Please install Docker Desktop manually from https://www.docker.com/get-started')
                sys.exit(1)
        else:
            print('winget not found — please install Docker Desktop manually from https://www.docker.com/get-started')
            sys.exit(1)
    else:
        print('Docker already installed — skipping installation.')

    # Start Docker Desktop and wait for daemon
    start_docker_and_wait(timeout=args.timeout)

    # create shim if requested
    if args.shim:
        create_docker_compose_shim()

    final_checks()
    print('\nDone — you can now use `docker compose up` (or `docker-compose` if shim was created).')


if __name__ == '__main__':
    main()
