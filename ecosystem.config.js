
module.exports = {
  apps: [
    {
      name: 'healthcare-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
        DATABASE_HOST: 'staging-db.internal',
        DATABASE_PORT: 5432,
        DATABASE_USERNAME: 'api_user',
        DATABASE_NAME: 'healthcare_staging',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_HOST: 'prod-db.internal',
        DATABASE_PORT: 5432,
        DATABASE_USERNAME: 'api_user',
        DATABASE_NAME: 'healthcare_prod',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
