module.exports = {
  apps: [
    {
      name: 'intelligence-query-enginee',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // Database - Load from .env on VPS
        // DATABASE_URL will be read from .env file
        // Format: postgresql://user:password@host:port/database_name
      },
      // Restart policies
      autorestart: true,
      max_memory_restart: '300M',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // Logging
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // File watching for auto-restart on relevant changes
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'dist'],
      // Additional settings
      merge_logs: true,
      max_old_space_size: 512,
      // Grace period for shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
