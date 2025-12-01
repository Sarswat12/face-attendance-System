import { Home, Camera, FileText, Users, Settings, UserCircle } from 'lucide-react';




export function Sidebar({ currentPage, onNavigate, userRole }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'employee'] },
    { id: 'register-face', label: 'Register Face', icon: Camera, roles: ['admin', 'employee'] },
    { id: 'attendance', label: 'Attendance Records', icon: FileText, roles: ['admin', 'employee'] },
    { id: 'admin', label: 'User Management', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'employee'] },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900">FaceAttend</h2>
            <p className="text-gray-500">AI System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-gray-500 text-center">
          <p>v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}



