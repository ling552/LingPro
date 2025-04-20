console.log('preload.js 开始加载');

try {
  const { contextBridge, ipcRenderer } = require('electron');
  const path = require('path');

  console.log('preload.js 模块已加载');

  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld('api', {
    // File system operations
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
    
    // Path utilities
    path: {
      dirname: (filePath) => path.dirname(filePath),
      basename: (filePath) => path.basename(filePath),
      join: (...args) => path.join(...args),
      resolve: (...args) => path.resolve(...args)
    },
    
    // File operations
    scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    openInExplorer: (filePath) => ipcRenderer.invoke('open-in-explorer', filePath),
    copyFile: (source, destination) => ipcRenderer.invoke('copy-file', source, destination),
    moveFile: (source, destination) => ipcRenderer.invoke('move-file', source, destination),
    deleteFile: (filePath, permanent) => ipcRenderer.invoke('delete-file', filePath, permanent),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
    readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
    
    // 回收站操作
    getRecycleItems: () => ipcRenderer.invoke('get-recycle-items'),
    emptyRecycleBin: () => ipcRenderer.invoke('empty-recycle-bin'),
    restoreFromRecycleBin: (filePath) => ipcRenderer.invoke('restore-from-recycle-bin', filePath),
    permanentDeleteFromRecycleBin: (filePath) => ipcRenderer.invoke('permanent-delete-from-recycle-bin', filePath),
    
    // 限制目录
    checkPathRestricted: (filePath, restrictedPaths) => ipcRenderer.invoke('check-path-restricted', filePath, restrictedPaths),
    
    // Format conversion
    convertImage: (filePath, format, options) => ipcRenderer.invoke('convert-image', filePath, format, options),
    convertAudio: (filePath, format, options) => ipcRenderer.invoke('convert-audio', filePath, format, options),
    convertVideo: (filePath, format, options) => ipcRenderer.invoke('convert-video', filePath, format, options),
    
    // Compression
    compressFiles: (files, options) => ipcRenderer.invoke('compress-files', files, options),
    
    // Settings
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    
    // App control
    minimizeWindow: () => {
      console.log('preload: 调用minimizeWindow');
      ipcRenderer.send('minimize-window');
    },
    maximizeWindow: () => {
      console.log('preload: 调用maximizeWindow');
      ipcRenderer.send('maximize-window');
    },
    closeWindow: () => {
      console.log('preload: 调用closeWindow');
      ipcRenderer.send('close-window');
    },
    
    // 事件监听
    onScanProgress: (callback) => {
      console.log('preload: 注册onScanProgress回调');
      const listener = (event, data) => {
        console.log('preload: 收到scan-progress事件', data);
        callback(data);
      };
      ipcRenderer.on('scan-progress', listener);
      return () => {
        console.log('preload: 移除scan-progress监听器');
        ipcRenderer.removeListener('scan-progress', listener);
      };
    },
    
    // 扫描完成事件监听
    onScanComplete: (callback) => {
      console.log('preload: 注册onScanComplete回调');
      const listener = (event, data) => {
        console.log('preload: 收到scan-complete事件', data);
        callback(data);
      };
      ipcRenderer.on('scan-complete', listener);
      return () => {
        console.log('preload: 移除scan-complete监听器');
        ipcRenderer.removeListener('scan-complete', listener);
      };
    },
    
    // 调试信息
    isReady: true,
    version: '1.0.0'
  });

  console.log('preload.js API已暴露，准备就绪');
} catch (error) {
  console.error('preload.js 加载失败:', error);
}
