import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopBar from './TopBar';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import ChatPanel from '../chat/ChatPanel';
import VersionHistory from './VersionHistory';
import RoomSettings from '../rooms/RoomSettings';
import LanguageSelector from './LanguageSelector';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { fileApi } from '../../api/fileApi';
import { aiApi } from '../../api/aiApi';
import { useToast } from '../../context/ToastContext';

export default function EditorWorkspace({
  room,
  currentUser,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateMemberRole,
  onRemoveMember,
}) {
  const [files, setFiles] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [dirtyFileIds, setDirtyFileIds] = useState(new Set());

  // UI Panels state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(true);

  // Execution & AI states
  const [output, setOutput] = useState('');
  const [outputError, setOutputError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  // Monaco editor instance
  const [monacoEditorInstance, setMonacoEditorInstance] = useState(null);
  const { toast } = useToast();

  const activeFile = files.find((f) => (f._id || f.id) === activeFileId);
  const roomId = room?._id || room?.id;
  const ownerId = room?.owner?._id || room?.owner?.id || room?.owner;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwner = ownerId === currentUserId;

  // Determine user role in room
  const memberRecord = room?.members?.find(
    (m) => (m.user?._id || m.user?.id || m.user) === currentUserId
  );
  const userRole = isOwner ? 'owner' : memberRecord?.role || 'editor';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Sockets & Collaboration
  const { socket } = useSocket();
  const { messages, sendMessage } = useChat(socket, roomId, currentUser);
  const { isConnected: isCollabConnected, participants } = useCollaboration(
    roomId,
    activeFileId,
    currentUser,
    monacoEditorInstance,
    activeFile ? fileContents[activeFileId] || activeFile.content || '' : '',
    (newText) => {
      if (activeFileId) {
        setFileContents((prev) => ({
          ...prev,
          [activeFileId]: newText,
        }));
      }
    }
  );

  // Load files for room
  const loadFiles = useCallback(async () => {
    if (!roomId) return;
    try {
      const data = await fileApi.getRoomFiles(roomId);
      const fileList = Array.isArray(data?.files)
        ? data.files
        : Array.isArray(data)
        ? data
        : [];
      setFiles(fileList);

      if (fileList.length > 0) {
        const initialFile = fileList[0];
        const fId = initialFile._id || initialFile.id;
        setActiveFileId((prev) => prev || fId);
        setOpenFiles((prev) => (prev.length === 0 ? [initialFile] : prev));
        setFileContents((prev) => ({
          ...prev,
          [fId]: initialFile.content || '',
        }));
      } else if (canEdit) {
        // Create an initial starter file if room has no files yet
        const lang = room?.language || 'javascript';
        const defaultName =
          lang === 'python' ? 'main.py' : lang === 'html' ? 'index.html' : lang === 'css' ? 'style.css' : 'index.js';
        try {
          const res = await fileApi.createFile(roomId, {
            filename: defaultName,
            language: lang,
            content: `// Welcome to ${room?.name || 'CodeSync'}!\nconsole.log("Hello, World!");\n`,
          });
          const createdFile = res?.file || res;
          if (createdFile && (createdFile._id || createdFile.id)) {
            setFiles([createdFile]);
            const fId = createdFile._id || createdFile.id;
            setActiveFileId(fId);
            setOpenFiles([createdFile]);
            setFileContents({ [fId]: createdFile.content || '' });
          }
        } catch (createErr) {
          console.error('Could not auto-create starter file:', createErr);
        }
      }
    } catch (err) {
      console.error('Failed to load files for this room:', err);
      toast.error('Failed to load files for this room');
    }
  }, [roomId, room?.language, room?.name, canEdit, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleSelectFile = (file) => {
    const fileId = file._id || file.id;
    setActiveFileId(fileId);

    if (!openFiles.some((f) => (f._id || f.id) === fileId)) {
      setOpenFiles((prev) => [...prev, file]);
    }

    if (fileContents[fileId] === undefined) {
      setFileContents((prev) => ({
        ...prev,
        [fileId]: file.content || '',
      }));
    }
  };

  const handleCloseFile = (fileIdToClose) => {
    const nextOpen = openFiles.filter((f) => (f._id || f.id) !== fileIdToClose);
    setOpenFiles(nextOpen);

    if (activeFileId === fileIdToClose) {
      if (nextOpen.length > 0) {
        setActiveFileId(nextOpen[nextOpen.length - 1]._id || nextOpen[nextOpen.length - 1].id);
      } else {
        setActiveFileId(null);
      }
    }
  };

  const handleCreateFile = async (fileData) => {
    try {
      const res = await fileApi.createFile(roomId, fileData);
      const newFile = res.file || res;
      setFiles((prev) => [...prev, newFile]);
      handleSelectFile(newFile);
      toast.success(`Created file ${newFile.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create file');
      throw err;
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await fileApi.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => (f._id || f.id) !== fileId));
      handleCloseFile(fileId);
      toast.success('File deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete file');
      throw err;
    }
  };

  const handleCodeChange = (newVal) => {
    if (!activeFileId) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFileId]: newVal,
    }));
    setDirtyFileIds((prev) => new Set(prev).add(activeFileId));
  };

  const handleSave = async () => {
    if (!activeFileId || !canEdit) return;
    setIsSaving(true);
    try {
      const content = fileContents[activeFileId] || '';
      await fileApi.saveFile(activeFileId, content);
      setDirtyFileIds((prev) => {
        const next = new Set(prev);
        next.delete(activeFileId);
        return next;
      });
      toast.success('File saved and version snapshot recorded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S (save) and Ctrl+Enter (run)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning) handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, fileContents, canEdit, isRunning]);

  // ─── Socket.IO execution event listeners ───
  useEffect(() => {
    if (!socket) return;

    const handleExecOutput = (data) => {
      setOutput((prev) => prev + (data.text || ''));
    };

    const handleExecDone = (data) => {
      setIsRunning(false);
      setIsInteractive(false);
      setExecutionTime(data.executionTime || null);
      if (data.status === 'failed' && data.message) {
        setOutput((prev) => prev + '\n' + data.message);
      }
    };

    const handleExecError = (data) => {
      setOutputError(data.message || 'Execution error');
      setIsRunning(false);
      setIsInteractive(false);
    };

    const handleExecStarted = () => {
      setIsInteractive(true);
    };

    socket.on('exec:output', handleExecOutput);
    socket.on('exec:done', handleExecDone);
    socket.on('exec:error', handleExecError);
    socket.on('exec:started', handleExecStarted);

    return () => {
      socket.off('exec:output', handleExecOutput);
      socket.off('exec:done', handleExecDone);
      socket.off('exec:error', handleExecError);
      socket.off('exec:started', handleExecStarted);
    };
  }, [socket]);

  const handleRunCode = () => {
    if (!activeFile) {
      toast.error('Select a file to run');
      return;
    }
    if (!socket || !socket.connected) {
      toast.error('Socket not connected. Please refresh and try again.');
      return;
    }

    const currentCode =
      (monacoEditorInstance && monacoEditorInstance.getValue && monacoEditorInstance.getValue()) ||
      fileContents[activeFileId] ||
      activeFile.content ||
      '';

    setIsRunning(true);
    setIsInteractive(true);
    setIsOutputOpen(true);
    setOutput('');
    setOutputError('');
    setExecutionTime(null);

    socket.emit('exec:start', {
      language: activeFile.language || 'javascript',
      code: currentCode,
      roomId: roomId || undefined,
      fileId: activeFileId || undefined,
    });
  };

  const handleSendInput = (text) => {
    if (socket && socket.connected) {
      // Echo the input in the output panel
      setOutput((prev) => prev + text + '\n');
      socket.emit('exec:input', { text });
    }
  };

  const handleStopExecution = () => {
    if (socket && socket.connected) {
      socket.emit('exec:stop');
    }
    setIsRunning(false);
    setIsInteractive(false);
  };

  const handleExplainCode = async () => {
    if (!activeFile) return;
    const currentCode =
      (monacoEditorInstance && monacoEditorInstance.getValue && monacoEditorInstance.getValue()) ||
      fileContents[activeFileId] ||
      activeFile.content ||
      '';
    if (!currentCode.trim()) {
      toast.warning('Editor is empty. Add code first to explain.');
      return;
    }

    setIsExplaining(true);
    setIsOutputOpen(true);
    setOutput('🤖 Requesting AI explanation...');
    setOutputError('');

    try {
      const res = await aiApi.explainCode({
        language: activeFile.language || 'javascript',
        code: currentCode,
      });

      const explanationText =
        res?.explanation || res?.response || res?.data?.explanation || (typeof res === 'string' ? res : '');
      setOutput(explanationText || JSON.stringify(res, null, 2));
    } catch (err) {
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'AI service is currently unavailable.';
      setOutputError(errMsg);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    if (!activeFileId || !canEdit) return;
    try {
      await fileApi.updateFile(activeFileId, { language: newLang });
      setFiles((prev) =>
        prev.map((f) => ((f._id || f.id) === activeFileId ? { ...f, language: newLang } : f))
      );
      toast.success(`Language changed to ${newLang}`);
    } catch (err) {
      toast.error('Failed to change language');
    }
  };

  const handleRestoreVersion = (version) => {
    if (!activeFileId) return;
    const restoredContent = version.content || '';
    setFileContents((prev) => ({
      ...prev,
      [activeFileId]: restoredContent,
    }));
    if (monacoEditorInstance) {
      monacoEditorInstance.setValue(restoredContent);
    }
    setDirtyFileIds((prev) => new Set(prev).add(activeFileId));
  };

  return (
    <div className="editor-workspace">
      <TopBar
        room={room}
        isCollabConnected={isCollabConnected}
        participants={participants}
        onSave={handleSave}
        isSaving={isSaving}
        isDirty={dirtyFileIds.has(activeFileId)}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOwner={isOwner}
        toggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setIsHistoryOpen(false);
        }}
        isChatOpen={isChatOpen}
        toggleHistory={() => {
          setIsHistoryOpen((prev) => !prev);
          setIsChatOpen(false);
        }}
        isHistoryOpen={isHistoryOpen}
        onExplainCode={handleExplainCode}
        isExplaining={isExplaining}
        canEdit={canEdit}
      />

      <div className="editor-main-body">
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          canEdit={canEdit}
        />

        <section className="editor-center-area">
          <EditorTabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
            dirtyFileIds={dirtyFileIds}
          />

          <CodeEditor
            key={activeFileId || 'no-file'}
            language={activeFile?.language || 'javascript'}
            value={activeFileId ? fileContents[activeFileId] || '' : '// No file open'}
            onChange={handleCodeChange}
            onMount={(editor) => setMonacoEditorInstance(editor)}
            readOnly={!canEdit}
          />

          {isOutputOpen && (
            <OutputPanel
              output={output}
              error={outputError}
              loading={isRunning}
              executionTime={executionTime}
              isInteractive={isInteractive}
              onSendInput={handleSendInput}
              onStopExecution={handleStopExecution}
              onClear={() => {
                setOutput('');
                setOutputError('');
              }}
              onClose={() => setIsOutputOpen(false)}
            />
          )}

          <footer className="editor-statusbar">
            <div className="statusbar-section">
              <span>Role: <strong style={{ textTransform: 'capitalize' }}>{userRole}</strong></span>
              <span>•</span>
              <span>File: {activeFile?.name || 'None'}</span>
            </div>
            <div className="statusbar-section">
              <LanguageSelector
                language={activeFile?.language || 'javascript'}
                onChange={handleLanguageChange}
                disabled={!canEdit || !activeFile}
              />
              <button
                className="btn-ghost btn-sm"
                onClick={() => setIsOutputOpen((prev) => !prev)}
                style={{ fontSize: '0.75rem', height: '20px', padding: '0 4px' }}
              >
                {isOutputOpen ? 'Hide Terminal' : 'Show Terminal'}
              </button>
            </div>
          </footer>
        </section>

        {isChatOpen && (
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            currentUser={currentUser}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {isHistoryOpen && (
          <VersionHistory
            fileId={activeFileId}
            onRestore={handleRestoreVersion}
            onClose={() => setIsHistoryOpen(false)}
            canEdit={canEdit}
          />
        )}
      </div>

      <RoomSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        room={room}
        currentUserId={currentUserId}
        onUpdateRoom={onUpdateRoom}
        onDeleteRoom={onDeleteRoom}
        onUpdateMemberRole={onUpdateMemberRole}
        onRemoveMember={onRemoveMember}
      />
    </div>
  );
}
