import bcryptjs from 'bcryptjs';

const passwords = {
  'admin123': 'admin@tokobaju.com',
  'budi123': 'budi@email.com',
  'siti123': 'siti@email.com',
  'ahmad123': 'ahmad@email.com'
};

console.log('Password Hashes for Database:');
console.log('============================\n');

for (const [password, email] of Object.entries(passwords)) {
  const hash = bcryptjs.hashSync(password, 10);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}\n`);
}
