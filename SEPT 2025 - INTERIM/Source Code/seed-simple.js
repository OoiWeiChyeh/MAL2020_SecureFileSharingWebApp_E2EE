/**
 * Simple Seed Script - Uses REST API to bypass security rules
 */

import fetch from 'node-fetch';

const EMULATOR_AUTH_URL = 'http://localhost:9099';
const EMULATOR_FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'file-share-f8260';

const users = [
  { email: 'examunit@test.com', password: 'test123456', displayName: 'Exam Unit Admin', role: 'exam_unit', department: null },
  { email: 'hos.cs@test.com', password: 'test123456', displayName: 'Dr. Ahmad bin Hassan', role: 'hos', department: 'cs-dept' },
  { email: 'hos.me@test.com', password: 'test123456', displayName: 'Prof. Sarah Abdullah', role: 'hos', department: 'me-dept' },
  { email: 'hos.ee@test.com', password: 'test123456', displayName: 'Dr. Raj Kumar', role: 'hos', department: 'ee-dept' },
  { email: 'lecturer1@test.com', password: 'test123456', displayName: 'Dr. Ali Rahman', role: 'lecturer', department: 'cs-dept', subjects: ['cs101', 'cs201'] },
  { email: 'lecturer2@test.com', password: 'test123456', displayName: 'Dr. Siti Nurhaliza', role: 'lecturer', department: 'me-dept', subjects: ['me101', 'me201'] },
  { email: 'lecturer3@test.com', password: 'test123456', displayName: 'Dr. Kumar Subramaniam', role: 'lecturer', department: 'ee-dept', subjects: ['ee101', 'ee201'] }
];

const departments = [
  { id: 'cs-dept', name: 'Computer Science', code: 'CS' },
  { id: 'me-dept', name: 'Mechanical Engineering', code: 'ME' },
  { id: 'ee-dept', name: 'Electrical Engineering', code: 'EE' }
];

async function createAuthUser(email, password, displayName) {
  try {
    const response = await fetch(`${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    if (data.error) {
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`   ⚠️  ${email} already exists`);
        // Get the user ID by signing in
        const signInResponse = await fetch(`${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const signInData = await signInResponse.json();
        return signInData.localId;
      }
      throw new Error(data.error.message);
    }
    return data.localId;
  } catch (error) {
    console.error(`   ❌ Error creating ${email}:`, error.message);
    return null;
  }
}

async function createFirestoreDoc(collection, docId, data) {
  try {
    const url = `${EMULATOR_FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?documentId=${docId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: convertToFirestoreFormat(data)
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return true;
  } catch (error) {
    console.error(`   ❌ Error creating document:`, error.message);
    return false;
  }
}

function convertToFirestoreFormat(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      result[key] = { integerValue: value.toString() };
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      result[key] = {
        arrayValue: {
          values: value.map(v => ({ stringValue: v }))
        }
      };
    } else if (value instanceof Date) {
      result[key] = { timestampValue: value.toISOString() };
    }
  }
  return result;
}

async function seed() {
  console.log('\n🌱 Simple Seed Script\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create departments
  console.log('📁 Creating departments...');
  for (const dept of departments) {
    const success = await createFirestoreDoc('departments', dept.id, {
      name: dept.name,
      code: dept.code,
      description: `Department of ${dept.name}`,
      createdAt: new Date()
    });
    if (success) console.log(`   ✅ ${dept.name}`);
  }

  // Create users
  console.log('\n👤 Creating users...');
  for (const user of users) {
    // Create in Auth
    const uid = await createAuthUser(user.email, user.password, user.displayName);
    if (!uid) continue;
    
    // Create in Firestore
    const success = await createFirestoreDoc('users', uid, {
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      subjects: user.subjects || [],
      createdAt: new Date(),
      status: 'approved'
    });
    
    if (success) {
      console.log(`   ✅ ${user.displayName} (${user.role})`);
    }
  }

  console.log('\n✅ Seed completed!\n');
  console.log('📝 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(u => {
    console.log(`${u.email.padEnd(25)} | ${u.password} | ${u.role}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🌐 Access:');
  console.log('   → App: http://localhost:3000');
  console.log('   → Emulator UI: http://localhost:4000\n');
}

// Check if emulator is running
const checkEmulator = await fetch('http://localhost:4000').catch(() => null);
if (!checkEmulator) {
  console.error('❌ Emulator not running!');
  console.error('Start it first: npm run emulator\n');
  process.exit(1);
}

seed().catch(console.error);

