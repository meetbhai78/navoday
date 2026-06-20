import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateLanguage } from '../features/authSlice';

const translations = {
  en: {
    appName: "Smart Student & Attendance System",
    login: "Login",
    register: "Register Student",
    username: "Username",
    password: "Password",
    role: "Role",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    rollNumber: "Roll Number",
    village: "Village",
    class: "Standard/Class",
    guardianName: "Guardian Name",
    guardianPhone: "Guardian Phone",
    attendance: "Attendance",
    exams: "Exams & Results",
    homework: "Homework & Notes",
    messages: "Messages",
    dashboard: "Dashboard",
    adminPanel: "Admin Panel",
    teachers: "Teachers",
    students: "Students",
    villages: "Villages",
    classes: "Classes",
    auditLogs: "Audit Logs",
    logout: "Logout",
    present: "Present",
    absent: "Absent",
    date: "Date",
    totalStudents: "Total Students",
    totalTeachers: "Total Teachers",
    overallAttendance: "Overall Attendance",
    submit: "Submit",
    cancel: "Cancel",
    actions: "Actions",
    add: "Add New",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    title: "Title",
    description: "Description",
    subject: "Subject",
    dueDate: "Due Date",
    file: "Attachment / PDF",
    graded: "Graded",
    pending: "Pending",
    submitted: "Submitted",
    mark: "Mark Attendance",
    reports: "Reports",
    createExam: "Create Exam",
    upcoming: "Upcoming",
    offline: "Offline",
    online: "Online",
    result: "Result",
    marksObtained: "Marks Obtained",
    passingMarks: "Passing Marks",
    totalMarks: "Total Marks",
    publish: "Publish",
    announcements: "Announcements",
    broadcast: "Broadcast",
    read: "Read",
    unread: "Unread",
    activityLog: "Activity Log",
    switchLang: "ગુજરાતી",
    weakStudents: "Students Needing Support",
    topStudents: "Top Performing Students",
    todaySnapshot: "Today's Attendance Snapshot",
    enterMarks: "Enter Student Marks",
    gradeHomework: "Grade Assignment",
    takeTest: "Take Test",
    question: "Question",
    selectedAnswers: "Selected Answers",
    welcome: "Welcome back",
    score: "Score",
    settings: "Settings & Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    passwordChanged: "Password changed successfully"
  },
  gu: {
    appName: "સ્માર્ટ વિદ્યાર્થી સંચાલન અને હાજરી પદ્ધતિ",
    login: "લોગિન",
    register: "વિદ્યાર્થી નોંધણી",
    username: "વપરાશકર્તા નામ",
    password: "પાસવર્ડ",
    role: "ભૂમિકા",
    name: "પૂરું નામ",
    email: "ઇમેઇલ સરનામું",
    phone: "ફોન નંબર",
    rollNumber: "રોલ નંબર",
    village: "ગામ",
    class: "ધોરણ/વર્ગ",
    guardianName: "વાલીનું નામ",
    guardianPhone: "વાલીનો ફોન નંબર",
    attendance: "હાજરી",
    exams: "પરીક્ષાઓ અને પરિણામ",
    homework: "ગૃહકાર્ય અને નોટ્સ",
    messages: "સંદેશા",
    dashboard: "ડેશબોર્ડ",
    adminPanel: "એડમિન પેનલ",
    teachers: "શિક્ષકો",
    students: "વિદ્યાર્થીઓ",
    villages: "ગામો",
    classes: "વર્ગો",
    auditLogs: "ઓડિટ લૉગ્સ",
    logout: "લોગઆઉટ",
    present: "હાજર",
    absent: "ગેરહાજર",
    date: "તારીખ",
    totalStudents: "કુલ વિદ્યાર્થીઓ",
    totalTeachers: "કુલ શિક્ષકો",
    overallAttendance: "કુલ હાજરી દર",
    submit: "સબમિટ કરો",
    cancel: "રદ કરો",
    actions: "ક્રિયાઓ",
    add: "નવું ઉમેરો",
    edit: "ફેરફાર કરો",
    delete: "કાઢી નાખો",
    save: "સાચવો",
    title: "શીર્ષક",
    description: "વર્ણન",
    subject: "વિષય",
    dueDate: "અંતિમ તારીખ",
    file: "જોડાણ / પીડીએફ",
    graded: "ચકાસાયેલ",
    pending: "બાકી",
    submitted: "સબમિટ કરેલ",
    mark: "હાજરી પૂરો",
    reports: "અહેવાલો",
    createExam: "પરીક્ષા બનાવો",
    upcoming: "આગામી",
    offline: "ઓફલાઇન",
    online: "ઓનલાઇન",
    result: "પરિણામ",
    marksObtained: "મેળવેલ ગુણ",
    passingMarks: "પાસિંગ ગુણ",
    totalMarks: "કુલ ગુણ",
    publish: "પ્રસિદ્ધ કરો",
    announcements: "જાહેરાતો",
    broadcast: "બ્રોડકાસ્ટ",
    read: "વાંચેલું",
    unread: "ન વંચાયેલું",
    activityLog: "પ્રવૃત્તિ લૉગ",
    switchLang: "English",
    weakStudents: "મદદની જરૂરિયાત વાળા વિદ્યાર્થીઓ",
    topStudents: "ઉત્કૃષ્ટ દેખાવ કરનાર વિદ્યાર્થીઓ",
    todaySnapshot: "આજની હાજરીનો અહેવાલ",
    enterMarks: "વિદ્યાર્થીના ગુણ દાખલ કરો",
    gradeHomework: "ગૃહકાર્ય ચકાસો",
    takeTest: "પરીક્ષા આપો",
    question: "પ્રશ્ન",
    selectedAnswers: "પસંદ કરેલા જવાબો",
    welcome: "સુસ્વાગતમ",
    score: "ગુણ",
    settings: "સેટિંગ્સ અને પાસવર્ડ",
    currentPassword: "વર્તમાન પાસવર્ડ",
    newPassword: "નવો પાસવર્ડ",
    passwordChanged: "પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Default language is 'gu' (Gujarati) as per briefing, fall back to 'en'
  const [lang, setLang] = useState(user?.languagePreference || 'gu');

  useEffect(() => {
    if (user?.languagePreference) {
      setLang(user.languagePreference);
    }
  }, [user]);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'gu' : 'en';
    setLang(nextLang);
    if (user) {
      dispatch(updateLanguage(nextLang));
    }
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
