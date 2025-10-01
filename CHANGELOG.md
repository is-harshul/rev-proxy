# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Reverse Proxy Manager
- CLI interface with setup, add, remove, list, and status commands
- TypeScript implementation with full type safety
- Interactive setup wizard for configuration
- Automatic backup creation before any changes
- Nginx configuration validation and testing
- Comprehensive error handling and recovery
- Beautiful colored CLI output
- Input validation for URLs and ports
- Duplicate entry prevention
- Support for custom ports
- Status checking and configuration validation
- Comprehensive test suite
- ESLint configuration for code quality
- GitHub Actions CI/CD pipeline
- MIT license

### Features
- Add reverse proxy entries with one command
- Remove reverse proxy entries safely
- List all current proxy entries
- Interactive setup for first-time configuration
- Automatic nginx reload after successful changes
- Backup and restore functionality
- Cross-platform support (macOS, Linux, Windows)
- Zero runtime dependencies for core functionality
