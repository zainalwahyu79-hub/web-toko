#!/usr/bin/env node

import pkg from 'pg';
import bcryptjs from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'toko_baju_db'
});

async function checkPasswords() {
  try {
    const result = await pool.query('SELECT email, password FROM users LIMIT 5');
    console.log('Checking user passwords:\n');
    
    for (const user of result.rows) {
      const passwordHash = user.password;
      console.log(`Email: ${user.email}`);
      console.log(`Password hash: ${passwordHash.substring(0, 20)}...`);
      
      // Check if it looks like bcrypt hash (starts with $2a$ or $2b$ or $2y$)
      if (passwordHash.startsWith('$2')) {
        console.log('✓ Looks like bcrypt hash');
        
        // Test with common passwords
        const isMatch123456 = await bcryptjs.compare('123456', passwordHash);
        console.log(`  - Password "123456" matches: ${isMatch123456}`);
      } else {
        console.log('✗ Does NOT look like bcrypt hash (likely plain text)');
      }
      console.log();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPasswords();
