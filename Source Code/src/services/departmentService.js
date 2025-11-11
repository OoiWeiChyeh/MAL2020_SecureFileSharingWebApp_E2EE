import { 
  collection, 
  doc, 
  addDoc,
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Create a new department
 */
export const createDepartment = async (departmentData) => {
  try {
    const deptRef = collection(db, 'departments');
    const docRef = await addDoc(deptRef, {
      name: departmentData.name,
      code: departmentData.code,
      hosId: departmentData.hosId || null,
      courses: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

/**
 * Get department by ID
 */
export const getDepartment = async (departmentId) => {
  try {
    const deptRef = doc(db, 'departments', departmentId);
    const deptSnap = await getDoc(deptRef);
    
    if (deptSnap.exists()) {
      return { id: deptSnap.id, ...deptSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting department:', error);
    throw error;
  }
};

/**
 * Get all departments
 */
export const getAllDepartments = async () => {
  try {
    const deptRef = collection(db, 'departments');
    const querySnapshot = await getDocs(deptRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting departments:', error);
    throw error;
  }
};

/**
 * Update department
 */
export const updateDepartment = async (departmentId, updates) => {
  try {
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

/**
 * Delete department
 */
export const deleteDepartment = async (departmentId) => {
  try {
    const deptRef = doc(db, 'departments', departmentId);
    await deleteDoc(deptRef);
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

/**
 * Assign HOS to department
 */
export const assignHOSToDepartment = async (departmentId, hosId) => {
  try {
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      hosId: hosId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning HOS:', error);
    throw error;
  }
};

/**
 * Add course to department
 */
export const addCourseToDepartment = async (departmentId, courseData) => {
  try {
    const deptRef = doc(db, 'departments', departmentId);
    const dept = await getDepartment(departmentId);
    
    const newCourse = {
      courseId: `course_${Date.now()}`,
      courseName: courseData.courseName,
      courseCode: courseData.courseCode,
      subjects: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedCourses = [...(dept.courses || []), newCourse];
    
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
    
    return newCourse.courseId;
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
};

/**
 * Update course in department
 */
export const updateCourseInDepartment = async (departmentId, courseId, courseData) => {
  try {
    const dept = await getDepartment(departmentId);
    const updatedCourses = dept.courses.map(course => 
      course.courseId === courseId 
        ? { ...course, ...courseData, updatedAt: new Date().toISOString() }
        : course
    );
    
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

/**
 * Delete course from department
 */
export const deleteCourseFromDepartment = async (departmentId, courseId) => {
  try {
    const dept = await getDepartment(departmentId);
    const updatedCourses = dept.courses.filter(course => course.courseId !== courseId);
    
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

/**
 * Add subject to course
 */
export const addSubjectToCourse = async (departmentId, courseId, subjectData) => {
  try {
    const dept = await getDepartment(departmentId);
    
    const newSubject = {
      subjectId: `subject_${Date.now()}`,
      subjectName: subjectData.subjectName,
      subjectCode: subjectData.subjectCode,
      assignedLecturerId: subjectData.assignedLecturerId || null,
      createdAt: new Date().toISOString()
    };
    
    const updatedCourses = dept.courses.map(course => {
      if (course.courseId === courseId) {
        return {
          ...course,
          subjects: [...(course.subjects || []), newSubject]
        };
      }
      return course;
    });
    
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
    
    return newSubject.subjectId;
  } catch (error) {
    console.error('Error adding subject:', error);
    throw error;
  }
};

/**
 * Update subject in course
 */
export const updateSubjectInCourse = async (departmentId, courseId, subjectId, subjectData) => {
  try {
    const dept = await getDepartment(departmentId);
    
    const updatedCourses = dept.courses.map(course => {
      if (course.courseId === courseId) {
        const updatedSubjects = course.subjects.map(subject =>
          subject.subjectId === subjectId
            ? { ...subject, ...subjectData, updatedAt: new Date().toISOString() }
            : subject
        );
        return { ...course, subjects: updatedSubjects };
      }
      return course;
    });
    
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

/**
 * Delete subject from course
 */
export const deleteSubjectFromCourse = async (departmentId, courseId, subjectId) => {
  try {
    const dept = await getDepartment(departmentId);
    
    const updatedCourses = dept.courses.map(course => {
      if (course.courseId === courseId) {
        const updatedSubjects = course.subjects.filter(subject => subject.subjectId !== subjectId);
        return { ...course, subjects: updatedSubjects };
      }
      return course;
    });
    
    const deptRef = doc(db, 'departments', departmentId);
    await updateDoc(deptRef, {
      courses: updatedCourses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

/**
 * Assign lecturer to subject
 */
export const assignLecturerToSubject = async (departmentId, courseId, subjectId, lecturerId) => {
  try {
    await updateSubjectInCourse(departmentId, courseId, subjectId, {
      assignedLecturerId: lecturerId
    });
  } catch (error) {
    console.error('Error assigning lecturer to subject:', error);
    throw error;
  }
};

/**
 * Get subjects assigned to a lecturer
 */
export const getSubjectsForLecturer = async (lecturerId) => {
  try {
    const departments = await getAllDepartments();
    const assignedSubjects = [];
    
    departments.forEach(dept => {
      dept.courses?.forEach(course => {
        course.subjects?.forEach(subject => {
          if (subject.assignedLecturerId === lecturerId) {
            assignedSubjects.push({
              ...subject,
              courseName: course.courseName,
              courseCode: course.courseCode,
              departmentName: dept.name,
              departmentCode: dept.code,
              departmentId: dept.id,
              courseId: course.courseId
            });
          }
        });
      });
    });
    
    return assignedSubjects;
  } catch (error) {
    console.error('Error getting subjects for lecturer:', error);
    throw error;
  }
};

/**
 * Get department for HOS
 */
export const getDepartmentForHOS = async (hosId) => {
  try {
    const deptRef = collection(db, 'departments');
    const q = query(deptRef, where('hosId', '==', hosId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting department for HOS:', error);
    throw error;
  }
};

