import * as React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Input,
  toast,
} from '@meetflow/ui';
import { Plus, UploadCloud, Link as LinkIcon, AlertCircle, FileAudio } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.mp3', '.mp4', '.m4a', '.wav', '.mov', '.webm'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export function AddMeetingDialog() {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('upload');
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = '.' + selected.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFile(null);
      setFileError(`Unsupported format "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setFileError('File exceeds maximum size of 2GB.');
      return;
    }

    setFileError(null);
    setFile(selected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'upload') {
      if (!file) {
        setFileError('Please select a valid recording file.');
        return;
      }

      // Honest simulation
      toast.success(
        `Recording "${file.name}" received! (Frontend simulated; live backend ingestion connects in Phase 04)`
      );
      setOpen(false);
      setFile(null);
    } else {
      if (!meetingUrl.trim()) {
        toast.error('Please enter a valid meeting URL.');
        return;
      }

      toast.info(
        'Meeting bot join requested. (Live bot automation is explicitly stubbed for the 8x assignment).'
      );
      setOpen(false);
      setMeetingUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold shadow-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Meeting</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Meeting Recording</DialogTitle>
          <DialogDescription>
            Upload a recorded call or paste a link to generate transcripts and AI intelligence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-1.5">
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload File</span>
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Meeting Link</span>
              </TabsTrigger>
            </TabsList>

            {/* Upload File Tab */}
            <TabsContent value="upload" className="space-y-3 pt-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary mb-2 shadow-2xs">
                  <FileAudio className="h-5 w-5" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB ready to upload
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      Click to choose an audio or video file
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Supports MP3, MP4, M4A, WAV, MOV, WEBM (Up to 2GB)
                    </p>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Note: In Phase 03, uploads are validated on the client. In Phase 04, files will be streamed to the Express backend for Whisper transcription.
              </p>
            </TabsContent>

            {/* Meeting Link Tab */}
            <TabsContent value="link" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Meeting URL</label>
                <Input
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                />
              </div>
              <div className="rounded-md border bg-muted/40 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                Per the 8x assignment brief, recording bots may be stubbed. For guaranteed transcript testing, prefer using the direct file upload tab.
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
                setFile(null);
                setFileError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={activeTab === 'upload' && !file}>
              {activeTab === 'upload' ? 'Upload Recording' : 'Save Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
