# 🚀 Reverse Proxy Manager

[![npm version](https://badge.fury.io/js/reverse-proxy-manager.svg)](https://badge.fury.io/js/reverse-proxy-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A powerful, type-safe CLI tool for managing nginx reverse proxy entries and hosts file modifications. Perfect for developers who need to quickly set up staging environments and local development proxies.

## ✨ Features

- 🎯 **One-line commands** - Add/remove reverse proxy entries instantly
- 🔧 **Interactive setup** - Guided configuration for nginx and hosts files
- 💾 **Automatic backups** - Creates timestamped backups before any changes
- ✅ **Nginx validation** - Tests configuration before applying changes
- 🎨 **Beautiful CLI** - Colored output and intuitive interface
- 🔒 **Type-safe** - Built with TypeScript for reliability
- 🛡️ **Safe operations** - Prevents duplicates and validates inputs
- 📦 **Zero dependencies** - Lightweight and fast

## 🚀 Quick Start

### Installation

```bash
# Global installation (recommended)
npm install -g reverse-proxy-manager

# Or use npx (no installation required)
npx reverse-proxy-manager setup
```

### First Time Setup

```bash
# Configure the tool
reverse-proxy-manager setup
```

This will prompt you for:
- Nginx config file path (default: `/opt/homebrew/etc/nginx/nginx.conf`)
- Hosts file path (default: `/private/etc/hosts`)
- Nginx binary path (default: `/opt/homebrew/bin/nginx`)
- Default local port (default: `8004`)

### Usage

```bash
# Add a reverse proxy entry
reverse-proxy-manager add example.staging.com

# Add with custom port
reverse-proxy-manager add example.staging.com --port 3000

# Remove an entry
reverse-proxy-manager remove example.staging.com

# List all entries
reverse-proxy-manager list

# Check status
reverse-proxy-manager status
```

## 📋 Commands

| Command | Description | Options |
|---------|-------------|---------|
| `setup` | Configure the reverse proxy manager | - |
| `add <url>` | Add a reverse proxy entry | `-p, --port <port>` |
| `remove <url>` | Remove a reverse proxy entry | - |
| `list` | List all current entries | - |
| `status` | Check configuration status | - |

## 🔧 What It Does

### When Adding a URL:
1. ✅ Validates the URL format and port
2. ✅ Checks for existing entries to prevent duplicates
3. ✅ Creates timestamped backups of nginx.conf and hosts file
4. ✅ Adds nginx server block with SSL configuration
5. ✅ Adds hosts entry (127.0.0.1 <url>)
6. ✅ Tests nginx configuration syntax
7. ✅ Reloads nginx if test passes

### When Removing a URL:
1. ✅ Creates backups before making changes
2. ✅ Removes the entire nginx server block for the URL
3. ✅ Removes the hosts entry
4. ✅ Tests and reloads nginx

## 📁 Files and Directories

- **Configuration**: `~/.reverse-proxy-manager-config`
- **Backups**: `~/.proxy-backups/` with timestamps
- **NPM Package**: `reverse-proxy-manager`

## 🛠️ Development

### Prerequisites

- Node.js 16+ 
- TypeScript 4.5+
- npm or yarn

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/harshulkansal/reverse-proxy-manager.git
cd reverse-proxy-manager

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Available Scripts

```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode compilation
npm test           # Run tests
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run clean      # Clean build directory
```

## �� Safety Features

- ✅ **Automatic backups** - Every operation creates a backup
- ✅ **Configuration validation** - Tests nginx config before applying
- ✅ **Duplicate prevention** - Won't add existing entries
- ✅ **Input validation** - Validates URLs and ports
- ✅ **Error handling** - Comprehensive error checking and recovery
- ✅ **Rollback capability** - Restores from backup if nginx test fails

## 🎯 Use Cases

- **Staging environments** - Quickly proxy staging URLs to local development
- **Microservices** - Proxy different services to different ports
- **API development** - Test API endpoints with custom domains
- **Frontend development** - Proxy frontend apps with custom domains
- **Local testing** - Test SSL certificates and domain-specific features

## 🛠️ Troubleshooting

### Permission Issues

If you get permission errors, ensure you have write access to the nginx config file:

```bash
sudo chown $(whoami) /opt/homebrew/etc/nginx/nginx.conf
```

### Nginx Test Fails

If nginx configuration test fails, check your nginx.conf syntax. The tool will not reload nginx if the test fails.

### Restore from Backup

If something goes wrong, restore from backup:

```bash
cp ~/.proxy-backups/nginx_YYYYMMDD_HHMMSS.conf /opt/homebrew/etc/nginx/nginx.conf
sudo cp ~/.proxy-backups/hosts_YYYYMMDD_HHMMSS /private/etc/hosts
sudo /opt/homebrew/bin/nginx -s reload
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js) for CLI interface
- Uses [Chalk](https://github.com/chalk/chalk) for beautiful terminal output
- Powered by [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for interactive prompts

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the [troubleshooting section](#🛠️-troubleshooting)
2. Search existing [issues](https://github.com/is-harshul/reverse-proxy-manager/issues)
3. Create a new issue with detailed information

---

Made with ❤️ by [Harshul Kansal](https://github.com/is-harshul)
