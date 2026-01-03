/* eslint-disable no-console */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Role = require('../features/role/model/Role.model');
const User = require('../features/user/model/User.model');

const REQUIRED_VARS = ['MONGO_URI', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_USERNAME', 'SEED_ADMIN_PASSWORD'];

const getEnv = (key) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
};

async function ensureAdminRole(roleName = 'admin') {
  let role = await Role.findOne({ name: roleName });
  if (!role) {
    role = await Role.create({ name: roleName });
    console.log(`Created role: ${roleName}`);
  } else {
    console.log(`Role already exists: ${roleName}`);
  }
  return role;
}

async function upsertAdminUser({ username, email, password, roleId }) {
  let user = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!user) {
    user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: roleId,
    });
    console.log(`Created admin user ${email}`);
    return user;
  }

  user.username = username;
  user.password = hashedPassword;
  user.role = roleId;
  await user.save();
  console.log(`Updated existing admin user ${email}`);
  return user;
}

async function main() {
  REQUIRED_VARS.forEach(getEnv);

  const MONGO_URI = getEnv('MONGO_URI');
  const username = getEnv('SEED_ADMIN_USERNAME');
  const email = getEnv('SEED_ADMIN_EMAIL');
  const password = getEnv('SEED_ADMIN_PASSWORD');

  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  try {
    const adminRole = await ensureAdminRole('admin');
    await upsertAdminUser({
      username,
      email,
      password,
      roleId: adminRole._id,
    });
    console.log('Admin seed completed successfully');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
  });

