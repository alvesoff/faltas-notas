/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // Configurações para produção
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
}

module.exports = nextConfig