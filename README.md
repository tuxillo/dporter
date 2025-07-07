# dporter

A web-based coordination system for managing DragonFly BSD port development, preventing duplicate work, and tracking progress.

## Features

- **Port Locking**: Developers can lock ports to prevent duplicate work
- **Real-time Status**: View which ports are being worked on and by whom
- **Simple Interface**: Clean, responsive web UI
- **API Integration**: RESTful API ready for GitHub integration
- **Progress Tracking**: Monitor PRs and builds (planned)

## Quick Start

### Prerequisites

- Go 1.21 or later
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DragonFlyBSD/DeltaPorts.git
cd DeltaPorts/dporter
```

### Branding Assets

The frontend expects `frontend/static/img/logo.png` and `frontend/static/img/favicon.ico`. You can download the official images from the DragonFly BSD website:

1. Visit <https://www.dragonflybsd.org/> and save the site logo as `logo.png`.
2. Download <https://www.dragonflybsd.org/favicon.ico> and save it as `favicon.ico`.

Place these files in `frontend/static/img/` after cloning the repository.

