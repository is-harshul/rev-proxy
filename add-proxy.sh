#!/bin/bash

# Script to add/remove reverse proxy entries for staging URLs
# Usage: ./add-proxy.sh <action> <url> [port]
# Actions: add, remove, list
# Example: ./add-proxy.sh add zerodha-staging.smallcase.com
# Example: ./add-proxy.sh remove zerodha-staging.smallcase.com
# Example: ./add-proxy.sh list

set -e

# Configuration
NGINX_CONF="/opt/homebrew/etc/nginx/nginx.conf"
HOSTS_FILE="/private/etc/hosts"
LOCAL_PORT="8004"
BACKUP_DIR="$HOME/.proxy-backups"
NGINX_BIN="/opt/homebrew/bin/nginx"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to validate URL
validate_url() {
    local url="$1"
    if [[ ! "$url" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        print_error "Invalid URL format: $url"
        print_info "Expected format: domain.com or subdomain.domain.com"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    cp "$NGINX_CONF" "$BACKUP_DIR/nginx_${timestamp}.conf"
    sudo cp "$HOSTS_FILE" "$BACKUP_DIR/hosts_${timestamp}"
    print_status "Backup created: nginx_${timestamp}.conf, hosts_${timestamp}"
}

# Function to check if entry exists in nginx
nginx_entry_exists() {
    local url="$1"
    grep -q "server_name.*$url" "$NGINX_CONF" 2>/dev/null
}

# Function to check if entry exists in hosts
hosts_entry_exists() {
    local url="$1"
    grep -q "127.0.0.1.*$url" "$HOSTS_FILE" 2>/dev/null
}

# Function to add nginx entry
add_nginx_entry() {
    local url="$1"
    local port="${2:-$LOCAL_PORT}"
    
    if nginx_entry_exists "$url"; then
        print_warning "Nginx entry for $url already exists"
        return 0
    fi
    
    # Create a temporary file with the new server block
    local temp_file=$(mktemp)
    
    # Create the nginx server block - using printf to avoid newline issues
    printf "\n    server {\n        listen 443 ssl;\n        server_name %s;\n        access_log /opt/homebrew/var/log/nginx/platform.access.log  main;\n            include snippets/smallcase.conf;\n\n        location / {\n            proxy_pass         http://127.0.0.1:%s;\n        }\n    }\n" "$url" "$port" > "$temp_file"
    
    # Create a new nginx config with the server block inserted
    local new_config=$(mktemp)
    
    # Find the last closing brace of the http block (not events block)
    awk '
    BEGIN { 
        inserted = 0
        new_block = ""
        while ((getline line < "'"$temp_file"'") > 0) {
            new_block = new_block line "\n"
        }
        close("'"$temp_file"'")
        in_http = 0
        brace_count = 0
    }
    /^http {/ { in_http = 1 }
    in_http && /{/ { brace_count++ }
    in_http && /}/ { 
        brace_count--
        if (brace_count == 0 && !inserted) {
            printf "%s", new_block
            inserted = 1
        }
    }
    { print }
    ' "$NGINX_CONF" > "$new_config"
    
    mv "$new_config" "$NGINX_CONF"
    rm "$temp_file"
    print_status "Added nginx entry for $url -> http://127.0.0.1:$port"
}

# Function to add hosts entry
add_hosts_entry() {
    local url="$1"
    
    if hosts_entry_exists "$url"; then
        print_warning "Hosts entry for $url already exists"
        return 0
    fi
    
    # Add entry after the localhost line using a more reliable method
    local temp_file=$(mktemp)
    awk -v url="$url" '
    /^127.0.0.1 localhost$/ {
        print $0
        print "127.0.0.1 " url
        next
    }
    { print }
    ' "$HOSTS_FILE" > "$temp_file"
    
    sudo cp "$temp_file" "$HOSTS_FILE"
    rm "$temp_file"
    print_status "Added hosts entry: 127.0.0.1 $url"
}

# Function to remove nginx entry
remove_nginx_entry() {
    local url="$1"
    
    if ! nginx_entry_exists "$url"; then
        print_warning "Nginx entry for $url not found"
        return 0
    fi
    
    # Find the line number where the server block starts
    local start_line=$(grep -n "server_name.*$url" "$NGINX_CONF" | cut -d: -f1)
    
    if [[ -z "$start_line" ]]; then
        print_warning "Could not find server block for $url"
        return 0
    fi
    
    # Find the start of the server block (go backwards to find "server {")
    local server_start=0
    for ((i=start_line; i>=1; i--)); do
        if sed -n "${i}p" "$NGINX_CONF" | grep -q "server {"; then
            server_start=$i
            break
        fi
    done
    
    if [[ $server_start -eq 0 ]]; then
        print_warning "Could not find start of server block for $url"
        return 0
    fi
    
    # Find the end of the server block (go forwards to find matching "}")
    local brace_count=0
    local server_end=0
    for ((i=server_start; i<=$(wc -l < "$NGINX_CONF"); i++)); do
        local line=$(sed -n "${i}p" "$NGINX_CONF")
        if echo "$line" | grep -q "{"; then
            ((brace_count++))
        fi
        if echo "$line" | grep -q "}"; then
            ((brace_count--))
            if [[ $brace_count -eq 0 ]]; then
                server_end=$i
                break
            fi
        fi
    done
    
    if [[ $server_end -eq 0 ]]; then
        print_warning "Could not find end of server block for $url"
        return 0
    fi
    
    # Remove the server block using sed
    local temp_file=$(mktemp)
    sed "${server_start},${server_end}d" "$NGINX_CONF" > "$temp_file"
    mv "$temp_file" "$NGINX_CONF"
    
    print_status "Removed nginx entry for $url (lines $server_start-$server_end)"
}

# Function to remove hosts entry
remove_hosts_entry() {
    local url="$1"
    
    if ! hosts_entry_exists "$url"; then
        print_warning "Hosts entry for $url not found"
        return 0
    fi
    
    local temp_file=$(mktemp)
    grep -v "127.0.0.1.*$url" "$HOSTS_FILE" > "$temp_file"
    sudo cp "$temp_file" "$HOSTS_FILE"
    rm "$temp_file"
    print_status "Removed hosts entry for $url"
}

# Function to list current entries
list_entries() {
    print_info "Current nginx proxy entries:"
    grep -A 5 "server_name.*smallcase\|sbisecurities\|sbicapsec" "$NGINX_CONF" | grep -E "server_name|proxy_pass" || echo "No entries found"
    
    print_info "\nCurrent hosts entries:"
    grep "127.0.0.1.*smallcase\|127.0.0.1.*sbisecurities\|127.0.0.1.*sbicapsec" "$HOSTS_FILE" || echo "No entries found"
}

# Function to reload nginx
reload_nginx() {
    print_info "Reloading nginx..."
    if sudo "$NGINX_BIN" -t; then
        sudo "$NGINX_BIN" -s reload
        print_status "Nginx reloaded successfully"
    else
        print_error "Nginx configuration test failed. Please check the configuration."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <action> <url> [port]"
    echo ""
    echo "Actions:"
    echo "  add <url> [port]    - Add reverse proxy entry (default port: $LOCAL_PORT)"
    echo "  remove <url>        - Remove reverse proxy entry"
    echo "  list                - List current entries"
    echo ""
    echo "Examples:"
    echo "  $0 add zerodha-staging.smallcase.com"
    echo "  $0 add axisdirect-staging.smallcase.com 8005"
    echo "  $0 remove zerodha-staging.smallcase.com"
    echo "  $0 list"
}

# Main script logic
main() {
    local action="$1"
    local url="$2"
    local port="$3"
    
    case "$action" in
        "add")
            if [[ -z "$url" ]]; then
                print_error "URL is required for add action"
                show_usage
                exit 1
            fi
            
            validate_url "$url"
            print_info "Adding reverse proxy for $url..."
            
            create_backup
            
            add_nginx_entry "$url" "$port"
            add_hosts_entry "$url"
            
            reload_nginx
            
            print_status "Successfully added reverse proxy for $url"
            print_info "You can now access: https://$url"
            ;;
            
        "remove")
            if [[ -z "$url" ]]; then
                print_error "URL is required for remove action"
                show_usage
                exit 1
            fi
            
            print_info "Removing reverse proxy for $url..."
            
            create_backup
            
            remove_nginx_entry "$url"
            remove_hosts_entry "$url"
            
            reload_nginx
            
            print_status "Successfully removed reverse proxy for $url"
            ;;
            
        "list")
            list_entries
            ;;
            
        *)
            print_error "Invalid action: $action"
            show_usage
            exit 1
            ;;
    esac
}

# Check if running as root for certain operations
if [[ "$1" == "add" || "$1" == "remove" ]]; then
    if [[ ! -w "$NGINX_CONF" ]]; then
        print_error "Cannot write to nginx config. Make sure you have proper permissions."
        exit 1
    fi
fi

# Run main function
main "$@"
