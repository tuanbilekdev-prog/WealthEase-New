import crypto from 'crypto';

// Generate a random JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n=== JWT Secret Generator ===\n');
console.log('JWT_SECRET yang di-generate:');
console.log(jwtSecret);
console.log('\n📝 Copy secret di atas ke file .env Anda:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('\n⚠️  PENTING:');
console.log('   - Simpan secret ini dengan aman');
console.log('   - Jangan commit ke Git (sudah ada di .gitignore)');
console.log('   - Gunakan secret yang berbeda untuk production');
console.log('   - Secret ini digunakan untuk menandatangani JWT tokens\n');

