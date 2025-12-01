import { useState } from 'react';
import { UserPlus, Edit, Trash2, Download, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';






export function AdminPanel({ user, onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
  });

  const mockUsers = [
    { id: 'EMP001', name: 'John Doe', email: 'john@company.com', role: 'employee', department: 'Engineering', status: 'Active', joinDate: '2024-01-15' },
    { id: 'EMP002', name: 'Jane Smith', email: 'jane@company.com', role: 'employee', department: 'Marketing', status: 'Active', joinDate: '2024-02-20' },
    { id: 'EMP003', name: 'Mike Johnson', email: 'mike@company.com', role: 'employee', department: 'Sales', status: 'Active', joinDate: '2024-03-10' },
    { id: 'EMP004', name: 'Sarah Williams', email: 'sarah@company.com', role: 'employee', department: 'HR', status: 'Active', joinDate: '2024-04-05' },
    { id: 'ADM001', name: 'Tom Brown', email: 'tom@company.com', role: 'admin', department: 'Administration', status: 'Active', joinDate: '2024-05-12' },
    { id: 'EMP005', name: 'Emily Davis', email: 'emily@company.com', role: 'employee', department: 'Business', status: 'Inactive', joinDate: '2024-06-08' },
  ];

  const handleAddUser = () => {
    console.log('Adding user:', newUser);
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', role: 'employee', department: '' });
  };

  const handleExportAll = () => {
    console.log('Exporting all attendance data...');
  };

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage="admin" onNavigate={onNavigate} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">
              Manage users, view attendance history, and export reports
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <p className="text-gray-600 mb-2">Total Users</p>
              <p className="text-gray-900">{mockUsers.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 mb-2">Active Users</p>
              <p className="text-gray-900">
                {mockUsers.filter((u) => u.status === 'Active').length}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 mb-2">Departments</p>
              <p className="text-gray-900">
                {new Set(mockUsers.map((u) => u.department)).size}
              </p>
            </Card>
          </div>

          {/* User Management Table */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">All Users</h2>
              <div className="flex gap-2">
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account for the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          placeholder="Enter department"
                        />
                      </div>
                      <Button onClick={handleAddUser} className="w-full bg-blue-600 hover:bg-blue-700">
                        Create User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button onClick={handleExportAll} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-gray-600">Role</th>
                    <th className="text-left py-3 px-4 text-gray-600">Department</th>
                    <th className="text-left py-3 px-4 text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600">Join Date</th>
                    <th className="text-left py-3 px-4 text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">{userData.id}</td>
                      <td className="py-3 px-4 text-gray-900">{userData.name}</td>
                      <td className="py-3 px-4 text-gray-600">{userData.email}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-gray-900">{userData.role}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{userData.department}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full ${userData.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {userData.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{userData.joinDate}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}


