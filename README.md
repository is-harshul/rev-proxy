# 🚀 Reverse Proxy Management Script

This script automates the process of adding and removing reverse proxy entries for staging URLs in your nginx configuration and hosts file.

## 📁 Files Created

- `add-proxy.sh` - Main script with full functionality ✅ **WORKING**
- `README.md` - This documentation

## ⚡ Quick Start

### First Time Setup
Before using the script, you need to configure the paths to your nginx and hosts files:

```bash
./add-proxy.sh setup
```

This will prompt you for:
- Nginx config file path (default: `/opt/homebrew/etc/nginx/nginx.conf`)
- Hosts file path (default: `/private/etc/hosts`)
- Nginx binary path (default: `/opt/homebrew/bin/nginx`)
- Default local port (default: `8004`)

The configuration is saved to `~/.proxy-script-config` and will be used for all future operations.

### Using the Alias (Recommended)
The alias `add-proxy.sh` is already added to your `.zshrc`:

```bash
# Setup (first time only)
add-proxy.sh setup

# Add a staging URL
add-proxy.sh add harshulkansal.staging.com

# Add with custom port
add-proxy.sh add hk-staging.com 8005

# Remove a URL
add-proxy.sh remove harshulkansal.staging.com

# List all entries
add-proxy.sh list
```

### Direct Usage
```bash
# Setup (first time only)
./add-proxy.sh setup

# Add/remove/list
./add-proxy.sh add harshulkansal.staging.com
./add-proxy.sh remove harshulkansal.staging.com
./add-proxy.sh list
```

## ✨ Features

- ✅ **One-line commands** - Exactly what you requested!
- ✅ **Interactive setup** - Prompts for nginx and hosts file paths
- ✅ **Configuration persistence** - Saves settings for future use
- ✅ **Automatic backups** - Creates timestamped backups before changes
- ✅ **URL validation** - Prevents invalid URLs
- ✅ **Duplicate prevention** - Won't add existing entries
- ✅ **Nginx auto-reload** - Tests config and reloads nginx
- ✅ **Colored output** - Easy to read status messages
- ✅ **Error handling** - Comprehensive error checking
- ✅ **Safe operations** - Tests nginx configuration before reloading

## 🔧 What the Script Does

### Setup Command:
1. ✅ Prompts for nginx config file path
2. ✅ Prompts for hosts file path
3. ✅ Prompts for nginx binary path
4. ✅ Prompts for default port
5. ✅ Validates file existence
6. ✅ Saves configuration to `~/.proxy-script-config`

### When Adding a URL:
1. ✅ Loads saved configuration
2. ✅ Validates the URL format
3. ✅ Creates backups of both nginx.conf and hosts file
4. ✅ Adds nginx server block with SSL configuration
5. ✅ Adds hosts entry (127.0.0.1 <url>)
6. ✅ Tests nginx configuration
7. ✅ Reloads nginx if test passes

### When Removing a URL:
1. ✅ Loads saved configuration
2. ✅ Creates backups of both files
3. ✅ Removes the entire nginx server block for the URL
4. ✅ Removes the hosts entry
5. ✅ Tests and reloads nginx

### When Listing:
1. ✅ Loads saved configuration
2. ✅ Shows all current nginx proxy entries
3. ✅ Shows all current hosts entries

## 📂 Files and Directories

- **Configuration**: `~/.proxy-script-config`
- **Backups**: `~/.proxy-backups/` with timestamps
- **Script**: `~/addProxyScript/add-proxy.sh`

## ⚙️ Configuration

The script saves your configuration to `~/.proxy-script-config`:
```bash
NGINX_CONF="/opt/homebrew/etc/nginx/nginx.conf"
HOSTS_FILE="/private/etc/hosts"
LOCAL_PORT="8004"
BACKUP_DIR="/Users/harshulkansal/.proxy-backups"
NGINX_BIN="/opt/homebrew/bin/nginx"
```

## 🎯 Examples

```bash
# First time setup
add-proxy.sh setup

# Add a staging URL (defaults to port 8004)
add-proxy.sh add harshulkansal.staging.com

# Add with custom port
add-proxy.sh add hk.staging.com 8005

# Remove a URL
add-proxy.sh remove harshulkansal.staging.com

# List all entries
add-proxy.sh list
```

## 🛠️ Troubleshooting

### Configuration Issues
If you need to reconfigure the paths:
```bash
add-proxy.sh setup
```

### Permission Issues
If you get permission errors, make sure you have write access to the nginx config file:
```bash
sudo chown $(whoami) /opt/homebrew/etc/nginx/nginx.conf
```

### Nginx Test Fails
If nginx configuration test fails, check the syntax in your nginx.conf file. The script will not reload nginx if the test fails.

### Restore from Backup
If something goes wrong, you can restore from backup:
```bash
cp ~/.proxy-backups/nginx_YYYYMMDD_HHMMSS.conf /opt/homebrew/etc/nginx/nginx.conf
sudo cp ~/.proxy-backups/hosts_YYYYMMDD_HHMMSS /private/etc/hosts
sudo /opt/homebrew/bin/nginx -s reload
```

## 🔒 Safety Notes

- ✅ The script always creates backups before making changes
- ✅ Nginx configuration is tested before reloading
- ✅ The script checks for existing entries to prevent duplicates
- ✅ All operations are logged with colored output for easy tracking
- ✅ Configuration is validated during setup
- ✅ Uses proper nginx binary path for macOS Homebrew installations

## 🎉 Success!

The script is now **100% working** with interactive setup! You can start using it immediately:

```bash
# First time setup
add-proxy.sh setup

# Then use normally
add-proxy.sh add your-staging-url.com
```

Enjoy your automated reverse proxy management! 🚀
