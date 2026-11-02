import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { insertCreatedMeeting, invalidateMeetingData } from './use-meetings';
import {
  Dialog,
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
import {
  Plus,
  FileText,
  Video,
  AlertCircle,
  X,
  UploadCloud,
  Calendar,
  Clock,
} from 'lucide-react';
import { apiCreateMeeting, apiCreateMediaMeeting } from './meetings-api';

const ALLOWED_TRANSCRIPT_EXTENSIONS = ['.txt', '.srt', '.vtt'];
const MAX_TRANSCRIPT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface AddMeetingDialogProps {
  onMeetingCreated?: () => void;
}

export function AddMeetingDialog({ onMeetingCreated }: AddMeetingDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'transcript' | 'recording'>(
    'transcript',
  );

  // Form Fields
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dateStr, setDateStr] = React.useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [startTime, setStartTime] = React.useState('10:00');
  const [endTime, setEndTime] = React.useState('10:45');
  const [timezone] = React.useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [meetingStatus, setMeetingStatus] = React.useState<
    'SCHEDULED' | 'COMPLETED'
  >('SCHEDULED');

  // File Upload State
  const [mediaFile, setMediaFile] = React.useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = React.useState<File | null>(null);
  const [transcriptContent, setTranscriptContent] = React.useState<
    string | null
  >(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetForm = React.useCallback(() => {
    setTitle('');
    setDescription('');
    setMediaFile(null);
    setTranscriptFile(null);
    setTranscriptContent(null);
    setFileError(null);
    setMeetingStatus('SCHEDULED');
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const processFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TRANSCRIPT_EXTENSIONS.includes(ext)) {
      setTranscriptFile(null);
      setTranscriptContent(null);
      setFileError(
        `Unsupported format "${ext}". Allowed: ${ALLOWED_TRANSCRIPT_EXTENSIONS.join(', ')}`,
      );
      return;
    }

    if (file.size > MAX_TRANSCRIPT_SIZE_BYTES) {
      setTranscriptFile(null);
      setTranscriptContent(null);
      setFileError('File exceeds maximum allowed size of 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscriptFile(file);
      setTranscriptContent(text);
      setFileError(null);
      // Auto-set meeting status to COMPLETED if a transcript is attached
      setMeetingStatus('COMPLETED');
    };
    reader.onerror = () => {
      setFileError(
        'Failed to read file content. Please check file encoding (UTF-8 recommended).',
      );
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Meeting title is required.');
      return;
    }

    if (activeTab === 'recording' && !mediaFile) {
      toast.error('Choose a recording first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${dateStr}T${startTime}:00`);
      const endDateTime = endTime
        ? new Date(`${dateStr}T${endTime}:00`)
        : undefined;

      const ext = transcriptFile?.name.split('.').pop()?.toLowerCase();
      const sourceFormat = (
        ext === 'srt' ? 'srt' : ext === 'vtt' ? 'vtt' : 'txt'
      ) as 'txt' | 'srt' | 'vtt';

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime ? endDateTime.toISOString() : undefined,
        timezone,
        meetingStatus,
        sourceType: transcriptContent
          ? ('TRANSCRIPT_UPLOAD' as const)
          : ('MANUAL' as const),
        transcript:
          activeTab === 'transcript' && transcriptContent && transcriptFile
            ? {
                rawText: transcriptContent,
                sourceFilename: transcriptFile.name,
                sourceFormat,
              }
            : null,
      };

      const created =
        activeTab === 'recording' && mediaFile
          ? await apiCreateMediaMeeting(mediaFile, {
              ...payload,
              endAt: undefined,
              transcript: null,
            })
          : await apiCreateMeeting(payload);

      await insertCreatedMeeting(queryClient, created);
      if (created.status === 'failed') {
        toast.error(
          'Meeting saved, but processing could not be queued. Please retry from the meeting.',
        );
      } else if (transcriptContent || mediaFile) {
        toast.success(`Meeting created! Background AI processing enqueued.`);
      } else {
        toast.success('Scheduled meeting added successfully.');
      }

      setOpen(false);
      resetForm();
      void invalidateMeetingData(queryClient);
      onMeetingCreated?.();
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : null) ||
          'Failed to create meeting.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 h-8 text-xs font-semibold shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add Meeting</span>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Meeting</DialogTitle>
            <DialogDescription>
              Create a scheduled meeting or upload a conversation transcript for
              automated AI intelligence.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as 'transcript' | 'recording')
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transcript" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                <span>Upload Transcript</span>
              </TabsTrigger>
              <TabsTrigger value="recording" className="gap-1.5 text-xs">
                <Video className="h-3.5 w-3.5" />
                <span>Upload Recording</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: UPLOAD TRANSCRIPT (Fully Implemented) */}
            <TabsContent value="transcript" className="space-y-4 pt-3">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Meeting Title */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Meeting Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Q4 Executive Product Strategy Sync"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      Date <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      Start
                    </label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      End
                    </label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="Meeting context or agenda notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Transcript Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Transcript File (Optional for scheduled meetings)
                  </label>

                  {transcriptFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground truncate max-w-xs">
                            {transcriptFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(transcriptFile.size / 1024).toFixed(1)} KB • Ready
                            for AI intelligence
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTranscriptFile(null);
                            setTranscriptContent(null);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-border/80 bg-muted/20 hover:border-amber-500/50 hover:bg-muted/40'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.srt,.vtt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-2">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Drag and drop or click to upload transcript
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Supports .txt, .srt, .vtt (Up to 10MB)
                      </p>
                    </div>
                  )}

                  {fileError && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isSubmitting
                      ? 'Creating...'
                      : transcriptFile
                        ? 'Create & Process'
                        : 'Schedule Meeting'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="recording" className="space-y-4 pt-3">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="media-title" className="text-xs font-medium">
                    Meeting title
                  </label>
                  <Input
                    id="media-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={255}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="media-date" className="text-xs">
                      Date
                    </label>
                    <Input
                      id="media-date"
                      type="date"
                      value={dateStr}
                      onChange={(event) => setDateStr(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="media-time" className="text-xs">
                      Start time
                    </label>
                    <Input
                      id="media-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="rounded-lg border-2 border-dashed p-5 space-y-3">
                  <label htmlFor="media-file" className="text-xs font-medium">
                    Audio or video recording
                  </label>
                  <Input
                    id="media-file"
                    type="file"
                    accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg,.flac"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file && file.size > 512 * 1024 * 1024) {
                        toast.error('Recordings must be 512 MB or smaller.');
                        event.target.value = '';
                        setMediaFile(null);
                        return;
                      }
                      setMediaFile(file ?? null);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Up to 512 MB. Audio is transcribed automatically, then
                    analyzed for summaries, decisions, and action items. Your
                    recording stays private to this workspace.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !mediaFile || !title.trim()}
                  >
                    {isSubmitting ? 'Uploading…' : 'Upload & Process'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
