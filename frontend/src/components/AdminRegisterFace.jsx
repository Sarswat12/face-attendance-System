import { useState, useEffect } from 'react';
import { Search, X, Edit, Trash2, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminSidebar } from './AdminSidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';






export function AdminRegisterFace({ user, onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState(null);
  const [allUsersWithFaces, setAllUsersWithFaces] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userFaces, setUserFaces] = useState([]);
  const [loadingFaces, setLoadingFaces] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await (await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}/api/users`, { credentials: 'include' })).json();
        if (mounted) setAllUsersWithFaces(data.users || []);
      } catch (e) {
        console.error('Failed to load users', e);
        setAllUsersWithFaces([]);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredUsers = allUsersWithFaces.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.user_id || u.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedUser) {
      // selectedUser.id is numeric DB id
      loadFacesForUser(selectedUser.id);
    } else {
      setUserFaces([]);
    }
  }, [selectedUser]);

  const handleDeleteFace = async (faceId) => {
    // TODO: implement delete endpoint; for now just refetch faces after potential deletion
    console.log('Deleting face id:', faceId);
    // Call backend when delete endpoint is available
    setSelectedFaceIndex(null);
    if (selectedUser) await loadFacesForUser(selectedUser.id);
  };

  const loadFacesForUser = async (userId) => {
    setLoadingFaces(true);
    try {
      const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${base}/api/face?user_id=${userId}`, { credentials: 'include' });
      const j = await res.json();
      setUserFaces(j.faces || []);
    } catch (e) {
      console.error('Failed to load faces for user', e);
      setUserFaces([]);
    } finally {
      setLoadingFaces(false);
    }
  };

  const handleUploadNewFace = async () => {
    if (!selectedUser) return;
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        // use existing frontend uploadSingle helper (axios) if available
        try {
          // dynamically import api helper
          const mod = await import('../api');
          const uploadSingle = mod.uploadSingle;
          await uploadSingle('/api/face/enroll', file, (p) => console.debug('upload', p), { user_id: selectedUser.id });
          // refresh faces
          await loadFacesForUser(selectedUser.id);
        } catch (err) {
          console.error('Upload failed', err);
        }
      };
      input.click();
    } catch (e) {
      console.error('Upload error', e);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminSidebar currentPage="register-face" onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <h1 className="text-gray-900 mb-2">Manage User Faces</h1>
            <p className="text-gray-600">
              View and modify registered faces for all users
            </p>
          </motion.div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - User List */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="col-span-12 lg:col-span-4"
            >
              <Card className="p-4 h-[calc(100vh-200px)]">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[calc(100%-60px)]">
                  <div className="space-y-2">
                    {filteredUsers.map((userData, index) => (
                      <motion.div
                        key={userData.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <button
                          onClick={() => setSelectedUser(userData)}
                          className={`w-full p-3 rounded-lg transition-all text-left ${selectedUser?.id === userData.id
                              ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={userData.avatar}
                              alt={userData.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-gray-900 truncate">{userData.name}</h3>
                              <p className="text-gray-500">{userData.id}</p>
                            </div>
                            <Badge
                              variant={userData.faceCount === 7 ? 'default' : 'secondary'}
                              className={userData.faceCount === 7 ? 'bg-green-500' : ''}
                            >
                              {userData.faceCount}/7
                            </Badge>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>

            {/* Right Side - Face Gallery */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="col-span-12 lg:col-span-8"
            >
              <Card className="p-6 h-[calc(100vh-200px)]">
                {selectedUser ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-gray-900 mb-1">{selectedUser.name}</h2>
                        <p className="text-gray-600">
                          {selectedUser.id} • {selectedUser.department}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsEditMode(!isEditMode)}
                          variant={isEditMode ? 'default' : 'outline'}
                          className={isEditMode ? 'bg-blue-600' : ''}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {isEditMode ? 'Done' : 'Edit'}
                        </Button>
                        <Button onClick={handleUploadNewFace} className="bg-green-600 hover:bg-green-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-[calc(100%-100px)]">
                      {loadingFaces ? (
                        <div className="text-center text-gray-500">Loading faces...</div>
                      ) : userFaces.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500">
                            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p>No faces registered yet</p>
                            <Button onClick={handleUploadNewFace} className="mt-4 bg-blue-600">
                              Upload First Face
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {userFaces.map((face, index) => (
                            <motion.div
                              key={face.face_id || index}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              className="relative group"
                            >
                              <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                                <img
                                  src={`${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${face.image_path}`}
                                  alt={`Face ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute top-2 left-2">
                                <Badge className="bg-blue-600">Face {index + 1}</Badge>
                              </div>
                              {isEditMode && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2"
                                >
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                    onClick={() => handleDeleteFace(face.face_id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                          <AnimatePresence>
                            {/* Add more faces slots */}
                            {userFaces.length < 7 &&
                              Array.from({ length: 7 - userFaces.length }).map((_, index) => (
                                <motion.div
                                  key={`empty-${index}`}
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: (userFaces.length + index) * 0.05 }}
                                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={handleUploadNewFace}
                                >
                                  <div className="text-center text-gray-400">
                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                    <p>Add Face</p>
                                  </div>
                                </motion.div>
                              ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p>Select a user from the left to view their registered faces</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}


