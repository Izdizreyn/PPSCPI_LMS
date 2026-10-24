import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import "./PurpleBot.css";

const CATEGORIES = {
  id_photo: "2x2 ID Photo",
  birth_certificate: "Birth Certificate",
  report_card: "Report Card",
  form_137: "Form 137",
  good_morale: "Certificate of Good Morale",
  certificate_of_enrollment: "Certificate of Enrollment",
  transcript: "Transcript of Records",
  other: "Other Document",
};

const QUESTION_CATEGORIES = [
  {
    title: "Student Information and Account",
    questions: [
      "What is my student ID?",
      "What is my full name?",
      "What year level am I in?",
      "What section am I assigned to?",
      "What information is registered in my account?",
      "How can I update my personal information?",
      "Who should I contact if my information is incorrect?",
    ],
  },
  {
    title: "Student Documents and Requirements",
    questions: [
      "What documents have I submitted?",
      "Are all my documents complete?",
      "Can I replace an uploaded document?",
      "Can I download my submitted documents?",
      "Where can I get help with my documents?",
    ],
  },
  {
    title: "Tuition Fees, Payments, and Balances",
    questions: [
      "How much is my total fee?",
      "What is my remaining balance?",
      "How much have I paid so far?",
      "What payments have I made?",
      "When did I make my last payment?",
      "Where can I view my payments?",
      "Do I have any outstanding balance?",
      "Where can I pay my tuition fees?",
      "Can I get a copy of my payment record?",
    ],
  },
  {
    title: "School Policies and Student Requirements",
    questions: [
      "What are the school's office hours?",
      "Where is the registrar's office?",
      "How can I contact the registrar?",
      "How can I contact the cashier?",
      "Where can I find school announcements?",
      "What should I do if I lose my student ID?",
      "How do I request a certificate of enrollment?",
      "How do I request my transcript of records?",
      "How do I request a good moral certificate?",
      "What should I do if I find an error in my academic records?",
      "Can I change my personal information?",
      "What should I do if my account is not working?",
      "How do I change my password?",
    ],
  },
  {
    title: "Student Dashboard and System Navigation",
    questions: [
      "What can I do in my Student Dashboard?",
      "Where can I view my profile?",
      "Where can I view my documents?",
      "Where can I view my grades?",
      "Where can I view my balance?",
      "How do I log out?",
      "What should I do if I cannot log in?",
    ],
  },
  {
    title: "General Questions and Help",
    questions: [
      "Hi",
      "Hello",
      "Thank you",
      "Thanks",
      "Help me",
      "What can you do?",
      "I don't understand",
      "I have a problem with my account",
      "I want to talk to the registrar",
      "I want to talk to a real person",
      "Random or unrecognized question",
    ],
  },
];

const clean = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const listOrNone = (items) => (items.length ? items.join(", ") : "none recorded");
const peso = (value) =>
  `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function answerQuestion(question, data) {
  const text = clean(question);
  const profile = data.profile || {};
  const uploaded = data.documents || [];
  const enrollment = profile.enrollment_documents || [];
  const recordedDocuments = [
    ...new Map(
      [...enrollment, ...uploaded].map((document) => [
        document.category,
        CATEGORIES[document.category] || document.label || "Other Document",
      ]),
    ).values(),
  ];
  const required = profile.required_documents || [];
  const recordedCategories = new Set([
    ...enrollment.map((document) => document.category),
    ...uploaded.map((document) => document.category),
  ]);
  const missing = required
    .filter((document) => !recordedCategories.has(document.category))
    .map((document) => document.label);
  const amountBalance = data.balance?.balance;
  const transactions = data.balance?.transactions || [];

  if (
    data.profileLoadFailed &&
    /student id|learner reference|lrn|full name|registered name|what is my name|who am i|year level|what grade|which grade|room|section|classroom/.test(text)
  ) {
    return "I couldn't load your profile records. Please retry the data check or contact the registrar.";
  }
  if (
    (data.profileLoadFailed || data.documentsLoadFailed) &&
    /submitted|missing|complete|required|document|birth certificate|report card|good moral/.test(text)
  ) {
    return "I couldn't load all of your document records. Please retry the data check or open Documents in your student portal.";
  }
  if (
    data.balanceLoadFailed &&
    /fee|balance|paid|payment|receipt|statement of account|soa|outstanding/.test(text)
  ) {
    return "I couldn't load your financial records. Please retry the data check or contact the cashier.";
  }

  if (/student id|learner reference|lrn/.test(text)) {
    return profile.lrn
      ? `Your LRN is ${profile.lrn}.`
      : "Your LRN is not available in your profile records.";
  }
  if (/full name|registered name|what is my name|who am i/.test(text)) {
    return profile.full_name
      ? `Your registered full name is ${profile.full_name}.`
      : "Your full name is not available in your profile records.";
  }
  if (/year level|what grade|which grade/.test(text)) {
    return profile.year_level
      ? `Your current year level is ${profile.year_level}.`
      : "Your year level is not available in your enrollment information.";
  }
  if (/room|section|classroom|asa ko|ano room|where is my class/.test(text)) {
    return profile.room
      ? `Your assigned section is ${profile.room}.`
      : "Your section is not currently recorded in your enrollment information.";
  }
  if (/what information|registered in my account|view my profile/.test(text)) {
    return "You can review your registered information in the Student Profile section of your dashboard.";
  }
  if (/update my personal|change my personal|edit my profile/.test(text)) {
    return "You can update your personal information using Edit Profile in your Student Dashboard.";
  }
  if (/information is incorrect|incorrect information|correct my information/.test(text)) {
    return "Please contact the registrar to request verification or correction of your student information.";
  }
  if (/what documents.*submitted|documents have i submitted|submitted documents/.test(text)) {
    return `Your recorded submitted documents are: ${listOrNone(recordedDocuments)}.`;
  }
  if (/documents complete|all my documents|document.*complete/.test(text)) {
    return required.length
      ? missing.length
        ? `Your records show these required categories are not recorded as submitted: ${listOrNone(missing)}.`
        : "All document categories configured for your enrollment are recorded as submitted."
      : "I can't verify document completeness because required document categories are not available in your enrollment record.";
  }
  if (/replace.*document|replace.*uploaded/.test(text)) {
    return "Open Upload Documents to upload a replacement under the same document category.";
  }
  if (/download.*documents|download.*submitted/.test(text)) {
    return uploaded.length
      ? "Yes. Open Upload Documents, click the uploaded document, then save it to your device."
      : "No uploaded documents are currently recorded in your account.";
  }
  if (/help.*documents|help.*document/.test(text)) {
    return "Please contact the registrar for help with your documents.";
  }
  if (/total tuition|total fee|total fees|how much.*fees/.test(text)) {
    return "You can view and download your total fees in your Statement of Account.";
  }
  if (/remaining balance|balance pa|how much.*balance/.test(text)) {
    return "You can view and download your remaining balance in your Statement of Account.";
  }
  if (/how much.*paid|total paid|payments total/.test(text)) {
    return "You can view and download your payment total in your Statement of Account.";
  }
  if (/payments have i made|payment history|payment.*history|what payments/.test(text)) {
    return "You can view and download your payment history in your Statement of Account.";
  }
  if (/last payment|when did i make|when was my last payment/.test(text)) {
    return "You can view and download your payment dates in your Statement of Account.";
  }
  if (/where.*view.*payments|where can i pay|where.*pay.*tuition/.test(text)) {
    return "You can view and download your payment information in your Statement of Account. For payment instructions, visit or message the cashier.";
  }
  if (/do i have.*balance|any balance|outstanding balance/.test(text)) {
    return "You can check whether you have an outstanding balance in your Statement of Account.";
  }
  if (/copy|receipt|payment record/.test(text)) {
    return "You can view and download a copy of your financial record in your Statement of Account.";
  }
  if (/office hours/.test(text)) {
    return "The school office hours are 9:00 AM to 11:00 AM and 1:00 PM to 4:00 PM.";
  }
  if (/where.*registrar|registrar.*office/.test(text)) {
    return "The Registrar's Office is in Building One, near the Principal's Office.";
  }
  if (/contact.*registrar|talk to the registrar/.test(text)) {
    return "Send a message through the Student Chat Portal to contact the registrar.";
  }
  if (/contact.*cashier|talk to the cashier/.test(text)) {
    return "Send a message through the Student Chat Portal to contact the cashier.";
  }
  if (/announcements|school announcement|academic announcement/.test(text)) {
    return "School announcements are shared through the Student Chat Portal.";
  }
  if (/lose.*student id|lost.*school id/.test(text)) {
    return "Request a replacement at the Safety Office, then pay the fee at the Cashier.";
  }
  if (/certificate of enrollment/.test(text)) {
    return "Submit your request through Request Document in the student portal.";
  }
  if (/transcript|good moral certificate/.test(text)) {
    return "Submit your request through Request Document in the student portal.";
  }
  if (/find an error|error in my academic|incorrect.*record/.test(text)) {
    return "Send a message directly through the Student Chat Portal to report an error in your record.";
  }
  if (/can i change my personal|change my personal information/.test(text)) {
    return "Yes. Use Edit Profile in your Student Dashboard to update your personal information.";
  }
  if (/account is not working|account not working|problem with my account|account issue/.test(text)) {
    return "Please visit the school office for assistance with your account.";
  }
  if (/change my password|change password/.test(text)) {
    return "Use the Change Password button in the student sidebar.";
  }

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/.test(text)) {
    return "Hello! I'm PURPLEBOT, your PPSCPI Student Assistant. What would you like to know about your student records, documents, or payments?";
  }
  if (/thank you|thanks/.test(text)) {
    return "You're welcome! Feel free to ask if you need help with your student records.";
  }
  if (/\b(help|what can you do)\b/.test(text)) {
    return "I can help you check your profile, classroom assignment, recorded documents, and available financial records, or guide you around the student portal.";
  }
  if (/what documents are still|required documents/.test(text)) {
    return required.length
      ? `The document categories configured for your enrollment are: ${listOrNone(required.map((document) => document.label))}.`
      : "Required document categories are not available for your enrollment record. Please contact the registrar.";
  }
  if (/documents.*missing|documents.*kulang|what documents.*required/.test(text)) {
    return required.length
      ? `Based on the document categories configured for your enrollment, these are not recorded as submitted: ${listOrNone(missing)}.`
      : "Required document categories are not available for your enrollment record. Please contact the registrar to confirm your requirements.";
  }
  if (/documents complete|all my documents|document.*complete/.test(text)) {
    return required.length
      ? missing.length
        ? `Your records show these required categories are not recorded as submitted: ${listOrNone(missing)}.`
        : "All document categories configured for your enrollment are recorded as submitted."
      : "I can't verify document completeness because required document categories are not available in your enrollment record.";
  }
  if (/see my submitted documents|view my documents/.test(text)) {
    return "Open the Documents section of your Student Dashboard to view your recorded submissions.";
  }
  if (/where.*upload|upload a document/.test(text)) {
    return "Open Documents in the student sidebar and use the upload form. The portal accepts PDF, JPEG, and PNG files up to 10 MB.";
  }
  if (/replace.*document|replace.*uploaded/.test(text)) {
    return "Open Documents and upload the replacement under the same document category. The portal replaces the previous file in that category.";
  }
  if (/document status|status of my submitted documents/.test(text)) {
    return uploaded.length
      ? `These files are recorded as uploaded: ${listOrNone(uploaded.map((document) => `${CATEGORIES[document.category] || "Document"} (${document.uploaded_at || "date not recorded"})`))}. The portal does not show a separate verification status for these files.`
      : "No uploaded document records were found. Enrollment documents may appear separately in the Documents section.";
  }
  if (/when did i submit|submission dates/.test(text)) {
    const datedDocuments = uploaded.filter((document) => document.uploaded_at);
    return datedDocuments.length
      ? `Recorded upload dates: ${datedDocuments.map((document) => `${CATEGORIES[document.category] || "Document"} — ${document.uploaded_at}`).join("; ")}.`
      : "No upload dates are available in your recorded document submissions.";
  }
  if (/why.*document.*incomplete|document.*marked.*incomplete/.test(text)) {
    return "The portal does not provide a detailed issue reason for document records here. Check the Documents section or contact the registrar for review.";
  }
  if (/birth certificate/.test(text)) {
    return recordedCategories.has("birth_certificate")
      ? "A Birth Certificate is recorded as submitted in your account."
      : "I don't see a Birth Certificate recorded as submitted in your account. Check your configured requirements or contact the registrar.";
  }
  if (/report card/.test(text)) {
    return recordedCategories.has("report_card")
      ? "A Report Card is recorded as submitted in your account."
      : "I don't see a Report Card recorded as submitted in your account. Check your configured requirements or contact the registrar.";
  }
  if (/good moral/.test(text)) {
    return recordedCategories.has("good_morale")
      ? "A Certificate of Good Morale is recorded as submitted in your account."
      : "I don't see a Certificate of Good Morale recorded as submitted in your account. Check your configured requirements or contact the registrar.";
  }
  if (/download.*documents|download.*submitted/.test(text)) {
    return uploaded.length
      ? "Your uploaded documents can be opened from the Documents section when the file is available."
      : "No uploaded documents are currently recorded in your account.";
  }
  if (/help.*documents|help.*document/.test(text)) {
    return "Please contact the registrar for help with missing, incorrect, or unverified document records.";
  }
  if (/total tuition|total fees|how much.*fees/.test(text)) {
    return amountBalance
      ? `Your recorded total fees are ${peso(amountBalance.total_fees)}.`
      : "No financial record is currently available for your account. Please contact the cashier to verify.";
  }
  if (/remaining balance|balance pa|how much.*balance/.test(text)) {
    if (!amountBalance) return "No financial record is currently available for your account. Please contact the cashier to verify.";
    return `Your recorded remaining balance is ${peso(amountBalance.remaining_balance)}.`;
  }
  if (/how much.*paid|total paid|payments total/.test(text)) {
    return amountBalance
      ? `Your recorded payments total ${peso(amountBalance.paid_amount)}.`
      : "No financial record is currently available for your account. Please contact the cashier to verify.";
  }
  if (/do i have.*balance|any balance|outstanding balance/.test(text)) {
    if (!amountBalance) return "No financial record is currently available for your account. Please contact the cashier to verify.";
    return Number(amountBalance.remaining_balance) > 0
      ? `You have a recorded outstanding balance of ${peso(amountBalance.remaining_balance)}.`
      : "Your recorded remaining balance is ₱0.00.";
  }
  if (/payments have i made|payment history|payment.*history/.test(text)) {
    return transactions.length
      ? `Your recorded payment history: ${transactions.map((payment) => `${peso(payment.amount)} on ${payment.payment_date}`).join("; ")}.`
      : "No payment transactions are currently recorded for your account.";
  }
  if (/last payment|most recent payment/.test(text)) {
    return transactions.length
      ? `Your most recent recorded payment was ${peso(transactions[0].amount)} on ${transactions[0].payment_date}.`
      : "No payment transactions are currently recorded for your account.";
  }
  if (/where can i pay|where.*pay.*tuition/.test(text)) {
    return "Please consult the cashier for the school's authorized payment methods and instructions.";
  }
  if (/receipt/.test(text)) {
    return "Please contact the cashier to confirm receipt availability for your payment.";
  }
  if (/balance.*incorrect|incorrect.*balance|discrepancy/.test(text)) {
    return "Please contact the cashier to verify your financial records and resolve any discrepancies.";
  }
  if (/statement of account|soa|view my balance/.test(text)) {
    return "Open View Statement of Account from your Student Dashboard to review your financial record.";
  }
  if (/office hours/.test(text)) {
    return "Please check the school's official announcements or contact the school office to confirm current office hours.";
  }
  if (/where.*registrar|registrar.*office/.test(text)) {
    return "Please contact the school office for the registrar's current location.";
  }
  if (/contact.*registrar|talk to the registrar/.test(text)) {
    return "Please contact or visit the registrar's office for assistance with student records and documents.";
  }
  if (/contact.*cashier|talk to the cashier/.test(text)) {
    return "Please contact or visit the cashier's office for assistance with payments and balances.";
  }
  if (/announcements|handbook/.test(text)) {
    return "I can't confirm that announcements or a handbook are available in this portal. Please check with the appropriate school office.";
  }
  if (/lose.*student id/.test(text)) {
    return "Contact the appropriate school office to ask about student ID replacement procedures.";
  }
  if (/certificate of enrollment/.test(text)) {
    return "Open Request Document in the student portal or contact the registrar to confirm any requirements and fees.";
  }
  if (/transcript|good moral certificate/.test(text)) {
    return "Contact the registrar to confirm the official request procedure, requirements, and any applicable fees.";
  }
  if (/student dashboard|what can i do/.test(text)) {
    return "Your Student Dashboard provides access to your profile, documents, grades, room chat, document requests, and available financial records.";
  }
  if (/view.*profile/.test(text)) {
    return "Open Student Profile from your dashboard.";
  }
  if (/view.*documents/.test(text)) {
    return "Open the Documents section from your student sidebar.";
  }
  if (/class schedule|my sched|schedule/.test(text)) {
    return "A class schedule is not currently available in the student portal. Contact your school office for schedule information.";
  }
  if (/where.*grades|view.*grades|my grades/.test(text)) {
    return "Open My Grades from your student sidebar. Only grades released by the school are shown there.";
  }
  if (/where.*balance|view.*balance/.test(text)) {
    return "Open View Statement of Account from your Student Dashboard.";
  }
  if (/log out|logout/.test(text)) {
    return "Click Logout at the bottom of the student sidebar to end your session.";
  }
  if (/cannot log in|cant log in|login problem|account not working|password/.test(text)) {
    return "Check your login credentials first. For password changes, use Change Password in the student sidebar. If the issue continues, contact the system administrator.";
  }
  if (/cannot see.*schedule|cant see.*schedule/.test(text)) {
    return "A schedule may not be available or assigned in the portal. Contact your school office if you need help.";
  }
  if (/cannot see.*documents|cant see.*documents/.test(text)) {
    return "Check the Documents section in your student sidebar. Contact the registrar if your records appear to be missing.";
  }
  if (/real person|talk to/.test(text)) {
    return "Please contact the appropriate school office for assistance. PURPLEBOT provides recorded information and cannot replace school personnel.";
  }
  if (/problem with my account|account issue/.test(text)) {
    return "Please describe the issue to the system administrator or the appropriate school office, especially if it concerns account access or incorrect records.";
  }
  if (/i dont understand|dont understand/.test(text)) {
    return 'Could you rephrase your question? Try asking "What room am I assigned to?" or "What documents have I submitted?"';
  }
  return "I'm sorry, I couldn't identify what you're looking for. Try asking about your profile, room, documents, grades, or payments.";
}

function getMessageAction(question, user) {
  const text = clean(question);
  if (/replace.*document|replace.*uploaded|download.*documents|download.*submitted/.test(text)) {
    return { label: "Open Upload Documents", path: "/student/documents" };
  }
  if (
    /fee|balance|paid|payment|receipt|financial record|statement of account|soa/.test(
      text,
    ) &&
    user?.lrn
  ) {
    return {
      label: "Open Statement of Account",
      path: `/admin/print-balance?lrn=${encodeURIComponent(user.lrn)}`,
    };
  }
  return null;
}

function BotIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      width="34"
      height="34"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M190.1 379.1C190.1 405 168.9 426.2 143 426.2C117.1 426.2 96 405 96 379.1C96 353.2 117.2 332 143.1 332L190.2 332L190.2 379.1zM213.8 379.1C213.8 353.2 235 332 260.9 332C286.8 332 308 353.2 308 379.1L308 496.9C308 522.8 286.8 544 260.9 544C235 544 213.8 522.8 213.8 496.9L213.8 379.1zM260.9 190.1C235 190.1 213.8 168.9 213.8 143C213.8 117.1 235 96 260.9 96C286.8 96 308 117.2 308 143.1L308 190.2L260.9 190.2zM260.9 213.8C286.8 213.8 308 235 308 260.9C308 286.8 286.8 308 260.9 308L143.1 308C117.2 308 96 286.8 96 260.9C96 235 117.2 213.8 143.1 213.8L260.9 213.8zM449.9 260.9C449.9 235 471.1 213.8 497 213.8C522.9 213.8 544 235 544 260.9C544 286.8 522.8 308 496.9 308L449.8 308L449.8 260.9zM426.2 260.9C426.2 286.8 405 308 379.1 308C353.2 308 332 286.8 332 260.9L332 143.1C332 117.2 353.2 96 379.1 96C405 96 426.2 117.2 426.2 143.1L426.2 260.9zM379.1 449.9C405 449.9 426.2 471.1 426.2 497C426.2 522.9 405 544 379.1 544C353.2 544 332 522.8 332 496.9L332 449.8L379.1 449.8zM379.1 426.2C353.2 426.2 332 405 332 379.1C332 353.2 353.2 332 379.1 332L496.9 332C522.8 332 544 353.2 544 379.1C544 405 522.8 426.2 496.9 426.2L379.1 426.2z" />
    </svg>
  );
}

export default function PurpleBot() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTarget, setTypingTarget] = useState("");
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState({
    profile: null,
    documents: [],
    balance: null,
    profileLoadFailed: false,
    documentsLoadFailed: false,
    balanceLoadFailed: false,
  });
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! I'm PURPLEBOT, your PPSCPI Student Assistant. Ask me about your profile, classroom assignment, documents, or payments.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questionOptionsVisible, setQuestionOptionsVisible] = useState(true);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading, selectedCategory]);

  useEffect(() => {
    if (!typingTarget) return undefined;
    let visibleCharacters = 0;
    const interval = window.setInterval(() => {
      visibleCharacters = Math.min(visibleCharacters + 2, typingTarget.length);
      setMessages((previous) => {
        const latest = [...previous];
        const lastIndex = latest.length - 1;
        latest[lastIndex] = {
          ...latest[lastIndex],
          text: typingTarget.slice(0, visibleCharacters),
        };
        return latest;
      });

      if (visibleCharacters >= typingTarget.length) {
        window.clearInterval(interval);
        setTypingTarget("");
        setIsTyping(false);
      }
    }, 20);
    return () => window.clearInterval(interval);
  }, [typingTarget]);

  if (user?.role !== "purple_student") return null;

  const loadStudentData = async () => {
    if (loading) return;
    setLoading(true);
    setLoadError("");
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResult, documentsResult, balanceResult] = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/students/my-profile.php`, { headers }),
      axios.get(`${API_BASE_URL}/students/my-documents.php`, { headers }),
      axios.get(`${API_BASE_URL}/students/my-balance.php`, { headers }),
    ]);

    if ([profileResult, documentsResult, balanceResult].some(
      (result) => result.status === "rejected" && result.reason.response?.status === 401,
    )) {
      logout();
      setLoading(false);
      return;
    }

    setData((previous) => ({
      profile:
        profileResult.status === "fulfilled"
          ? profileResult.value.data.profile
          : previous.profile,
      documents:
        documentsResult.status === "fulfilled"
          ? documentsResult.value.data.documents || []
          : previous.documents,
      balance:
        balanceResult.status === "fulfilled"
          ? balanceResult.value.data
          : previous.balance,
      profileLoadFailed: profileResult.status === "rejected",
      documentsLoadFailed: documentsResult.status === "rejected",
      balanceLoadFailed: balanceResult.status === "rejected",
    }));

    const failed = [
      profileResult,
      documentsResult,
      balanceResult,
    ].some((result) => result.status === "rejected");
    if (failed) {
      setLoadError("Some student records could not be loaded. Answers may be incomplete; please retry.");
    }
    setLoading(false);
  };

  const handleOpen = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && !loading) loadStudentData();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const submitted = question.trim();
    if (!submitted || isTyping) return;
    const answer = answerQuestion(submitted, data);
    setMessages((previous) => [
      ...previous,
      { from: "student", text: submitted },
      { from: "bot", text: "", action: getMessageAction(submitted, user) },
    ]);
    setQuestionOptionsVisible(false);
    setIsTyping(true);
    setTypingTarget(answer);
    setQuestion("");
  };

  const handleQuestionClick = (selectedQuestion) => {
    if (isTyping) return;
    const actualQuestion =
      selectedQuestion === "Random or unrecognized question"
        ? "Random or unrecognized question"
        : selectedQuestion;
    const displayedQuestion =
      selectedQuestion === "Random or unrecognized question"
        ? "I have another question."
        : selectedQuestion;
    setMessages((previous) => [
      ...previous,
      { from: "student", text: displayedQuestion },
      {
        from: "bot",
        text: "",
        action: getMessageAction(actualQuestion, user),
      },
    ]);
    setQuestionOptionsVisible(false);
    setIsTyping(true);
    setTypingTarget(answerQuestion(actualQuestion, data));
  };

  const activeCategory = QUESTION_CATEGORIES.find(
    (category) => category.title === selectedCategory,
  );

  return (
    <div className="purplebot">
      {open && (
        <section className="purplebot-panel" aria-label="PURPLEBOT chat">
          <header className="purplebot-header">
            <div>
              <strong>PURPLEBOT</strong>
              <span>PPSCPI Student Assistant</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close PURPLEBOT">
              ×
            </button>
          </header>
          {loadError && (
            <div className="purplebot-error" role="alert">
              {loadError}
              <button type="button" onClick={loadStudentData} disabled={loading}>
                Retry
              </button>
            </div>
          )}
          <div className="purplebot-messages" aria-live="polite" ref={messagesRef}>
            {messages.map((message, index) => {
              if (message.from === "bot" && !message.text && isTyping) return null;
              return (
                <div
                  className={`purplebot-message-group ${message.from}`}
                  key={`${index}-${message.from}`}
                >
                  <p className={`purplebot-message ${message.from}`}>
                    {message.text}
                  </p>
                  {message.action && message.text && !isTyping && (
                    <button
                      className="purplebot-message-action"
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(message.action.path);
                      }}
                    >
                      {message.action.label}
                    </button>
                  )}
                </div>
              );
            })}
            {loading && <p className="purplebot-loading">Checking your local student records…</p>}
            {isTyping && (
              <div className="purplebot-typing" role="status" aria-label="PURPLEBOT is typing">
                <span />
                <span />
                <span />
              </div>
            )}
            {questionOptionsVisible && (!selectedCategory ? (
              <div className="purplebot-options" aria-label="Question categories">
                <p>Choose a topic to see common questions:</p>
                {QUESTION_CATEGORIES.map((category) => (
                  <button
                    type="button"
                    key={category.title}
                    onClick={() => {
                      setSelectedCategory(category.title);
                      setQuestionOptionsVisible(true);
                    }}
                    disabled={loading || isTyping}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="purplebot-options" aria-label={`${selectedCategory} questions`}>
                <button
                  className="purplebot-back"
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setQuestionOptionsVisible(true);
                  }}
                  disabled={isTyping}
                >
                  ← All topics
                </button>
                <p>{selectedCategory}</p>
                {activeCategory?.questions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => handleQuestionClick(item)}
                    disabled={loading || isTyping}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {!questionOptionsVisible && (
            <button
              className="purplebot-ask-another"
              type="button"
              onClick={() => setQuestionOptionsVisible(true)}
              disabled={isTyping || loading}
            >
              Ask another question
            </button>
          )}
          <form className="purplebot-form" onSubmit={handleSubmit}>
            <label className="purplebot-sr-only" htmlFor="purplebot-question">
              Ask PURPLEBOT a question
            </label>
            <input
              id="purplebot-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={loading ? "Checking your records..." : "Ask a question..."}
              autoComplete="off"
              disabled={loading || isTyping}
            />
            <button type="submit" disabled={!question.trim() || isTyping || loading} aria-label="Send question">
              Send
            </button>
          </form>
        </section>
      )}
      <button
        className="purplebot-launcher"
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-label={open ? "Close PURPLEBOT" : "Open PURPLEBOT"}
      >
        <BotIcon />
        <span>PURPLEBOT</span>
      </button>
    </div>
  );
}
