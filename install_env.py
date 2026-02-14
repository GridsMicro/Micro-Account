#!/usr/bin/env python3
"""Environment checker/installer for Docker and Node (Windows and Ubuntu).

Features:
 - check presence of Docker and Node
 - install on Ubuntu (official repos / NodeSource) and Windows (winget)
 - check latest versions (Node LTS via nodejs.org, Docker via moby/moby GitHub)
 - optional non-interactive install/upgrade with `--yes` and `--upgrade`

Usage:
  python install_env.py                # interactive checks
  python install_env.py --yes          # allow installs automatically
  python install_env.py --check-updates   # check for newer versions
  python install_env.py --upgrade --yes   # attempt upgrades non-interactively

Notes:
 - On Windows this script prefers `winget` to install Docker Desktop and Node LTS.
 - On Ubuntu it installs Docker using the official repo and Node via NodeSource (Node 20 LTS).
 - Some operations require admin/sudo. The script will prompt or fail with guidance.
"""
from __future__ import annotations
import os
import sys
import shutil
import subprocess
import platform
import argparse
import re
import json
import urllib.request
from typing import Optional, Tuple


def run(cmd, check=False, capture=False, shell=False):
    if isinstance(cmd, (list, tuple)):
        display = ' '.join(cmd)
    else:
        display = cmd
    print('> ', display)
    return subprocess.run(cmd, check=check, stdout=subprocess.PIPE if capture else None, stderr=subprocess.STDOUT if capture else None, text=True, shell=shell)


def which(prog: str) -> bool:
    return shutil.which(prog) is not None


def parse_version(v: str) -> Tuple[int, ...]:
    parts = re.findall(r"(\d+)", v)
    return tuple(int(p) for p in parts)


def http_get_json(url: str, timeout=5) -> Optional[dict]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return json.load(r)
    except Exception:
        return None


def is_windows_admin() -> bool:
    if platform.system() != 'Windows':
        return False
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False


def ubuntu_install_docker(yes: bool):
    if which('docker'):
        print('Docker already installed:', shutil.which('docker'))
        return True
    print('\nWill install Docker Engine (Ubuntu).')
    if not yes:
        ok = input('Proceed to install Docker on Ubuntu? [y/N] ').lower() == 'y'
        if not ok:
            print('Skipping Docker install.')
            return False
    cmds = [
        ['sudo','apt-get','update'],
        ['sudo','apt-get','install','-y','ca-certificates','curl','gnupg','lsb-release'],
        ['sudo','mkdir','-p','/etc/apt/keyrings'],
        # use shell for pipe/redirect operations
        'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmour -o /etc/apt/keyrings/docker.gpg',
        'sudo bash -c "mkdir -p /etc/apt/sources.list.d && printf \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\\n\" > /etc/apt/sources.list.d/docker.list"',
        ['sudo','apt-get','update'],
        ['sudo','apt-get','install','-y','docker-ce','docker-ce-cli','containerd.io','docker-compose-plugin'],
    ]
    for c in cmds:
        if isinstance(c, str):
            run(c, check=True, shell=True)
        else:
            run(c, check=True)
    print('Docker install steps completed. You may need to logout/login for group changes.')
    return which('docker')


def ubuntu_install_node(yes: bool):
    if which('node'):
        print('Node already installed:', shutil.which('node'))
        return True
    print('\nWill install Node.js (LTS) via NodeSource.')
    if not yes:
        ok = input('Proceed to install Node.js LTS on Ubuntu? [y/N] ').lower() == 'y'
        if not ok:
            print('Skipping Node install.')
            return False
    run(['curl','-fsSL','https://deb.nodesource.com/setup_20.x','-o','/tmp/nodesource_setup.sh'], check=True)
    run(['sudo','bash','/tmp/nodesource_setup.sh'], check=True)
    run(['sudo','apt-get','install','-y','nodejs'], check=True)
    return which('node')


def windows_install_with_winget(pkg_id: str, yes: bool):
    if not which('winget'):
        print('winget not found. Please install App Installer / winget from Microsoft Store.')
        return False
    cmd = ['winget','install','--silent','--accept-package-agreements','--accept-source-agreements','-e',pkg_id]
    if not yes:
        ok = input(f'Run winget to install {pkg_id}? [y/N] ').lower() == 'y'
        if not ok:
            print('Skipping installation for', pkg_id)
            return False
    run(cmd, check=True)
    return True


def windows_install_docker(yes: bool):
    if which('docker'):
        print('Docker already available in PATH:', shutil.which('docker'))
        return True
    if not is_windows_admin():
        print('Docker Desktop install requires admin. Please run this script from an elevated prompt.')
        return False
    print('\nInstalling Docker Desktop via winget (if available).')
    return windows_install_with_winget('Docker.DockerDesktop', yes)


def windows_install_node(yes: bool):
    if which('node'):
        print('Node already available in PATH:', shutil.which('node'))
        return True
    print('\nInstalling Node.js LTS via winget (if available).')
    return windows_install_with_winget('OpenJS.NodeJS.LTS', yes)


def get_installed_node_version() -> Optional[str]:
    try:
        p = run(['node','-v'], check=False, capture=True)
        out = p.stdout.strip() if p.stdout else ''
        return out.lstrip('v') if out else None
    except Exception:
        return None


def get_latest_node_lts() -> Optional[str]:
    data = http_get_json('https://nodejs.org/dist/index.json')
    if not data:
        return None
    lts_versions = [d for d in data if d.get('lts')]
    if not lts_versions:
        return None
    latest = max(lts_versions, key=lambda d: parse_version(d.get('version','')))
    return latest.get('version','').lstrip('v')


def get_installed_docker_version() -> Optional[str]:
    try:
        p = run(['docker','--version'], check=False, capture=True)
        out = p.stdout.strip() if p.stdout else ''
        m = re.search(r"(\d+\.\d+\.\d+)", out)
        return m.group(1) if m else None
    except Exception:
        return None


def get_latest_moby_version() -> Optional[str]:
    data = http_get_json('https://api.github.com/repos/moby/moby/releases/latest')
    if not data:
        return None
    tag = data.get('tag_name') or data.get('name')
    if not tag:
        return None
    m = re.search(r"(\d+\.\d+\.\d+)", tag)
    return m.group(1) if m else tag


def check_updates(yes: bool):
    print('\nChecking for updates...')
    node_inst = get_installed_node_version()
    node_latest = get_latest_node_lts()
    if node_inst:
        print('Node installed:', node_inst)
        if node_latest:
            print('Latest Node LTS:', node_latest)
            if parse_version(node_latest) > parse_version(node_inst):
                print('Node update available')
                if yes:
                    print('Attempting to upgrade Node...')
                    if platform.system() == 'Linux':
                        ubuntu_install_node(True)
                    elif platform.system() == 'Windows':
                        windows_install_node(True)
            else:
                print('Node is up-to-date')
        else:
            print('Could not determine latest Node LTS')
    else:
        print('Node not installed')

    docker_inst = get_installed_docker_version()
    docker_latest = get_latest_moby_version()
    if docker_inst:
        print('Docker installed:', docker_inst)
        if docker_latest:
            print('Latest moby/moby release:', docker_latest)
            if parse_version(docker_latest) > parse_version(docker_inst):
                print('Docker update available')
                if yes:
                    print('Attempting to upgrade Docker...')
                    if platform.system() == 'Linux':
                        ubuntu_install_docker(True)
                    elif platform.system() == 'Windows':
                        windows_install_docker(True)
            else:
                print('Docker is up-to-date')
        else:
            print('Could not determine latest Docker release')
    else:
        print('Docker not installed')


def check_and_install(yes: bool):
    osys = platform.system()
    print('Detected OS:', osys)
    results = {}
    if osys == 'Linux':
        try:
            with open('/etc/os-release') as f:
                data = f.read()
            if 'ubuntu' not in data.lower():
                print('This script currently supports Ubuntu (detected different Linux). Exiting.')
                return 1
        except FileNotFoundError:
            print('Cannot detect Linux distribution. Exiting.')
            return 1
        print('\nChecking Docker...')
        results['docker'] = which('docker') or ubuntu_install_docker(yes)
        print('\nChecking Node...')
        results['node'] = which('node') or ubuntu_install_node(yes)
    elif osys == 'Windows':
        print('\nChecking Docker...')
        results['docker'] = which('docker') or windows_install_docker(yes)
        print('\nChecking Node...')
        results['node'] = which('node') or windows_install_node(yes)
    else:
        print('Unsupported OS:', osys)
        return 1

    print('\nSummary:')
    for k,v in results.items():
        print(f' - {k}:', 'OK' if v else 'MISSING')

    if not results.get('docker'):
        print('\nDocker not installed or not found in PATH. See README for manual steps.')
    if not results.get('node'):
        print('\nNode not installed or not found in PATH. See README for manual steps.')

    return 0 if all(results.values()) else 2


def main():
    p = argparse.ArgumentParser(description='Check/install Docker and Node (Windows and Ubuntu)')
    p.add_argument('--yes', '-y', action='store_true', help='Run non-interactive and accept installs')
    p.add_argument('--check-updates', action='store_true', help='Check for newer versions online')
    p.add_argument('--upgrade', action='store_true', help='Attempt to upgrade if newer versions available')
    args = p.parse_args()
    try:
        if args.check_updates:
            check_updates(args.yes or args.upgrade)
            # still run installation checks if requested
        rc = check_and_install(args.yes)
        if args.upgrade:
            check_updates(True)
        sys.exit(rc)
    except subprocess.CalledProcessError as e:
        print('Command failed:', e)
        sys.exit(3)


if __name__ == '__main__':
    main()
