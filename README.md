# 🚀 Reverse Proxy Management Script

This script automates the process of adding and removing reverse proxy entries for staging URLs in your nginx configuration and hosts file.

## 📁 Files Created

- `add-proxy.sh` - Main script with full functionality ✅ **WORKING**
- `add-proxy-alias.sh` - Simple alias wrapper
- `PROXY_SCRIPT_README.md` - This documentation

## ⚡ Quick Start

### Using the Alias (Recommended)
The alias `proxyBp` is already added to your `.zshrc`:

```bash
# Add a staging URL
add-proxy.sh add harshulkansal.staging.com

# Add with custom port
add-proxy.sh add harshulkansal.staging.com 8005

# Remove a URL
add-proxy.sh remove harshulkansal.staging.com

# List all entries
add-proxy.sh list
```

### Direct Usage
```bash
./add-proxy.sh add harshulkansal.staging.com
./add-proxy.sh remove harshulkansal.staging.com
./add-proxy.sh list
```

## ✨ Features

- ✅ **One-line commands** - Exactly what you requested!
- ✅ **Automatic backups** - Creates timestamped backups before changes
- ✅ **URL validation** - Prevents invalid URLs
- ✅ **Duplicate prevention** - Won't add existing entries
- ✅ **Nginx auto-reload** - Tests config and reloads nginx
- ✅ **Colored output** - Easy to read status messages
- ✅ **Error handling** - Comprehensive error checking
- ✅ **Safe operations** - Tests nginx configuration before reloading

## 🔧 What the Script Does

### When Adding a URL:
1. ✅ Validates the URL format
2. ✅ Creates backups of both nginx.conf and hosts file
3. ✅ Adds nginx server block with SSL configuration
4. ✅ Adds hosts entry (127.0.0.1 <url>)
5. ✅ Tests nginx configuration
6. ✅ Reloads nginx if test passes

### When Removing a URL:
1. ✅ Creates backups of both files
2. ✅ Removes the entire nginx server block for the URL
3. ✅ Removes the hosts entry
4. ✅ Tests and reloads nginx

### When Listing:
1. ✅ Shows all current nginx proxy entries
2. ✅ Shows all current hosts entries

## 📂 Backup Files

Backups are stored in `~/.proxy-backups/` with timestamps:
- `nginx_YYYYMMDD_HHMMSS.conf`
- `hosts_YYYYMMDD_HHMMSS`

## ⚙️ Configuration

- **Nginx Config**: `/opt/homebrew/etc/nginx/nginx.conf`
- **Hosts File**: `/private/etc/hosts`
- **Default Port**: `8004`
- **Nginx Binary**: `/opt/homebrew/bin/nginx`
- **Backup Directory**: `~/.proxy-backups`

## 🎯 Examples

```bash
# Add a staging URL (defaults to port 8004)
add-proxy.sh add harshulkansal.staging.com

# Add with custom port
add-proxy.sh add harshulkansal.staging.com 8005

# Remove a URL
add-proxy.sh remove harshulkansal.staging.com

# List all entries
add-proxy.sh list
```

## 🛠️ Troubleshooting

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
- ✅ Uses proper nginx binary path for macOS Homebrew installations

## 🎉 Success!

The script is now **100% working** and ready to use! You can start using it immediately with:

```bash
add-proxy.sh add your-staging-url.com
```

Enjoy your automated reverse proxy management! 🚀
