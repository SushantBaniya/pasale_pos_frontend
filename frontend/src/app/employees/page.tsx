import { useState, useEffect, useCallback } from "react";
import {
  FiUsers, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiEye,
  FiCalendar, FiChevronDown, FiBriefcase, FiMail, FiPhone,
  FiDollarSign, FiClock, FiGrid, FiList, FiTrendingUp,
  FiTrendingDown, FiActivity, FiBriefcase as FiWork, FiInfo
} from "react-icons/fi";

const API_BASE = "http://localhost:8000/api";

const getBusinessId = () => {
  if (typeof window === "undefined") return 1;
  return Number(localStorage.getItem("business_id")) || 1;
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  const directToken = localStorage.getItem("auth_token");
  if (directToken) return directToken;
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) return accessToken;
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    try { return JSON.parse(authStorage).state?.accessToken || null; } catch {}
  }
  return null;
};

const api = {
  getEmployees: () =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employees"; }
      return r.json();
    }),
  getEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employee"; }
      return r.json();
    }),
  createEmployee: (data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  updateEmployee: (id, data) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  deleteEmployee: (id) =>
    fetch(`${API_BASE}/employee/b${getBusinessId()}/e${id}/`, { method: "DELETE" }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Delete failed"; }
      return r.json();
    }),
  getShifts: (employeeId) =>
    fetch(`${API_BASE}/scheduler/b${getBusinessId()}/${employeeId ? `?employee_id=${employeeId}` : ""}`).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    }),
  runScheduler: (payload) =>
    fetch(`${API_BASE}/scheduler/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, business_id: getBusinessId() }),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  getDepartments: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/departments/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch departments"; }
      return r.json();
    });
  },
  createDepartment: (name) =>
    fetch(`${API_BASE}/departments/b${getBusinessId()}/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    }).then(async (r) => { const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res; }),
  getUnscheduledShifts: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/scheduler/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    });
  },
  runWSMScheduler: (payload) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_BASE}/scheduler/schedule/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        business_id: getBusinessId(),
        ...payload,
      }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    });
  },
  manualAssign: (shiftId, employeeId) => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
    };
    return fetch(`${API_BASE}/scheduler/shift/${shiftId}/assign/`, {
      method: "POST",
      headers,
      body: JSON.stringify({ employee_id: employeeId }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    });
  },
  deleteShift: (id) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/s${id}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to delete shift"; }
      return r.json();
    });
  },
  getSkills: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch skills"; }
      return r.json();
    });
  },
  createSkill: (data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  updateSkill: (id, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/s${id}/`, { method: "PUT", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  deleteSkill: (id) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/skills/b${getBusinessId()}/s${id}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to delete skill"; }
      return r.json();
    });
  },
  getEmployeeSkills: (employeeId) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch employee skills"; }
      return r.json();
    });
  },
  assignEmployeeSkill: (employeeId, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  removeEmployeeSkill: (employeeId, skillId) => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/employee-skills/b${getBusinessId()}/e${employeeId}/s${skillId}/`, { method: "DELETE", headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to remove employee skill"; }
      return r.json();
    });
  },
  getShiftsCRUD: () => {
    const token = getToken();
    const headers = token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/`, { headers }).then(async (r) => {
      if (!r.ok) { const err = await r.json().catch(() => ({})); throw err.error || "Failed to fetch shifts"; }
      return r.json();
    });
  },
  createShift: (data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/`, { method: "POST", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  updateShift: (id, data) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/s${id}/`, { method: "PUT", headers, body: JSON.stringify(data) }).then(async (r) => {
      const res = await r.json().catch(() => ({})); if (!r.ok) throw res; return res;
    });
  },
  unassignShift: (id) => {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}) };
    return fetch(`${API_BASE}/shifts/b${getBusinessId()}/s${id}/`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ assigned_employee: null, is_scheduled: false }),
    }).then(async (r) => {
      const res = await r.json().catch(() => ({}));
      if (!r.ok) throw res;
      return res;
    });
  },
};

const MOCK_EMPLOYEES = [
  {
    id: 1,
    name: "Ramesh Sharma",
    email: "ramesh@pasale.com",
    phone_no: "+977-9841234567",
    position: "Store Manager",
    salary: "45000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2023-01-15",
  },
  {
    id: 2,
    name: "Sita Thapa",
    email: "sita@pasale.com",
    phone_no: "+977-9851234567",
    position: "Sales Associate",
    salary: "28000",
    status: { name: "Active" },
    department: "Sales",
    join_date: "2023-03-20",
  },
  {
    id: 3,
    name: "Aarav Shrestha",
    email: "aarav@pasale.com",
    phone_no: "+977-9861234567",
    position: "Inventory Officer",
    salary: "25000",
    status: { name: "Active" },
    department: "Inventory",
    join_date: "2023-06-01",
  },
  {
    id: 4,
    name: "Bikram Karki",
    email: "bikram@pasale.com",
    phone_no: "+977-9871234567",
    position: "Cashier",
    salary: "22000",
    status: { name: "On Leave" },
    department: "Finance",
    join_date: "2022-11-10",
  },
  {
    id: 5,
    name: "Sunita Rai",
    email: "sunita@pasale.com",
    phone_no: "+977-9881234567",
    position: "Shift Supervisor",
    salary: "35000",
    status: { name: "Active" },
    department: "Operations",
    join_date: "2022-07-05",
  },
  {
    id: 6,
    name: "Dipendra Lama",
    email: "dipendra@pasale.com",
    phone_no: "+977-9811234567",
    position: "Sales Associate",
    salary: "27000",
    status: { name: "Active" },
    department: "Sales",
    join_date: "2024-02-12",
  },
  {
    id: 7,
    name: "Maya Gurung",
    email: "maya@pasale.com",
    phone_no: "+977-9821234567",
    position: "Inventory Assistant",
    salary: "24000",
    status: { name: "Active" },
    department: "Inventory",
    join_date: "2023-09-18",
  },
];

const DEPT_COLORS = {
  Operations: { bg: "#eff6ff", text: "#1e3a8a", dot: "#3b82f6" },
  Sales: { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  Inventory: { bg: "#fefce8", text: "#a16207", dot: "#eab308" },
  Finance: { bg: "#fdf2f8", text: "#9d174d", dot: "#ec4899" },
  HR: { bg: "#f5f3ff", text: "#6d28d9", dot: "#8b5cf6" },
  default: { bg: "#f8fafc", text: "#475569", dot: "#94a3b8" },
};

const STATUS_COLORS = {
  Active: { bg: "#f0fdf4", text: "#16a34a" },
  "On Leave": { bg: "#fffbeb", text: "#d97706" },
  Inactive: { bg: "#fef2f2", text: "#dc2626" },
};

const getInitials = (name: string) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

const AVATAR_COLORS = ["#101B55", "#F2DD50", "#2563EB", "#16A34A", "#EA580C", "#9333EA", "#0891B2", "#E11D48"];
const avatarGrad = (id: number) => AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];

// Custom Toast Component
function Toast({ toasts, remove }: { toasts: any[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-3 rounded-xl flex items-center gap-3 text-[13px] font-medium shadow-lg border animate-in slide-in-from-right duration-250 ${
          t.type === "error" ? "bg-red-50 border-red-200 text-red-800" : t.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-800"
        }`}>
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="background-none border-none cursor-pointer opacity-50 hover:opacity-100 p-0 text-current">
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);
  const add = useCallback((msg: string, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

// Stat Card exactly styled like Inventory Page
const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  iconBg: string; 
  iconColor: string;
}> = ({ label, value, icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
    <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
      {icon}
    </div>
    <div className="text-right">
      <p className="text-[11px] font-bold text-[#94A3B8] dark:text-[#64748B] tracking-wider uppercase mb-1">{label}</p>
      <p className="text-[28px] font-bold text-[#111827] dark:text-[#EAE5DF] leading-none">{value}</p>
    </div>
  </div>
);

// Employee Card Component
function EmployeeCard({ emp, onEdit, onDelete, onView }) {
  const statusName = typeof emp.status === "string" ? emp.status : emp.status?.name || "Active";
  const deptName = typeof emp.department === "string" ? emp.department : emp.department?.name || emp.department;
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  const deptColor = DEPT_COLORS[deptName] || DEPT_COLORS.default;

  return (
    <div className="bg-white dark:bg-[#15161C] rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                 style={{ background: avatarGrad(emp.id) }}>
              {getInitials(emp.name)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-[#EAE5DF]">{emp.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{emp.position}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: statusColor.bg, color: statusColor.text }}>
            {statusName}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-2">
            <FiMail className="text-slate-400" size={13} />
            <span className="truncate">{emp.email}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-2">
            <FiPhone className="text-slate-400" size={13} />
            {emp.phone_no}
          </div>
          {deptName && (
            <div className="mt-2">
              <span className="inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                    style={{ background: deptColor.bg, color: deptColor.text }}>
                <span className="w-1 h-1 rounded-full mr-1.5" style={{ background: deptColor.dot }} />
                {deptName}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-50 dark:border-[#2A2B36] flex shrink-0">
        <button onClick={() => onView(emp)} className="flex-1 py-3 text-xs font-bold text-[#101B55] dark:text-[#F2DD50] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer">View</button>
        <button onClick={() => onEdit(emp)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-l border-r border-slate-50 dark:border-[#2A2B36] bg-transparent cursor-pointer">Edit</button>
        <button onClick={() => onDelete(emp)} className="flex-1 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border-none bg-transparent cursor-pointer">Remove</button>
      </div>
    </div>
  );
}

// Employee Row Component (List view)
function EmployeeRow({ emp, onEdit, onDelete, onView }) {
  const statusName = typeof emp.status === "string" ? emp.status : emp.status?.name || "Active";
  
  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  return (
    <tr className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors group bg-white dark:bg-[#15161C]">
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
               style={{ background: '#101B55' }}>
            {getInitials(emp.name)[0]}
          </div>
          <div className="text-[14px] text-[#111827] dark:text-[#EAE5DF]">{emp.name}</div>
        </div>
      </td>
      <td className="py-4 px-6 text-[13px] text-[#111827] dark:text-[#EAE5DF]">{emp.phone_no}</td>
      <td className="py-4 px-6">
        <span className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-full whitespace-nowrap bg-[#EFF6FF] text-[#3B82F6] dark:bg-[#3B82F6]/20">
          {emp.position || "STAFF"}
        </span>
      </td>
      <td className="py-4 px-6">
        <span className="text-[11px] font-bold uppercase px-3 py-1.5 rounded-full whitespace-nowrap bg-[#F5F3FF] text-[#8B5CF6] dark:bg-[#8B5CF6]/20">
          DAY
        </span>
      </td>
      <td className="py-4 px-6">
        <span className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-full whitespace-nowrap ${
          statusName.toUpperCase() === 'ACTIVE' 
            ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-[#16A34A]/20' 
            : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#334155]'
        }`}>
          {statusName.toUpperCase() === 'ON LEAVE' ? 'ON_LEAVE' : statusName.toUpperCase()}
        </span>
      </td>
      <td className="py-4 px-6 text-[13px] text-[#111827] dark:text-[#EAE5DF]">
        {formatDate(emp.join_date)}
      </td>
      <td className="py-4 px-6 text-right">
        <div className="flex items-center justify-end gap-4">
          <button onClick={() => onView(emp)} className="text-slate-400 hover:text-[#101B55] transition-colors bg-transparent border-none cursor-pointer" title="View">
            <FiEye size={18} />
          </button>
          <button onClick={() => onEdit(emp)} className="text-slate-400 hover:text-[#101B55] transition-colors bg-transparent border-none cursor-pointer" title="Edit">
            <FiEdit2 size={18} />
          </button>
          <button onClick={() => onDelete(emp)} className="text-red-400 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer" title="Delete">
            <FiTrash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Form Field Component
interface FieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (e: any) => void;
  type?: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

function Field({ label, name, value, onChange, type = "text", options, required, placeholder }: FieldProps) {
  const baseClassName = "w-full px-3 py-2.5 rounded-lg text-[13px] border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#1C1D24] outline-none text-[#111827] dark:text-[#EAE5DF] focus:border-[#101B55] placeholder-slate-400";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select name={name} value={value} onChange={onChange} className={baseClassName}>
          <option value="">Select option</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder || label} className={baseClassName} required={required}
        />
      )}
    </div>
  );
}

// Side Drawer for Add / Edit Employee
const EMPTY_FORM = { name: "", email: "", phone_no: "", position: "", salary: "", department: "", status: "Active" };

function EmployeeDrawer({ open, onClose, employee, onSave, loading, options }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [employeeSkills, setEmployeeSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [newSkillForm, setNewSkillForm] = useState({ skill: "", proficiency_level: "Beginner" });
  const [skillsLoading, setSkillsLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone_no: employee.phone_no || "",
        position: employee.position || "",
        salary: employee.salary || "",
        department: typeof employee.department === "string" ? employee.department : employee.department?.name || "",
        status: typeof employee.status === "string" ? employee.status : employee.status?.name || "Active",
      });
    } else {
      setForm(EMPTY_FORM);
      setEmployeeSkills([]);
    }

    if (employee && employee.id && open) {
      setSkillsLoading(true);
      Promise.all([api.getSkills(), api.getEmployeeSkills(employee.id)])
        .then(([resSkills, resEmpSkills]) => {
          setAllSkills(resSkills.data || []);
          setEmployeeSkills(resEmpSkills.data || []);
        })
        .finally(() => setSkillsLoading(false));
    }
  }, [employee, open]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = () => onSave(form);

  const handleAddSkill = async () => {
    if (!newSkillForm.skill) return;
    try {
      await api.assignEmployeeSkill(employee.id, newSkillForm);
      const res = await api.getEmployeeSkills(employee.id);
      setEmployeeSkills(res.data || []);
      setNewSkillForm({ skill: "", proficiency_level: "Beginner" });
    } catch {}
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await api.removeEmployeeSkill(employee.id, skillId);
      const res = await api.getEmployeeSkills(employee.id);
      setEmployeeSkills(res.data || []);
    } catch {}
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#15161C] rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] flex flex-col border border-[#E2E8F0] dark:border-[#2A2B36]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-[#111827] dark:text-[#EAE5DF]">{employee ? "Edit Employee" : "Add Employee"}</div>
            <div className="text-xs text-slate-400 mt-0.5">{employee ? `Updating profile of ${employee.name}` : "Enter details below to create employee"}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-transparent text-slate-400 hover:text-slate-600 transition-colors border-none cursor-pointer">
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Priyanjali Sharma" />
          <Field label="Email Address" name="email" value={form.email} onChange={handleChange} type="email" required placeholder="email@company.com" />
          <Field label="Phone Number" name="phone_no" value={form.phone_no} onChange={handleChange} required placeholder="+977-98XXXXXXXX" />
          <Field label="Position / Title" name="position" value={form.position} onChange={handleChange} required placeholder="e.g. Cashier" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department" name="department" value={form.department} onChange={handleChange}
              options={options?.departments?.length ? options.departments : ["Operations", "Sales", "Inventory", "Finance", "HR"]} />
            <Field label="Salary (NPR)" name="salary" value={form.salary} onChange={handleChange} type="number" placeholder="25000" />
          </div>
          <Field label="Status" name="status" value={form.status} onChange={handleChange} options={["Active", "On Leave", "Inactive"]} />
          
          {employee && employee.id && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2B36]">
              <div className="text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-3">Skills & Proficiency</div>
              {skillsLoading ? (
                <div className="text-xs text-slate-400">Loading skills...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    {employeeSkills.map(es => (
                      <div key={es.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#1C1D24] px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36]">
                        <div>
                          <div className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF]">{es.skill_name}</div>
                          <div className="text-[11px] text-slate-500">{es.proficiency_level}</div>
                        </div>
                        <button onClick={() => handleRemoveSkill(es.skill.id || es.skill)} className="text-red-500 hover:text-red-700 p-1 bg-transparent border-none cursor-pointer">
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                    {employeeSkills.length === 0 && <div className="text-xs text-slate-400">No skills assigned yet.</div>}
                  </div>
                  <div className="flex gap-2">
                    <select value={newSkillForm.skill} onChange={e => setNewSkillForm({...newSkillForm, skill: e.target.value})} className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] text-xs text-[#111827] dark:text-[#EAE5DF]">
                      <option value="">Select skill...</option>
                      {allSkills.filter(s => !employeeSkills.find(es => (es.skill.id || es.skill) === s.id)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select value={newSkillForm.proficiency_level} onChange={e => setNewSkillForm({...newSkillForm, proficiency_level: e.target.value})} className="w-28 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] text-xs text-[#111827] dark:text-[#EAE5DF]">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <button onClick={handleAddSkill} disabled={!newSkillForm.skill} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors border-none cursor-pointer ${newSkillForm.skill ? 'bg-[#101B55] hover:bg-[#1e293b]' : 'bg-slate-300 cursor-not-allowed'}`}>Add</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#1C1D24] text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-2.5 rounded-lg border-none font-bold text-xs text-white transition-colors bg-[#101B55] hover:bg-[#1e293b] cursor-pointer disabled:opacity-50">
            {loading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm Delete Modal
function DeleteModal({ emp, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[300] flex items-center justify-center p-5 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#15161C] rounded-2xl w-[380px] max-w-full p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36]">
        <div className="text-base font-bold text-[#111827] dark:text-[#EAE5DF] mb-2">Remove Employee?</div>
        <div className="text-[13px] text-[#475569] dark:text-[#94A3B8] mb-6">
          This will permanently remove <strong className="text-slate-900 dark:text-white">{emp?.name}</strong> from directory. This action cannot be undone.
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#1C1D24] text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-lg border-none text-xs font-bold text-white transition-colors bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50">
            {loading ? "Removing..." : "Yes, Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Employee Details view Modal
function EmployeeDetail({ emp, onClose, onEdit }) {
  const statusName = typeof emp?.status === "string" ? emp.status : emp?.status?.name || "Active";
  const deptName = typeof emp?.department === "string" ? emp.department : emp?.department?.name || emp?.department;
  const statusColor = STATUS_COLORS[statusName] || STATUS_COLORS.Active;
  if (!emp) return null;

  const details = [
    { icon: <FiMail size={14} />, label: "Email", value: emp.email },
    { icon: <FiPhone size={14} />, label: "Phone", value: emp.phone_no },
    { icon: <FiBriefcase size={14} />, label: "Department", value: deptName || "" },
    { icon: <FiDollarSign size={14} />, label: "Salary", value: emp.salary ? `Rs. ${Number(emp.salary).toLocaleString()}` : "" },
    { icon: <FiCalendar size={14} />, label: "Joined Date", value: emp.join_date || "" },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center backdrop-blur-sm p-5"
    >
      <div className="bg-white dark:bg-[#15161C] rounded-2xl w-[420px] max-w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] dark:border-[#2A2B36] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee Profile</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-transparent border-none cursor-pointer">
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shrink-0" style={{ background: avatarGrad(emp.id) }}>
              {getInitials(emp.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-[#111827] dark:text-[#EAE5DF] truncate">{emp.name}</div>
              <div className="text-[13px] text-slate-400 mt-0.5 truncate">{emp.position}</div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusColor.bg, color: statusColor.text }}>
              {statusName}
            </span>
          </div>

          <div className="border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden mb-6 bg-slate-50 dark:bg-[#1C1D24]/50">
            {details.map(({ icon, label, value }, i) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-[#E2E8F0] dark:border-[#2A2B36]" : ""}`}>
                <div className="flex items-center gap-2 text-slate-400 shrink-0">
                  {icon}
                  <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-[13px] font-bold text-[#111827] dark:text-[#EAE5DF] text-right break-all ml-4">{value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { onClose(); onEdit(emp); }}
            className="w-full py-3 rounded-lg bg-[#101B55] hover:bg-[#1e293b] text-white font-bold text-xs uppercase tracking-wider transition-colors border-none cursor-pointer shadow-sm"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// Auto-Scheduler Modal
const DEFAULT_WEIGHTS = {
  availability: 30,
  skill_match: 25,
  fairness: 20,
  skill_level: 15,
  cost: 10,
};

const FACTOR_COLORS = {
  availability: "#185FA5",
  skill_match:  "#3B6D11",
  fairness:     "#7F77DD",
  skill_level:  "#BA7517",
  cost:         "#A32D2D",
};

function WSMScheduleModal({ employees, onClose, loading, setLoading, toast }) {
  const [step, setStep] = useState("weights");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [unscheduledShifts, setUnscheduledShifts] = useState([]);
  const [scheduleResult, setScheduleResult] = useState<any>(null);
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [fetching, setFetching] = useState(false);
  const [applying, setApplying] = useState(false);
  const [manualOverrides, setManualOverrides] = useState({});

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setFetching(true);
    try {
      const data = await api.getUnscheduledShifts();
      const shifts = data.data || [];
      setUnscheduledShifts(shifts.filter(s => !s.is_scheduled));
    } catch (e) {
      toast("Could not load shifts. Check backend.", "error");
    } finally {
      setFetching(false);
    }
  };

  const handlePreview = async () => {
    if (!unscheduledShifts.length) {
      toast("No unscheduled shifts found.", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await api.runWSMScheduler({
        shift_ids: unscheduledShifts.map(s => s.id),
        apply_schedule: false,
        weights: {
          availability: weights.availability / 100,
          skill_match:  weights.skill_match / 100,
          fairness:     weights.fairness / 100,
          skill_level:  weights.skill_level / 100,
          cost:         weights.cost / 100,
        },
      });
      setScheduleResult(result);
      setStep("preview");
    } catch (e) {
      toast("Scheduler failed. Check backend logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const result = await api.runWSMScheduler({
        shift_ids: unscheduledShifts.map(s => s.id),
        apply_schedule: true,
        weights: {
          availability: weights.availability / 100,
          skill_match:  weights.skill_match / 100,
          fairness:     weights.fairness / 100,
          skill_level:  weights.skill_level / 100,
          cost:         weights.cost / 100,
        },
      });
      setScheduleResult(result);
      setStep("result");
      toast("Schedule applied successfully!");
    } catch {
      toast("Failed to apply schedule.", "error");
    } finally {
      setApplying(false);
    }
  };

  const handleManualAssign = async (shiftId, employeeId, employeeName) => {
    try {
      await api.manualAssign(shiftId, employeeId);
      setManualOverrides(p => ({ ...p, [shiftId]: employeeName }));
      toast(`Manually assigned ${employeeName}`);
    } catch {
      toast("Manual assignment failed.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#15161C] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E2E8F0] dark:border-[#2A2B36] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between sticky top-0 bg-white dark:bg-[#15161C] z-10">
          <div>
            <div className="text-base font-bold text-[#101B55] dark:text-[#F2DD50]">WSM Auto-Scheduler</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {step === "weights" && "Set factor weights"}
              {step === "preview" && "Review recommendations"}
              {step === "result"  && "Schedule applied to database"}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-transparent text-slate-400 hover:text-slate-600 border-none cursor-pointer">
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === "weights" && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 p-4 rounded-xl text-xs leading-relaxed border border-blue-100 dark:border-blue-800">
                <strong>How WSM works:</strong> Each candidate is evaluated against these 5 factors. Adjust the slider weights to define priorities. The total sum must equal <strong>100%</strong>.
              </div>

              <div className="space-y-4">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">
                        {key.replace("_", " ")}
                      </label>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1C1D24] text-[#101B55]" style={{ color: FACTOR_COLORS[key] }}>
                        {val}%
                      </span>
                    </div>
                    <input
                      type="range" min={0} max={100} step={5} value={val}
                      onChange={e => setWeights(p => ({ ...p, [key]: Number(e.target.value) }))}
                      className="w-full accent-[#101B55]"
                    />
                    <p className="text-[11px] text-slate-400">
                      {key === "availability" && "Confirms employee is free for this shift."}
                      {key === "skill_match"  && "Ensures POS cashier skill requirement is satisfied."}
                      {key === "fairness"     && "Distribute workload evenly across pool."}
                      {key === "skill_level"  && "Gives higher priority to Advanced employees."}
                      {key === "cost"         && "Minimizes labor overhead by recommending lower wage rates."}
                    </p>
                  </div>
                ))}
              </div>

              <div className={`p-3 rounded-lg flex items-center justify-between border text-xs font-bold ${
                isWeightValid ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <span>Total weight</span>
                <span>{totalWeight}% {isWeightValid ? "" : " (must total 100%)"}</span>
              </div>

              <button
                onClick={handlePreview}
                disabled={!isWeightValid || loading || fetching || !unscheduledShifts.length}
                className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider text-white transition-colors border-none cursor-pointer ${
                  isWeightValid && !fetching && unscheduledShifts.length ? 'bg-[#101B55] hover:bg-[#1e293b]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? "Calculating..." : "Preview Recommendations"}
              </button>
            </>
          )}

          {step === "preview" && scheduleResult && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Scheduled", scheduleResult.scheduling_result?.scheduled_count, "text-green-700 bg-green-50"],
                  ["Unscheduled", scheduleResult.scheduling_result?.unscheduled_count, "text-red-700 bg-red-50"],
                  ["Success Rate", scheduleResult.scheduling_result?.success_rate, "text-blue-700 bg-blue-50"],
                ].map(([label, val, cl]) => (
                  <div key={label} className={`p-3 rounded-xl ${cl} text-center`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-lg font-extrabold">{val}</p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shift recommendations</p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {unscheduledShifts.map(shift => {
                  const assigned = manualOverrides[shift.id] ||
                    scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.assigned;
                  const score = scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.score;
                  const rankings = scheduleResult.scheduling_result?.assignments?.find(a => a.shift_id === shift.id)?.rankings || [];
                  const isOpen = selectedShift === shift.id;

                  return (
                    <div key={shift.id} className="border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden">
                      <div
                        onClick={() => setSelectedShift(isOpen ? null : shift.id)}
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#101B55] dark:text-[#F2DD50]">
                            {shift.shift_date} · {shift.start_time?.slice(0,5)} - {shift.end_time?.slice(0,5)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">Skill Req: {shift.required_skill_name || "General"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            assigned ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {assigned ? `${assigned} (${Number(score).toFixed(2)})` : "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-[#E2E8F0] dark:border-[#2A2B36] p-3 space-y-2 bg-slate-50 dark:bg-[#1C1D24]/50">
                          {rankings.map((r, idx) => (
                            <div key={r.employee} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
                              <span className="font-bold text-slate-500 w-4">{idx + 1}</span>
                              <span className="font-bold text-slate-700 dark:text-[#EAE5DF] flex-1">{r.employee}</span>
                              <span className="text-[11px] text-slate-400 font-medium mr-3">{Number(r.score).toFixed(3)}</span>
                              <button
                                onClick={() => handleManualAssign(shift.id, r.employee_id, r.employee)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                                  manualOverrides[shift.id] === r.employee || (idx === 0 && assigned === r.employee)
                                    ? "bg-[#101B55] text-white border-transparent"
                                    : "bg-white text-slate-600 border-[#E2E8F0]"
                                }`}
                              >
                                {manualOverrides[shift.id] === r.employee || (idx === 0 && assigned === r.employee) ? "Assigned" : "Assign"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("weights")} className="flex-1 py-3 rounded-lg border border-[#E2E8F0] text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">Adjust weights</button>
                <button onClick={handleApply} disabled={applying} className="flex-[2] py-3 rounded-lg border-none text-xs font-bold text-white bg-[#101B55] hover:bg-[#1e293b] cursor-pointer disabled:opacity-50">
                  {applying ? "Applying..." : "Confirm & Save Schedule"}
                </button>
              </div>
            </>
          )}

          {step === "result" && scheduleResult && (
            <>
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiClock size={24} className="text-green-600" />
                </div>
                <h3 className="text-base font-bold text-[#101B55] dark:text-[#F2DD50]">Schedule Completed & Saved</h3>
                <p className="text-xs text-slate-400 mt-1">Assignments successfully recorded in database.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  ["Scheduled", scheduleResult.scheduling_result?.scheduled_count],
                  ["Unscheduled", scheduleResult.scheduling_result?.unscheduled_count],
                  ["Total Shifts", scheduleResult.scheduling_result?.total_shifts],
                  ["Success Rate", scheduleResult.scheduling_result?.success_rate],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 dark:bg-[#1C1D24] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-[#EAE5DF] mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              <button onClick={onClose} className="w-full py-3 rounded-lg bg-[#101B55] hover:bg-[#1e293b] text-white font-bold text-xs uppercase tracking-wider transition-colors border-none cursor-pointer">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Skills Management Tab
function SkillsTab({ toast }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const loadSkills = async () => {
    setLoading(true);
    try {
      const res = await api.getSkills();
      setSkills(res.data || []);
    } catch {
      toast("Failed to load skills", "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadSkills(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return toast("Skill name is required", "warning");
    try {
      if (editingSkill) {
        await api.updateSkill(editingSkill.id, form);
        toast("Skill updated");
      } else {
        await api.createSkill(form);
        toast("Skill created");
      }
      setShowModal(false);
      loadSkills();
    } catch (e: any) {
      toast(e.name?.[0] || "Failed to save skill", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.deleteSkill(id);
      toast("Skill deleted");
      loadSkills();
    } catch {
      toast("Failed to delete skill", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-900 dark:text-[#EAE5DF]">Skills Directory</h2>
        <button onClick={() => { setEditingSkill(null); setForm({name:"", description:""}); setShowModal(true); }} className="px-4 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-lg text-xs font-bold border-none cursor-pointer transition-colors shadow-sm">+ Add Skill</button>
      </div>

      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Skill Name</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Description</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center" style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Loading skills...</span>
                </td>
              </tr>
            ) : skills.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-slate-400 text-sm font-medium">No skills defined yet</td>
              </tr>
            ) : (
              skills.map((s: any) => (
                <tr key={s.id} className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors">
                  <td className="py-4 px-6 text-[13px] font-bold text-[#101B55] dark:text-[#F2DD50]">{s.name}</td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 dark:text-[#EAE5DF]">{s.description || "-"}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setEditingSkill(s); setForm({name: s.name, description: s.description||""}); setShowModal(true); }} className="text-[#94A3B8] hover:text-[#101B55] transition-colors border-none bg-transparent cursor-pointer"><FiEdit2 size={14}/></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer"><FiTrash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#15161C] w-full max-w-sm rounded-xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36]">
            <h3 className="text-base font-bold text-[#101B55] mb-4">{editingSkill ? "Edit Skill" : "Create New Skill"}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Skill Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm" placeholder="e.g. POS Billing Specialist" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm min-h-[80px]" placeholder="Briefly describe what this skill implies" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#E2E8F0] text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg border-none cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shift Management Tab
function ShiftsTab({ toast }) {
  const [shifts, setShifts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [form, setForm] = useState({ shift_date: "", start_time: "", end_time: "", required_skill: "", required_employees: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, skillsRes] = await Promise.all([api.getShiftsCRUD(), api.getSkills()]);
      setShifts(shiftsRes.data || []);
      setSkills(skillsRes.data || []);
    } catch {
      toast("Failed to load shifts/skills", "error");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!form.shift_date || !form.start_time || !form.end_time) return toast("Date and times are required", "warning");
    const payload = { ...form, required_skill: form.required_skill || null };
    try {
      if (editingShift) {
        await api.updateShift(editingShift.id, payload);
        toast("Shift updated");
      } else {
        await api.createShift(payload);
        toast("Shift created");
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      toast("Failed to save shift", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.deleteShift(id);
      toast("Shift deleted");
      loadData();
    } catch {
      toast("Failed to delete shift", "error");
    }
  };

  const handleUnassign = async (id) => {
    if (!confirm("Remove the assigned employee from this shift?")) return;
    try {
      await api.unassignShift(id);
      toast("Employee unassigned");
      loadData();
    } catch {
      toast("Failed to unassign employee", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold text-slate-900 dark:text-[#EAE5DF]">Shifts List</h2>
        <button onClick={() => { setEditingShift(null); setForm({shift_date:"", start_time:"", end_time:"", required_skill:"", required_employees:1}); setShowModal(true); }} className="px-4 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-lg text-xs font-bold border-none cursor-pointer shadow-sm transition-colors">+ Add Shift</button>
      </div>

      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Date</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Time Window</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Req. Skill</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Required Staff</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">Assigned Employee</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center">Status</th>
              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center" style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Loading shifts...</span>
                </td>
              </tr>
            ) : shifts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm font-medium">No shifts defined yet</td>
              </tr>
            ) : (
              shifts.map((s: any) => (
                <tr key={s.id} className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors">
                  <td className="py-4 px-6 text-[13px] font-bold text-[#101B55] dark:text-[#F2DD50]">{s.shift_date}</td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 dark:text-[#EAE5DF]">{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</td>
                  <td className="py-4 px-6 text-[13px]">
                    {s.required_skill_name ? <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">{s.required_skill_name}</span> : <span className="text-slate-400 font-medium">-</span>}
                  </td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 dark:text-[#EAE5DF]">{s.required_employees}</td>
                  <td className="py-4 px-6 text-[13px] text-slate-600 dark:text-[#EAE5DF] font-bold">{s.assigned_employee_name || "-"}</td>
                  <td className="py-4 px-6 text-center text-[13px]">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      s.is_scheduled ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}>{s.is_scheduled ? "Scheduled" : "Unscheduled"}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => { setEditingShift(s); setForm({shift_date: s.shift_date, start_time: s.start_time, end_time: s.end_time, required_skill: s.required_skill||"", required_employees: s.required_employees}); setShowModal(true); }} className="text-[#94A3B8] hover:text-[#101B55] transition-colors border-none bg-transparent cursor-pointer"><FiEdit2 size={14}/></button>
                      {s.assigned_employee_name ? (
                        <button onClick={() => handleUnassign(s.id)} className="text-amber-500 hover:text-amber-700 transition-colors border-none bg-transparent cursor-pointer" title="Unassign employee">
                          <FiX size={14} />
                        </button>
                      ) : null}
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer"><FiTrash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#15161C] w-full max-w-sm rounded-xl p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36]">
            <h3 className="text-base font-bold text-[#101B55] mb-4">{editingShift ? "Edit Shift" : "Create New Shift"}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Shift Date</label>
                <input type="date" value={form.shift_date} onChange={e => setForm({...form, shift_date: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Required Cashier Skill (Optional)</label>
                <select value={form.required_skill} onChange={e => setForm({...form, required_skill: e.target.value})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] rounded-lg text-sm">
                  <option value="">None</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Required Staff Capacity</label>
                <input type="number" min="1" value={form.required_employees} onChange={e => setForm({...form, required_employees: Number(e.target.value)})} className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-[#E2E8F0] text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg border-none cursor-pointer">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Container
export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [availableDepts, setAvailableDepts] = useState([]);
  const [activeTab, setActiveTab] = useState("employees");
  const { toasts, add: toast, remove: removeToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      if (Array.isArray(data)) { setEmployees(data); setUseMock(false); }
      else throw new Error("Non-array response");
    } catch {
      setEmployees(MOCK_EMPLOYEES);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
    try {
      const depts = await api.getDepartments();
      if (Array.isArray(depts)) setAvailableDepts(depts.map(d => d.name));
    } catch { }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q);
    const empDept = typeof e.department === "string" ? e.department : e.department?.name || e.department;
    const matchD = !deptFilter || empDept === deptFilter;
    const empStatus = typeof e.status === "string" ? e.status : e.status?.name || "Active";
    const matchS = !statusFilter || empStatus === statusFilter;
    return matchQ && matchD && matchS;
  });

  const DEFAULT_DEPTS = ["Operations", "Sales", "Inventory", "Finance", "HR"];

  const departments = [...new Set([
    ...DEFAULT_DEPTS,
    ...availableDepts,
    ...employees.map(e => typeof e.department === "string" ? e.department : e.department?.name || e.department).filter(Boolean),
  ])];

  const stats = {
    total: employees.length,
    active: employees.filter(e => { const s = typeof e.status === "string" ? e.status : e.status?.name || "Active"; return s === "Active"; }).length,
    onLeave: employees.filter(e => { const s = typeof e.status === "string" ? e.status : e.status?.name || "Active"; return s === "On Leave"; }).length,
    avgSalary: employees.length ? Math.round(employees.reduce((s, e) => s + (Number(e.salary) || 0), 0) / employees.length) : 0,
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (useMock) {
        if (editTarget) {
          setEmployees(p => p.map(e => e.id === editTarget.id ? { ...e, ...form, status: { name: form.status } } : e));
          toast("Employee updated successfully!");
        } else {
          setEmployees(p => [...p, { ...form, id: Date.now(), status: { name: form.status } }]);
          toast("Employee added successfully!");
        }
        setDrawerOpen(false); setEditTarget(null); return;
      }
      if (editTarget) { await api.updateEmployee(editTarget.id, form); toast("Employee updated successfully!"); }
      else { await api.createEmployee(form); toast("Employee added successfully!"); }
      await load(); setDrawerOpen(false); setEditTarget(null);
    } catch (e) {
      let msg = "Failed to save employee record.";
      if (typeof e === "object" && e !== null) {
        const firstKey = Object.keys(e)[0];
        if (firstKey) { const err = e[firstKey]; msg = `${firstKey}: ${Array.isArray(err) ? err[0] : err}`; }
      }
      toast(msg, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (useMock) { setEmployees(p => p.filter(e => e.id !== deleteTarget.id)); toast(`${deleteTarget.name} removed successfully.`); setDeleteTarget(null); return; }
      await api.deleteEmployee(deleteTarget.id);
      toast(`${deleteTarget.name} removed successfully.`);
      await load(); setDeleteTarget(null);
    } catch { toast("Delete operation failed.", "error"); }
    finally { setDeleting(false); }
  };

  return (
    <div className="max-w-[1300px] mx-auto pb-10 mt-6 px-4">
      <Toast toasts={toasts} remove={removeToast} />

      {/* Header matching Inventory */}
      <div className="relative mb-6 rounded-2xl bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
        <div className="relative px-6 py-6 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-[#1C1D24] flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36]">
                <FiUsers className="w-6 h-6 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#EAE5DF] flex items-center gap-3">
                  Employee Scheduler & Roster
                  {useMock && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase">
                      DEMO MODE
                    </span>
                  )}
                </h1>
                <p className="text-slate-500 dark:text-[#94A3B8] text-xs mt-1 font-medium">
                  {useMock ? "Running offline with simulated data" : `${stats.total} total staff · ${stats.active} currently on shift`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowScheduler(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 border-none cursor-pointer"
              >
                <FiClock size={14} /> Auto-Scheduler
              </button>
              <button
                onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white rounded-lg text-[13px] font-bold border-none cursor-pointer shadow-sm"
              >
                <FiPlus size={15} /> Add Employee
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs Menu capsules */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "employees", label: "Staff Directory" },
          { id: "skills", label: "Skills Roster" },
          { id: "shifts", label: "Shift Schedule" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#101B55] text-white border-transparent'
                : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "employees" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label="TOTAL STAFF" 
              value={stats.total} 
              icon={<FiUsers size={22} />} 
              iconBg="#EFF6FF" 
              iconColor="#3B82F6" 
            />
            <StatCard 
              label="ACTIVE DEPARTMENTS" 
              value={departments.length} 
              icon={<FiBriefcase size={22} />} 
              iconBg="#FAF5FF" 
              iconColor="#A855F7" 
            />
            <StatCard 
              label="ON SHIFT / ACTIVE" 
              value={stats.active} 
              icon={<FiActivity size={22} />} 
              iconBg="#F0FDF4" 
              iconColor="#22C55E" 
            />
            <StatCard 
              label="MONTHLY WAGES (AVG)" 
              value={`Rs. ${stats.avgSalary.toLocaleString()}`} 
              icon={<FiTrendingUp size={22} />} 
              iconBg="#FEF2F2" 
              iconColor="#EF4444" 
            />
          </div>

          {/* Action / Search Bar Container */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#15161C] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm mb-6">
            {/* Search input */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff by name or phone..."
                className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-slate-50 dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
            </div>

            {/* Status selector (All) */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-2 px-6 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] outline-none cursor-pointer"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Add Staff Button */}
            <button
              onClick={() => { setEditTarget(null); setDrawerOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#101B55] hover:bg-[#0a113a] text-white rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors"
            >
              <FiPlus size={16} /> Add Staff
            </button>
          </div>

          <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2 px-1">
            TOTAL STAFF: <span className="text-[#111827] dark:text-[#EAE5DF]">{stats.total}</span>
          </div>

          {/* Directory Listings */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#E2E8F0] rounded-xl">
              <FiInfo size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400">No matching employee records found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search string or department filter.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Staff</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Phone</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Role</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Shift</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Status</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Joined Date</th>
                      <th className="py-4 px-6 text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filtered.map(emp => (
                      <EmployeeRow
                        key={emp.id}
                        emp={emp}
                        onEdit={e => { setEditTarget(e); setDrawerOpen(true); }}
                        onDelete={setDeleteTarget}
                        onView={setViewTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "skills" && <SkillsTab toast={toast} />}
      {activeTab === "shifts" && <ShiftsTab toast={toast} />}

      {/* Drawers / Modals */}
      <EmployeeDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
        employee={editTarget} onSave={handleSave} loading={saving} options={{ departments }} />

      {deleteTarget && (
        <DeleteModal emp={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}

      {viewTarget && (
        <EmployeeDetail emp={viewTarget} onClose={() => setViewTarget(null)}
          onEdit={e => { setViewTarget(null); setEditTarget(e); setDrawerOpen(true); }} />
      )}

      {showScheduler && (
        <WSMScheduleModal
          employees={employees}
          onClose={() => setShowScheduler(false)}
          loading={scheduling}
          setLoading={setScheduling}
          toast={toast}
        />
      )}
    </div>
  );
}