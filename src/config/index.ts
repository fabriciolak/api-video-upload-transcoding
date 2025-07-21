export const config = {
  port: process.env.PORT || 3001,
  database: {
    uri: process.env.DATABASE_URL || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'super-secret',
  env: process.env.NODE_ENV || 'development',
};