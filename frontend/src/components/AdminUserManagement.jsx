import { useState, useEffect } from 'react';
import apiFetch from '../api';
import { Search, UserPlus, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';






export function AdminUserManagement({ user, onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiFetch('/api/users');
        setAllUsers(data.users || []);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // derive role-specific lists from allUsers to avoid undefined variables
  const employees = allUsers.filter((u) => (u.role || '').toLowerCase() === 'employee');

  const filterUsers = (users) => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSaveUser = () => {
    console.log('Saving user:', selectedUser);
    setIsEditMode(false);
  };

  const handleDeleteUser = (userId) => {
    console.log('Deleting user:', userId);
  };

  const renderUserCard = (userData, index) => (
    <motion.div
      key={userData.id}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer"
      onClick={() => setSelectedUser(userData)}
    >
      <Card className="p-4 hover:shadow-lg transition-all border-l-4 border-blue-500">
        <div className="flex items-start gap-3">
          <img
            src={userData.avatar}
            alt={userData.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 truncate">{userData.name}</h3>
            <p className="text-gray-500">{userData.id}</p>
            <p className="text-gray-600 truncate">{userData.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">{userData.department}</Badge>
              <Badge
                variant={userData.status === 'Active' ? 'default' : 'secondary'}
                className={userData.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}
              >
                {userData.status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminSidebar currentPage="admin" onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-gray-900 mb-2">User Management</h1>
                <p className="text-gray-600">
                  Manage all users, view and edit their profiles
                </p>
              </div>
              <Button onClick={() => setIsAddUserOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Card>
          </motion.div>

          {/* Tabs for Categories */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Users ({allUsers.length})</TabsTrigger>
              <TabsTrigger value="employees">Employees ({employees.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filterUsers(allUsers).map((userData, index) => renderUserCard(userData, index))}
              </div>
            </TabsContent>

            <TabsContent value="employees">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filterUsers(employees).map((userData, index) => renderUserCard(userData, index))}
              </div>
            </TabsContent>

            {/* Students tab removed — only Employees and All Users are supported */}
          </Tabs>
        </main>

        {/* User Detail Dialog */}
        <AnimatePresence>
          {selectedUser && (
            <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>User Profile</DialogTitle>
                    <div className="flex gap-2">
                      {!isEditMode ? (
                        <Button onClick={() => setIsEditMode(true)} size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <>
                          <Button onClick={handleSaveUser} size="sm" className="bg-green-600">
                            Save
                          </Button>
                          <Button onClick={() => setIsEditMode(false)} size="sm" variant="outline">
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-24 h-24 rounded-full"
                    />
                    {isEditMode && (
                      <Button variant="outline" size="sm">
                        Change Photo
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>User ID</Label>
                      <Input value={selectedUser.id} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      {isEditMode ? (
                        <Select defaultValue={selectedUser.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedUser.status} disabled />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue={selectedUser.name} disabled={!isEditMode} />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input defaultValue={selectedUser.email} disabled={!isEditMode} />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue={selectedUser.phone} disabled={!isEditMode} />
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      {isEditMode ? (
                        <Select defaultValue={selectedUser.role}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={selectedUser.role} disabled className="capitalize" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input defaultValue={selectedUser.department} disabled={!isEditMode} />
                    </div>

                    <div className="space-y-2">
                      <Label>Join Date</Label>
                      <Input defaultValue={selectedUser.joinDate} disabled />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input defaultValue={selectedUser.address} disabled={!isEditMode} />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="Enter email" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                    <Select defaultValue="employee">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input placeholder="Enter department" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


