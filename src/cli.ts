#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigManager } from './config';
import { ReverseProxyManager } from './reverse-proxy-manager';
import { SetupAnswers } from './types';

const program = new Command();

program
  .name('reverse-proxy-manager')
  .description('A powerful CLI tool for managing nginx reverse proxy entries')
  .version('1.0.0');

// Setup command
program
  .command('setup')
  .description('Configure the reverse proxy manager')
  .action(async () => {
    try {
      console.log(chalk.blue('🔧 Setting up Reverse Proxy Manager...\n'));
      
      const configManager = new ConfigManager();
      const defaultConfig = configManager.getDefaultConfig();

      const questions = [
        {
          type: 'input',
          name: 'nginxConf',
          message: 'Nginx config file path:',
          default: defaultConfig.nginxConf,
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Nginx config path is required';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'hostsFile',
          message: 'Hosts file path:',
          default: defaultConfig.hostsFile,
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Hosts file path is required';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'nginxBin',
          message: 'Nginx binary path:',
          default: defaultConfig.nginxBin,
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Nginx binary path is required';
            }
            return true;
          }
        },
        {
          type: 'number',
          name: 'localPort',
          message: 'Default local port:',
          default: defaultConfig.localPort,
          validate: (input: number) => {
            if (!Number.isInteger(input) || input < 1 || input > 65535) {
              return 'Port must be a number between 1 and 65535';
            }
            return true;
          }
        }
      ];

      const answers: SetupAnswers = await inquirer.prompt(questions);
      
      // Validate configuration
      const config = {
        nginxConf: answers.nginxConf,
        hostsFile: answers.hostsFile,
        nginxBin: answers.nginxBin,
        localPort: answers.localPort,
        backupDir: defaultConfig.backupDir
      };

      await configManager.validateConfig(config);
      await configManager.saveConfig(answers);

      console.log(chalk.green('✅ Configuration saved successfully!'));
      console.log(chalk.blue(`📁 Config file: ${configManager.getConfigPath()}`));
    } catch (error) {
      console.error(chalk.red(`❌ Setup failed: ${error}`));
      process.exit(1);
    }
  });

// Add command
program
  .command('add <url>')
  .description('Add a reverse proxy entry')
  .option('-p, --port <port>', 'Local port number', '8004')
  .option('-f, --force', 'Force add even if entry exists', false)
  .action(async (url: string, options: any) => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const manager = new ReverseProxyManager(config);

      const port = parseInt(options.port, 10);
      const result = await manager.addProxy(url, port);

      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
        if (result.data?.backup) {
          console.log(chalk.blue(`📦 Backup created: ${result.data.backup.timestamp}`));
        }
      } else {
        console.error(chalk.red(`❌ ${result.message}`));
        if (result.error) {
          console.error(chalk.red(`   Error: ${result.error}`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to add proxy: ${error}`));
      process.exit(1);
    }
  });

// Remove command
program
  .command('remove <url>')
  .description('Remove a reverse proxy entry')
  .action(async (url: string) => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const manager = new ReverseProxyManager(config);

      const result = await manager.removeProxy(url);

      if (result.success) {
        console.log(chalk.green(`✅ ${result.message}`));
        if (result.data?.backup) {
          console.log(chalk.blue(`📦 Backup created: ${result.data.backup.timestamp}`));
        }
      } else {
        console.error(chalk.red(`❌ ${result.message}`));
        if (result.error) {
          console.error(chalk.red(`   Error: ${result.error}`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to remove proxy: ${error}`));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List all reverse proxy entries')
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const manager = new ReverseProxyManager(config);

      const result = await manager.listProxies();

      if (result.success) {
        console.log(chalk.blue('📋 Current Reverse Proxy Entries:\n'));
        
        if (result.data?.nginx && result.data.nginx.length > 0) {
          console.log(chalk.yellow('Nginx Configuration:'));
          result.data.nginx.forEach((entry: string) => {
            console.log(chalk.green(`  • ${entry}`));
          });
          console.log();
        } else {
          console.log(chalk.gray('  No nginx entries found'));
        }

        if (result.data?.hosts && result.data.hosts.length > 0) {
          console.log(chalk.yellow('Hosts File:'));
          result.data.hosts.forEach((entry: string) => {
            console.log(chalk.green(`  • ${entry}`));
          });
        } else {
          console.log(chalk.gray('  No hosts entries found'));
        }
      } else {
        console.error(chalk.red(`❌ ${result.message}`));
        if (result.error) {
          console.error(chalk.red(`   Error: ${result.error}`));
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to list proxies: ${error}`));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check the status of the reverse proxy manager')
  .action(async () => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();

      console.log(chalk.blue('🔍 Reverse Proxy Manager Status:\n'));
      console.log(chalk.yellow('Configuration:'));
      console.log(`  Nginx Config: ${config.nginxConf}`);
      console.log(`  Hosts File: ${config.hostsFile}`);
      console.log(`  Nginx Binary: ${config.nginxBin}`);
      console.log(`  Default Port: ${config.localPort}`);
      console.log(`  Backup Directory: ${config.backupDir}\n`);

      // Test nginx configuration
      const { Utils } = await import('./utils');
      const nginxTest = await Utils.testNginxConfig(config.nginxBin);
      
      if (nginxTest) {
        console.log(chalk.green('✅ Nginx configuration is valid'));
      } else {
        console.log(chalk.red('❌ Nginx configuration has issues'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to check status: ${error}`));
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`❌ Invalid command. Use --help to see available commands.`));
  process.exit(1);
});

// Parse command line arguments
program.parse();
