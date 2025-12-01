import { Home, Users, Camera, Settings, UserCircle, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';




export function AdminSidebar({ currentPage, onNavigate }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'attendance-records', label: 'Attendance Records', icon: ClipboardList },
    { id: 'register-face', label: 'Manage Faces', icon: Camera },
    { id: 'admin', label: 'User Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
 
  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen flex flex-col shadow-2xl">
      <div className="p-6 border-b border-blue-700">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <UserCircle className="w-8 h-8 text-blue-900" />
          </div>
          <div>
            <h2 className="text-white">FaceAttend</h2>
            <p className="text-blue-200">Admin Portal</p>
          </div>
        </motion.div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.li
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-lg'
                      : 'text-blue-100 hover:bg-blue-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-blue-700">
        <div className="text-blue-200 text-center">
          <p>Admin v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}


