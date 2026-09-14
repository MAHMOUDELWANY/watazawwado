const fs = require('fs');
let code = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');

const search = `  const navItems = [
    { name: 'Home & Schedule', path: '/student', icon: BookOpen },
    { name: 'Profile & Goals', path: '/student/profile', icon: User },
  ];`;

const replace = `  const navItems = [
    { name: 'Home & Schedule', path: '/student', icon: BookOpen },
    { name: 'Profile & Goals', path: '/student/profile', icon: User },
  ];`;

// Looks like the Interactive Demo might have already been removed! 
// Let's just double check and confirm the full block.

console.log('Checking StudentApp Nav items');
