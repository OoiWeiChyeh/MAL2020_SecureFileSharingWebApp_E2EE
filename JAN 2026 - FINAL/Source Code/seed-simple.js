/**
 * Simple Seed Script - Uses REST API to bypass security rules
 * Creates showcase data: 2 departments with courses, subjects, and assigned lecturers
 */

import fetch from 'node-fetch';

const EMULATOR_AUTH_URL = 'http://localhost:9099';
const EMULATOR_FIRESTORE_URL = 'http://localhost:8080';
const PROJECT_ID = 'file-share-f8260';

// ─── Users ──────────────────────────────────────────────────────────────────────
const users = [
  // Exam Unit (1)
  { email: 'examunit@test.com', password: 'test123456', displayName: 'Puan Nor Azizah', role: 'exam_unit', department: null },

  // HOS (2 — one per department)
  { email: 'hos.cs@test.com', password: 'test123456', displayName: 'Dr. Ahmad bin Hassan', role: 'hos', department: 'cs-dept' },
  { email: 'hos.ee@test.com', password: 'test123456', displayName: 'Prof. Raj Kumar', role: 'hos', department: 'ee-dept' },

  // CS Lecturers (5)
  { email: 'cs.ali@test.com', password: 'test123456', displayName: 'Dr. Ali Rahman', role: 'lecturer', department: 'cs-dept' },
  { email: 'cs.siti@test.com', password: 'test123456', displayName: 'Dr. Siti Aminah', role: 'lecturer', department: 'cs-dept' },
  { email: 'cs.farid@test.com', password: 'test123456', displayName: 'Dr. Farid Iskandar', role: 'lecturer', department: 'cs-dept' },
  { email: 'cs.nadia@test.com', password: 'test123456', displayName: 'Dr. Nadia Hanim', role: 'lecturer', department: 'cs-dept' },
  { email: 'cs.zul@test.com', password: 'test123456', displayName: 'Dr. Zulkifli Mokhtar', role: 'lecturer', department: 'cs-dept' },

  // EE Lecturers (5)
  { email: 'ee.kumar@test.com', password: 'test123456', displayName: 'Dr. Kumar Subramaniam', role: 'lecturer', department: 'ee-dept' },
  { email: 'ee.mei@test.com', password: 'test123456', displayName: 'Dr. Mei Ling Tan', role: 'lecturer', department: 'ee-dept' },
  { email: 'ee.hafiz@test.com', password: 'test123456', displayName: 'Dr. Hafiz Razak', role: 'lecturer', department: 'ee-dept' },
  { email: 'ee.sarah@test.com', password: 'test123456', displayName: 'Prof. Sarah Abdullah', role: 'lecturer', department: 'ee-dept' },
  { email: 'ee.daniel@test.com', password: 'test123456', displayName: 'Dr. Daniel Lim', role: 'lecturer', department: 'ee-dept' },
];

// ─── Departments with full course/subject structure ─────────────────────────────
// lecturer UIDs will be filled in after auth user creation
const departmentStructure = [
  {
    id: 'cs-dept',
    name: 'Computer Science',
    code: 'CS',
    courses: [
      {
        courseId: 'cs-se',
        courseName: 'Software Engineering',
        courseCode: 'SE',
        subjects: [
          { subjectId: 'cs101', subjectName: 'Introduction to Programming', subjectCode: 'CS101', lecturerEmail: 'cs.ali@test.com' },
          { subjectId: 'cs201', subjectName: 'Data Structures & Algorithms', subjectCode: 'CS201', lecturerEmail: 'cs.siti@test.com' },
          { subjectId: 'cs301', subjectName: 'Software Engineering Principles', subjectCode: 'CS301', lecturerEmail: 'cs.farid@test.com' },
        ]
      },
      {
        courseId: 'cs-ds',
        courseName: 'Data Science',
        courseCode: 'DS',
        subjects: [
          { subjectId: 'ds101', subjectName: 'Database Systems', subjectCode: 'DS101', lecturerEmail: 'cs.nadia@test.com' },
          { subjectId: 'ds201', subjectName: 'Machine Learning', subjectCode: 'DS201', lecturerEmail: 'cs.zul@test.com' },
          { subjectId: 'ds301', subjectName: 'Big Data Analytics', subjectCode: 'DS301', lecturerEmail: 'cs.ali@test.com' },
        ]
      }
    ]
  },
  {
    id: 'ee-dept',
    name: 'Electrical Engineering',
    code: 'EE',
    courses: [
      {
        courseId: 'ee-power',
        courseName: 'Power Systems',
        courseCode: 'PS',
        subjects: [
          { subjectId: 'ee101', subjectName: 'Circuit Analysis', subjectCode: 'EE101', lecturerEmail: 'ee.kumar@test.com' },
          { subjectId: 'ee201', subjectName: 'Power Electronics', subjectCode: 'EE201', lecturerEmail: 'ee.mei@test.com' },
          { subjectId: 'ee301', subjectName: 'Electrical Machines', subjectCode: 'EE301', lecturerEmail: 'ee.hafiz@test.com' },
        ]
      },
      {
        courseId: 'ee-comms',
        courseName: 'Communications Engineering',
        courseCode: 'CE',
        subjects: [
          { subjectId: 'ce101', subjectName: 'Signals & Systems', subjectCode: 'CE101', lecturerEmail: 'ee.sarah@test.com' },
          { subjectId: 'ce201', subjectName: 'Digital Communications', subjectCode: 'CE201', lecturerEmail: 'ee.daniel@test.com' },
          { subjectId: 'ce301', subjectName: 'Wireless Networks', subjectCode: 'CE301', lecturerEmail: 'ee.kumar@test.com' },
        ]
      }
    ]
  }
];

// ─── Deadlines (showcase variety) ───────────────────────────────────────────────
// These are set at department level to show cascading
const deadlines = {
  'cs-dept': {
    // Department-level deadline
    deadline: daysFromNow(20),
    courses: {
      'cs-se': {
        // Course-level override
        deadline: daysFromNow(14),
        subjects: {
          'cs301': { deadline: daysFromNow(5) }    // Subject-level override — critical!
        }
      },
      'cs-ds': {
        deadline: daysFromNow(7),  // Warning range
      }
    }
  },
  'ee-dept': {
    deadline: daysFromNow(25),
    courses: {
      'ee-power': {
        deadline: daysFromNow(3),  // Critical!
      },
      'ee-comms': {
        subjects: {
          'ce201': { deadline: daysFromNow(-2) }   // Already overdue!
        }
      }
    }
  }
};

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 0);
  return d.toISOString();
}

// ─── Helper functions ───────────────────────────────────────────────────────────

async function createAuthUser(email, password, displayName) {
  try {
    const response = await fetch(`${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true })
    });

    const data = await response.json();
    if (data.error) {
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`   ⚠️  ${email} already exists`);
        const signInResponse = await fetch(`${EMULATOR_AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const signInData = await signInResponse.json();
        return { uid: signInData.localId, token: signInData.idToken };
      }
      throw new Error(data.error.message);
    }
    return { uid: data.localId, token: data.idToken };
  } catch (error) {
    console.error(`   ❌ Error creating ${email}:`, error.message);
    return null;
  }
}

async function createFirestoreDoc(collection, docId, data, authToken = null) {
  try {
    const url = `${EMULATOR_FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?documentId=${docId}`;
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: convertToFirestoreFormat(data) })
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

async function updateFirestoreDoc(collection, docId, data, authToken = null) {
  try {
    const fields = convertToFirestoreFormat(data);
    const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `${EMULATOR_FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?${fieldPaths}`;
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return true;
  } catch (error) {
    console.error(`   ❌ Error updating document:`, error.message);
    return false;
  }
}

function convertToFirestoreFormat(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      result[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      result[key] = { integerValue: value.toString() };
    } else if (typeof value === 'boolean') {
      result[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      // Handle array of objects (courses/subjects) vs array of strings
      result[key] = {
        arrayValue: {
          values: value.map(v => {
            if (typeof v === 'string') return { stringValue: v };
            if (typeof v === 'object' && v !== null) return { mapValue: { fields: convertToFirestoreFormat(v) } };
            return { stringValue: String(v) };
          })
        }
      };
    } else if (value instanceof Date) {
      result[key] = { timestampValue: value.toISOString() };
    } else if (typeof value === 'object') {
      result[key] = { mapValue: { fields: convertToFirestoreFormat(value) } };
    }
  }
  return result;
}

// ─── Main seed function ─────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 KUNCHEE Showcase Seed Script\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Step 1: Create all Auth users ──
  console.log('👤 Creating auth accounts...');
  const userResults = [];
  for (const user of users) {
    const result = await createAuthUser(user.email, user.password, user.displayName);
    if (result) {
      userResults.push({ ...user, uid: result.uid, token: result.token });
      console.log(`   ✅ ${user.displayName} (${user.email})`);
    }
  }

  // Build email→uid lookup for lecturer assignment
  const emailToUid = {};
  const emailToName = {};
  for (const u of userResults) {
    emailToUid[u.email] = u.uid;
    emailToName[u.email] = u.displayName;
  }

  // ── Step 2: Create user docs with role='pending' ──
  console.log('\n📝 Creating user documents...');
  for (const user of userResults) {
    const success = await createFirestoreDoc('users', user.uid, {
      email: user.email,
      displayName: user.displayName,
      role: 'pending',
      department: user.department,
      subjects: [],
      createdAt: new Date(),
      status: 'approved'
    }, user.token);
    if (success) console.log(`   ✅ ${user.displayName} (pending)`);
  }

  // ── Step 3: Promote exam_unit via emulator bypass ──
  console.log('\n🔑 Setting user roles...');
  const examUnitUser = userResults.find(u => u.role === 'exam_unit');
  if (examUnitUser) {
    const url = `${EMULATOR_FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${examUnitUser.uid}?updateMask.fieldPaths=role`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer owner' },
      body: JSON.stringify({ fields: { role: { stringValue: 'exam_unit' } } })
    });
    if (response.ok) console.log(`   ✅ ${examUnitUser.displayName} → exam_unit`);
  }

  // Re-sign in as exam_unit to get a fresh token
  const adminSignIn = await createAuthUser(examUnitUser.email, examUnitUser.password, examUnitUser.displayName);
  const adminToken = adminSignIn?.token;

  // Update everyone else's roles
  for (const user of userResults) {
    if (user.role === 'exam_unit') continue;
    const success = await updateFirestoreDoc('users', user.uid, { role: user.role }, adminToken);
    if (success) console.log(`   ✅ ${user.displayName} → ${user.role}`);
  }

  // ── Step 4: Create departments with courses, subjects, and lecturer assignments ──
  console.log('\n📁 Creating departments with courses & subjects...');
  for (const dept of departmentStructure) {
    // Build Firestore-compatible courses array with lecturer UIDs filled in
    const coursesData = dept.courses.map(course => {
      const subjects = course.subjects.map(sub => ({
        subjectId: sub.subjectId,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        assignedLecturerId: emailToUid[sub.lecturerEmail] || null,
        assignedLecturerName: emailToName[sub.lecturerEmail] || null,
      }));
      return {
        courseId: course.courseId,
        courseName: course.courseName,
        courseCode: course.courseCode,
        subjects,
      };
    });

    // Build deadline data from the deadlines config
    const deptDeadlineConfig = deadlines[dept.id] || {};
    const deptData = {
      name: dept.name,
      code: dept.code,
      description: `Department of ${dept.name}`,
      courses: coursesData,
      createdAt: new Date(),
    };

    // Add department-level deadline if defined
    if (deptDeadlineConfig.deadline) {
      deptData.deadline = deptDeadlineConfig.deadline;
    }

    // Add course-level deadlines
    if (deptDeadlineConfig.courses) {
      for (const courseData of deptData.courses) {
        const courseDeadline = deptDeadlineConfig.courses[courseData.courseId];
        if (courseDeadline) {
          if (courseDeadline.deadline) {
            courseData.deadline = courseDeadline.deadline;
          }
          // Add subject-level deadlines
          if (courseDeadline.subjects) {
            for (const subData of courseData.subjects) {
              const subDeadline = courseDeadline.subjects[subData.subjectId];
              if (subDeadline && subDeadline.deadline) {
                subData.deadline = subDeadline.deadline;
              }
            }
          }
        }
      }
    }

    const success = await createFirestoreDoc('departments', dept.id, deptData, adminToken);
    if (success) {
      console.log(`   ✅ ${dept.name}`);
      for (const course of dept.courses) {
        console.log(`      📚 ${course.courseName} (${course.courseCode})`);
        for (const sub of course.subjects) {
          const lecName = emailToName[sub.lecturerEmail] || '?';
          console.log(`         📖 ${sub.subjectCode} - ${sub.subjectName} → ${lecName}`);
        }
      }
    }
  }

  // ── Step 5: Update lecturer user docs with their assigned subjects ──
  // Must match the format used by assignLecturerToSubject():
  //   assignedSubjects: [{ deptId, deptName, courseId, subjectId, subjectCode, subjectName }]
  console.log('\n🔗 Linking subjects to lecturers...');
  for (const dept of departmentStructure) {
    for (const course of dept.courses) {
      for (const sub of course.subjects) {
        const user = userResults.find(u => u.email === sub.lecturerEmail);
        if (!user) continue;

        if (!user.assignedSubjectObjects) user.assignedSubjectObjects = [];
        user.assignedSubjectObjects.push({
          deptId: dept.id,
          deptName: dept.name,
          courseId: course.courseId,
          subjectId: sub.subjectId,
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
        });
      }
    }
  }

  // Update each lecturer's assignedSubjects array
  for (const user of userResults) {
    if (user.role !== 'lecturer' || !user.assignedSubjectObjects) continue;
    const success = await updateFirestoreDoc('users', user.uid, {
      assignedSubjects: user.assignedSubjectObjects,
      department: user.department,
    }, adminToken);
    if (success) {
      const codes = user.assignedSubjectObjects.map(s => s.subjectCode).join(', ');
      console.log(`   ✅ ${user.displayName} → [${codes}]`);
    }
  }

  // ── Summary ──
  console.log('\n✅ Seed completed!\n');
  console.log('📝 Test Accounts (all password: test123456):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ROLE          EMAIL                     NAME');
  console.log('  ──────────    ────────────────────────  ──────────────────────');
  users.forEach(u => {
    console.log(`  ${u.role.padEnd(12)}  ${u.email.padEnd(26)}${u.displayName}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📅 Deadline Summary:');
  console.log('  CS Dept: 20 days │ SE course: 14 days │ CS301: 5 days (critical!)');
  console.log('  CS Dept: 20 days │ DS course: 7 days  (warning)');
  console.log('  EE Dept: 25 days │ Power: 3 days (critical!) │ CE201: OVERDUE!');

  console.log('\n🌐 Access:');
  console.log('   → App: http://localhost:5173');
  console.log('   → Emulator UI: http://localhost:4000\n');
}

// ─── Run ────────────────────────────────────────────────────────────────────────
const checkEmulator = await fetch('http://localhost:4000').catch(() => null);
if (!checkEmulator) {
  console.error('❌ Emulator not running!');
  console.error('Start it first: npm run emulator\n');
  process.exit(1);
}

seed().catch(console.error);
