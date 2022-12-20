// PCRT-REST Database Interface
// Triarom Engineering (c) 2022

import mariadb from 'mariadb';

class DatabaseInterface {
  constructor(logger, config) {
    this.logger = logger.child({ module: 'DatabaseInterface' });
    this.config = config;
    this.logger.debug("creating connection pool")
    this.pool = mariadb.createPool({
      host: this.config.database.host,
      user: this.config.database.user,
      password: this.config.database.password,
      database: this.config.database.database
    });
  }

  async get_connection() {
    this.logger.debug("fetching pool connection")
    try {
      return await this.pool.getConnection();
    } catch (err) {
      this.logger.error(err);
      return null;
    }
  }
}

export default DatabaseInterface;