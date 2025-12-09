import { useState, useEffect, useRef } from 'react';
import apiFetch, { uploadFilesSequential, getApiBase } from '../api';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

 


export function RegisterFace({ user, onNavigate, onLogout }) {
  const [capturedImages, setCapturedImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [perFileProgress, setPerFileProgress] = useState([]);
  const [fileResults, setFileResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingFaces, setExistingFaces] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Clean up camera stream on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Load existing enrolled faces for this user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiFetch('/api/face');
        if (mounted && data && Array.isArray(data.faces)) {
          const base = getApiBase();
          setExistingFaces(data.faces.map(f => `${base}${f.image_path}`));
        }
      } catch (e) {
        // ignore errors (user may not be authenticated)
      }
    })();
    return () => { mounted = false; };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      // Ensure the video element is mounted before attaching the stream.
      // We set isCapturing true first so the video element is rendered,
      // then attach the stream and play.
      setIsCapturing(true);
      // wait for next paint so the video element mounts
      await new Promise((r) => setTimeout(r, 0));
      if (videoRef.current) {
        try {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (err) {
          // ignore play errors (autoplay policies) — element will show stream when user interacts
          console.warn('video play error', err);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Camera error', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const w = videoRef.current.videoWidth || 640;
    const h = videoRef.current.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' });
      setSelectedFiles((prev) => {
        const arr = [...prev, file].slice(0, 7);
        return arr;
      });
      setCapturedImages((prev) => {
        const arr = [...prev, URL.createObjectURL(file)].slice(0, 7);
        return arr;
      });
    }, 'image/png');
  };

  const handleRemoveImage = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const count = selectedFiles.length || capturedImages.length;
    if (count < 5) {
      setError('Please capture at least 5 images');
      return;
    }
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    setPerFileProgress(selectedFiles.map(() => 0));
    setFileResults([]);
    try {
      const files = selectedFiles.length > 0 ? selectedFiles : [];
      const results = await uploadFilesSequential('/api/face/enroll', files, {
        onFileProgress: (index, percent) => {
          setPerFileProgress((prev) => {
            const next = [...prev];
            next[index] = percent;
            return next;
          });
        },
        onOverall: (p) => setUploadProgress(p),
      });

      setFileResults(results || []);
      const allSuccess = (results || []).every(r => r && (r.success || r.face_id || (r[0] && r[0].face_id)));
      if (allSuccess) {
        setIsSubmitted(true);
        setSelectedFiles([]);
        setCapturedImages([]);
        setToast({ type: 'success', message: 'Faces enrolled successfully' });
        setTimeout(() => setToast(null), 4000);
      } else {
        setError('Failed to upload some images.');
        setToast({ type: 'error', message: 'Failed to upload some images' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err) {
      // Try to surface server-provided error message for better UX
      let serverMsg = null;
      let detailedError = '';
      try {
        // Axios error -> err.response.data
        const errorData = err?.response?.data;
        serverMsg = errorData?.error || errorData?.message || null;
        
        // Log detailed error for debugging
        console.error('Face enrollment error:', {
          status: err?.response?.status,
          error: serverMsg,
          data: errorData
        });

        // Provide helpful user-facing messages based on backend errors
        if (serverMsg?.includes('no face detected')) {
          detailedError = 'No face detected in image. Make sure your face is clearly visible.';
        } else if (serverMsg?.includes('multiple faces')) {
          detailedError = 'Multiple faces detected. Please ensure only your face is in the photo.';
        } else if (serverMsg?.includes('too blurry')) {
          detailedError = 'Image is too blurry. Please use a clear, well-lit photo.';
        } else if (serverMsg?.includes('too small')) {
          detailedError = 'Face is too small in the image. Please get closer to the camera.';
        } else if (serverMsg?.includes('too large')) {
          detailedError = 'File is too large. Maximum file size is 5MB.';
        } else if (serverMsg?.includes('invalid file type')) {
          detailedError = 'Invalid file type. Please use PNG, JPG, or JPEG.';
        } else {
          detailedError = serverMsg || 'Failed to register face. Please try again.';
        }
      } catch (e) {
        serverMsg = null;
        detailedError = 'Failed to register face. Please check console for details.';
      }
      
      setError(detailedError);
      setToast({ type: 'error', message: detailedError });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleFilesSelected = (files) => {
    const arr = Array.from(files).slice(0, 7);
    setSelectedFiles(arr);
    setCapturedImages(arr.map(f => URL.createObjectURL(f)));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage="register-face" onNavigate={onNavigate} userRole={user.role} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-gray-900 mb-2">Register Face</h1>
            <p className="text-gray-600">
              Capture multiple images of your face for accurate recognition
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webcam Preview */}
            <Card className="p-6">
              {/* Toast */}
              {toast && (
                <div className={`fixed top-6 right-6 z-50`}>
                  <div className={`p-3 rounded shadow ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.message}
                  </div>
                </div>
              )}
              <h2 className="text-gray-900 mb-4">Camera Preview</h2>
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                {!isCapturing ? (
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">Camera feed will appear here</p>
                  </div>
                ) : (
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                )}
              </div>

              <div className="space-y-3">

                <div className="flex gap-2">
                  <Button
                    onClick={() => (isCapturing ? stopCamera() : startCamera())}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {isCapturing ? 'Stop Camera' : 'Start Camera'}
                  </Button>
                  {isCapturing && (
                    <Button onClick={captureFrame} className="bg-green-600 hover:bg-green-700">
                      Capture
                    </Button>
                  )}
                </div>

                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="w-full"
                />
              </div>

              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Please capture your face from different angles for accurate detection. Ensure
                  good lighting and look directly at the camera.
                </AlertDescription>
              </Alert>
            </Card>

            {/* Captured Images Gallery */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900">Captured Images</h2>
                <span className="text-gray-600">
                  {capturedImages.length} / 7 images
                </span>
              </div>

              {capturedImages.length === 0 ? (
                <div className="aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No images captured yet</p>
                    <p className="text-gray-400">Start capturing to see previews here</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Captured ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* per-file progress */}
                        {perFileProgress[index] > 0 && perFileProgress[index] < 100 && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                            <div className="text-white text-sm">Uploading {perFileProgress[index]}%</div>
                          </div>
                        )}
                        {perFileProgress[index] === 100 && isSubmitted && (
                          <div className="absolute top-2 left-2 bg-green-600 text-white rounded-full p-1">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={(selectedFiles.length < 5 && capturedImages.length < 5) || isSubmitted}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitted ? 'Training Model...' : 'Submit for Training'}
                  </Button>

                  {uploadProgress > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 bg-green-500"
                          style={{ width: `${uploadProgress}%`, transition: 'width 200ms ease' }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}

                  {capturedImages.length < 5 && (
                    <p className="text-gray-500 text-center mt-2">
                      Capture at least 5 images to submit
                    </p>
                  )}

                  {isSubmitted && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your face data is being processed and trained. This may take a few moments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Previously enrolled faces */}
              {existingFaces.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-gray-800 mb-3">Previously Registered</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {existingFaces.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt={`Enrolled ${i + 1}`} className="w-full h-24 object-cover rounded-md border" />
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Enrolled</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}


