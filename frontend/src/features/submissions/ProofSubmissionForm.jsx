import { useMemo, useState } from 'react';
import imageCompression from 'browser-image-compression';
import api from '../../app/api';
import { useLocation } from '../../common/contexts/LocationContext';
import { Card } from '../../common/components/ui/Card';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { 
  Upload, 
  MapPinned, 
  Camera, 
  StickyNote, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileCheck,
  Activity,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function toDataUrl(file) {
  return URL.createObjectURL(file);
}

export default function ProofSubmissionForm({ task, onSubmitted }) {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(''); // 'gps' | 'uploading' | 'submitting' | ''
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState(null);
  const { getFreshLocation } = useLocation();

  const previews = useMemo(() => files.map((file, idx) => ({ file, url: toDataUrl(file), id: idx })), [files]);

  async function handleFileChange(event) {
    setError('');
    setSuccess('');

    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        selectedFiles.map((file) =>
          imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          })
        )
      );

      // Append to existing files without replacing
      setFiles((prev) => [...prev, ...compressed]);
    } catch (compressionError) {
      setError(compressionError.message || 'Unable to compress selected images.');
    } finally {
      setCompressing(false);
      // Reset input value so same files can be re-selected if removed
      if (event.target) event.target.value = '';
    }
  }

  function removeFile(indexToRemove) {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  async function uploadToCloudinary(file) {
    const signatureResponse = await api.get('/upload/signature');
    const signaturePayload = signatureResponse.data?.data || {};

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signaturePayload.apiKey);
    formData.append('timestamp', signaturePayload.timestamp);
    formData.append('signature', signaturePayload.signature);
    formData.append('folder', signaturePayload.folder);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Cloudinary upload failed.');
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.secure_url;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!task?._id) {
      setError('Task details are missing.');
      return;
    }

    if (!files.length) {
      setError('Please select or capture at least one photographic proof.');
      return;
    }

    // Safety guard against double submissions
    if (submitting) return;

    setSubmitting(true);

    try {
      // 1. Capture Location
      setSubmitStep('gps');
      let submittedLocation = location;
      if (!submittedLocation) {
        const position = await getFreshLocation();
        submittedLocation = {
          type: 'Point',
          coordinates: [position.coords.longitude, position.coords.latitude],
        };
      }

      // 2. Upload Images to Cloudinary
      setSubmitStep('uploading');
      const imageUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        imageUrls.push(url);
      }

      // 3. Submit Payload
      setSubmitStep('submitting');
      const response = await api.post('/submissions', {
        taskId: task._id,
        images: imageUrls,
        notes,
        submittedLocation,
      });

      setSuccess('Proof of work submitted successfully! Awaiting manager verification.');
      setFiles([]);
      setNotes('');
      setLocation(submittedLocation);
      onSubmitted?.(response.data?.data?.task || null);
    } catch (submissionError) {
      setError(
        submissionError.response?.data?.message ||
        submissionError.message ||
        'Unable to submit task proof.'
      );
    } finally {
      setSubmitting(false);
      setSubmitStep('');
    }
  }

  async function captureLocation() {
    setError('');
    try {
      const position = await getFreshLocation();
      const nextLocation = {
        type: 'Point',
        coordinates: [position.coords.longitude, position.coords.latitude],
      };
      setLocation(nextLocation);
    } catch (locationError) {
      setError(locationError.message || 'Unable to capture GPS location. Please check location permissions.');
    }
  }

  // Status 1: Assigned (Not Started Yet)
  if (task?.status === 'assigned') {
    return (
      <Card className="p-6 border-border/70 bg-surface shadow-sm">
        <div className="flex items-start gap-3.5 text-muted-foreground">
          <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center shrink-0 border border-border/60">
            <Camera className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Proof Submission Locked</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Proof upload becomes active once you start the task. Tap <strong>"Start Task"</strong> when you arrive on-site.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Status 2: Completed (Submitted & Awaiting Review)
  if (task?.status === 'completed') {
    return (
      <Card className="p-6 border-primary/30 bg-primary/5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">Proof Submitted</h4>
              <Badge variant="info" className="text-[10px] uppercase font-bold">
                Awaiting Verification
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your photographic proof and GPS coordinates have been submitted and are currently queued for dispatch manager review.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Status 3: Verified (Approved by Admin)
  if (task?.status === 'verified') {
    return (
      <Card className="p-6 border-success/30 bg-success/5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0 border border-success/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-success">Task Verified & Approved</h4>
              <Badge variant="success" className="text-[10px] uppercase font-bold">
                Completed & Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Work order execution has been reviewed, approved, and verified by operations management.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Status 4: Rejected (Rejected by Admin)
  if (task?.status === 'rejected') {
    return (
      <Card className="p-6 border-destructive/30 bg-destructive/5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-destructive">Submission Rejected</h4>
              <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                Action Required
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The submitted proof was not approved. Please consult with your supervisor or dispatch team for instructions.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Status 5: In Progress (Active Proof Submission Form)
  return (
    <Card className="p-6 md:p-7 border-border/70 bg-surface shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Proof of Work Submission</h3>
            <p className="text-[11px] text-muted-foreground">Upload photos and field notes to complete this task</p>
          </div>
        </div>
        <Badge variant="info" className="text-[10px] uppercase font-bold">
          In Progress
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Upload Dropzone / Button */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Photographic Evidence</span>
            <span className="text-muted-foreground font-normal lowercase">({files.length} selected)</span>
          </label>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/50 bg-surface-muted/20 hover:bg-surface-muted/40 rounded-2xl cursor-pointer transition-all group">
            <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 text-primary flex items-center justify-center mb-2.5 transition-colors">
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xs font-bold text-foreground">Click to upload or take a photo</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, JPEG (auto-compressed)</span>
            
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={compressing || submitting}
              className="hidden"
            />
          </label>

          {compressing && (
            <div className="flex items-center gap-2 text-xs font-medium text-primary animate-pulse py-1">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing image resolution & compression...</span>
            </div>
          )}
        </div>

        {/* Image Previews Grid */}
        <AnimatePresence>
          {previews.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1"
            >
              {previews.map((preview, idx) => (
                <motion.div
                  key={preview.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group rounded-xl overflow-hidden border border-border/70 aspect-video bg-surface-muted/30 shadow-xs"
                >
                  <img 
                    src={preview.url} 
                    alt={`Proof evidence ${idx + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove image ${idx + 1}`}
                    disabled={submitting}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/80 hover:bg-destructive text-foreground hover:text-white shadow-xs backdrop-blur-xs transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Field Notes Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5 text-primary" />
            <span>Job Notes & Observations</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder="Add work order completion notes, site condition remarks, or customer signature notes..."
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs transition-all resize-none"
          />
        </div>

        {/* Location Capture Badge & Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={captureLocation}
            disabled={submitting}
            className="gap-2 text-xs font-bold w-full sm:w-auto"
          >
            <MapPinned className="w-3.5 h-3.5 text-primary" />
            <span>{location ? 'Refresh GPS Location' : 'Capture GPS Location'}</span>
          </Button>

          {location ? (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg w-full sm:w-auto">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>GPS Verified: {location.coordinates[1].toFixed(5)}, {location.coordinates[0].toFixed(5)}</span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              GPS will be captured upon submission.
            </span>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3 text-xs text-success font-semibold">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 border-t border-border/60">
          <Button
            type="submit"
            disabled={submitting || compressing || !files.length}
            className="w-full min-h-[44px] py-3.5 text-xs font-bold gap-2 shadow-sm touch-manipulation active:scale-[0.99]"
          >
            {submitting ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>
                  {submitStep === 'gps' && 'Capturing GPS Location...'}
                  {submitStep === 'uploading' && `Uploading Proof Images (${files.length})...`}
                  {submitStep === 'submitting' && 'Recording Task Submission...'}
                  {!submitStep && 'Submitting Proof...'}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit Proof & Complete Task</span>
              </>
            )}
          </Button>
        </div>

      </form>
    </Card>
  );
}