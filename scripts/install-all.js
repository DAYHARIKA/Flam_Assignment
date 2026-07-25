import { execSync } from 'child_process';

const isVercel = !!process.env.VERCEL;

try {
  if (isVercel) {
    console.log('Vercel deployment detected. Installing frontend dependencies only...');
    execSync('npm install --prefix frontend --no-scripts', { stdio: 'inherit' });
  } else {
    console.log('Installing backend dependencies...');
    execSync('npm install --prefix backend --no-scripts', { stdio: 'inherit' });
    console.log('Installing frontend dependencies...');
    execSync('npm install --prefix frontend --no-scripts', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Dependency installation failed:', error.message);
  process.exit(1);
}
