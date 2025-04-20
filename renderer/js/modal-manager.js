// Modal manager class to handle dialog windows
export class ModalManager {
  constructor(app) {
    this.app = app;
    this.modalOverlay = document.getElementById('modal-overlay');
    this.convertDialog = document.getElementById('convert-dialog');
    this.propertiesDialog = document.getElementById('properties-dialog');
    
    // Set up modal close buttons
    this.setupCloseButtons();
  }
  
  // Set up modal close buttons
  setupCloseButtons() {
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.hideAllDialogs();
      });
    });
    
    // Close when clicking on overlay
    this.modalOverlay.addEventListener('click', (event) => {
      if (event.target === this.modalOverlay) {
        this.hideAllDialogs();
      }
    });
    
    // Cancel button in convert dialog
    document.getElementById('convert-cancel').addEventListener('click', () => {
      this.hideAllDialogs();
    });
  }
  
  // Show convert dialog
  showConvertDialog(filePath) {
    // Get file type
    const fileType = this.app.fileManager.getFileType(filePath);
    const fileName = filePath.split(/[/\\]/).pop();
    
    // Get convert format select element
    const formatSelect = document.getElementById('convert-format');
    formatSelect.innerHTML = '';
    
    // Populate format options based on file type
    let formats = [];
    
    switch (fileType) {
      case 'image':
        formats = ['jpg', 'png', 'webp', 'gif', 'bmp'];
        break;
        
      case 'audio':
        formats = ['mp3', 'wav', 'aac', 'flac', 'ogg'];
        break;
        
      case 'video':
        formats = ['mp4', 'avi', 'mov', 'webm', 'flv'];
        break;
        
      case 'document':
        formats = ['pdf', 'docx', 'txt'];
        break;
        
      default:
        // No conversion options for this file type
        this.app.uiManager.showError('This file type cannot be converted');
        return;
    }
    
    // Remove current extension from formats
    const currentExt = fileName.split('.').pop().toLowerCase();
    formats = formats.filter(ext => ext !== currentExt);
    
    // Add options to select
    formats.forEach(format => {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format.toUpperCase();
      formatSelect.appendChild(option);
    });
    
    // Set up convert button
    document.getElementById('convert-confirm').onclick = async () => {
      const targetFormat = formatSelect.value;
      
      // Show loading indicator
      this.app.uiManager.showLoading();
      
      try {
        // Get convert settings
        const settings = this.getConvertSettings(fileType);
        
        // Call convert function based on file type
        let result;
        
        switch (fileType) {
          case 'image':
            result = await window.api.convertImage(filePath, targetFormat, settings);
            break;
            
          case 'audio':
            result = await window.api.convertAudio(filePath, targetFormat, settings);
            break;
            
          case 'video':
            result = await window.api.convertVideo(filePath, targetFormat, settings);
            break;
            
          case 'document':
            // Document conversion would be implemented here
            break;
        }
        
        // Hide dialog
        this.hideAllDialogs();
        
        // Hide loading indicator
        this.app.uiManager.hideLoading();
        
        // Refresh directory if successful
        if (result && result.success) {
          if (this.app.currentDirectory) {
            await this.app.loadDirectory(this.app.currentDirectory);
          }
          
          // Show success message
          this.app.uiManager.showSuccess(`File converted successfully: ${result.outputPath}`);
        } else {
          // Show error message
          this.app.uiManager.showError(`Failed to convert file: ${result ? result.error : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error converting file:', error);
        this.app.uiManager.showError('Failed to convert file: ' + error.message);
        this.app.uiManager.hideLoading();
      }
    };
    
    // Update convert settings UI
    this.updateConvertSettings(fileType);
    
    // Show dialog
    this.modalOverlay.classList.remove('hidden');
    this.convertDialog.classList.remove('hidden');
  }
  
  // Update convert settings UI based on file type
  updateConvertSettings(fileType) {
    const settingsContainer = document.getElementById('convert-settings');
    settingsContainer.innerHTML = '';
    
    switch (fileType) {
      case 'image':
        settingsContainer.innerHTML = `
          <div class="setting-item">
            <label for="image-quality">Quality:</label>
            <input type="range" id="image-quality" min="1" max="100" value="80">
            <span id="quality-value">80%</span>
          </div>
          <div class="setting-item">
            <label for="image-resize">Resize:</label>
            <select id="image-resize">
              <option value="original">Original Size</option>
              <option value="half">Half Size</option>
              <option value="quarter">Quarter Size</option>
              <option value="custom">Custom Size</option>
            </select>
          </div>
          <div class="setting-item custom-size hidden">
            <label for="image-width">Width:</label>
            <input type="number" id="image-width" min="1" value="800">
            <label for="image-height">Height:</label>
            <input type="number" id="image-height" min="1" value="600">
          </div>
        `;
        
        // Add event listeners
        const qualitySlider = document.getElementById('image-quality');
        const qualityValue = document.getElementById('quality-value');
        qualitySlider.addEventListener('input', () => {
          qualityValue.textContent = `${qualitySlider.value}%`;
        });
        
        const resizeSelect = document.getElementById('image-resize');
        const customSizeDiv = document.querySelector('.custom-size');
        resizeSelect.addEventListener('change', () => {
          if (resizeSelect.value === 'custom') {
            customSizeDiv.classList.remove('hidden');
          } else {
            customSizeDiv.classList.add('hidden');
          }
        });
        break;
        
      case 'audio':
        settingsContainer.innerHTML = `
          <div class="setting-item">
            <label for="audio-bitrate">Bitrate:</label>
            <select id="audio-bitrate">
              <option value="128">128 kbps</option>
              <option value="192">192 kbps</option>
              <option value="256">256 kbps</option>
              <option value="320">320 kbps</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="audio-channels">Channels:</label>
            <select id="audio-channels">
              <option value="2">Stereo</option>
              <option value="1">Mono</option>
            </select>
          </div>
        `;
        break;
        
      case 'video':
        settingsContainer.innerHTML = `
          <div class="setting-item">
            <label for="video-quality">Quality:</label>
            <select id="video-quality">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div class="setting-item">
            <label for="video-resolution">Resolution:</label>
            <select id="video-resolution">
              <option value="original">Original</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
        `;
        break;
    }
  }
  
  // Get convert settings from UI
  getConvertSettings(fileType) {
    const settings = {};
    
    switch (fileType) {
      case 'image':
        settings.quality = parseInt(document.getElementById('image-quality').value, 10);
        settings.resize = document.getElementById('image-resize').value;
        
        if (settings.resize === 'custom') {
          settings.width = parseInt(document.getElementById('image-width').value, 10);
          settings.height = parseInt(document.getElementById('image-height').value, 10);
        }
        break;
        
      case 'audio':
        settings.bitrate = parseInt(document.getElementById('audio-bitrate').value, 10);
        settings.channels = parseInt(document.getElementById('audio-channels').value, 10);
        break;
        
      case 'video':
        settings.quality = document.getElementById('video-quality').value;
        settings.resolution = document.getElementById('video-resolution').value;
        break;
    }
    
    return settings;
  }
  
  // Show properties dialog
  async showPropertiesDialog(filePath) {
    try {
      // Get file info
      const fileInfo = await this.app.fileManager.getFileInfo(filePath);
      
      // Get file properties container
      const propertiesContainer = document.getElementById('file-properties');
      
      // Format file size
      const fileSize = this.app.fileManager.formatFileSize(fileInfo.size);
      
      // Format modified date
      const modifiedDate = this.app.fileManager.formatDate(fileInfo.modifiedTime);
      
      // Get file type
      const fileType = this.app.fileManager.getFileType(filePath);
      
      // Get file extension
      const fileExtension = filePath.split('.').pop().toLowerCase();

      // Get file name
      const fileName = filePath.split(/[/\\]/).pop();
      
      // Get file location (directory)
      const fileLocation = filePath.substring(0, filePath.lastIndexOf(/[/\\]/));
      
      // Get type icon
      const typeIcon = this.getFileTypeIcon(fileType, fileExtension);
      
      // Update properties container
      propertiesContainer.innerHTML = `
        <div class="file-type-icon">${typeIcon}</div>
        
        <div class="property-item file-name">
          <div class="property-label">名称:</div>
          <div class="property-value">${fileName}</div>
        </div>
        
        <div class="property-item">
          <div class="property-label">类型:</div>
          <div class="property-value">${this.getFileTypeName(fileType)} (${fileExtension.toUpperCase()})</div>
        </div>
        
        <div class="property-item">
          <div class="property-label">大小:</div>
          <div class="property-value">${fileSize}</div>
        </div>
        
        <div class="property-item">
          <div class="property-label">位置:</div>
          <div class="property-value">${fileLocation}</div>
        </div>
        
        <div class="property-item">
          <div class="property-label">修改时间:</div>
          <div class="property-value">${modifiedDate}</div>
        </div>
        
        <div class="property-item">
          <div class="property-label">创建时间:</div>
          <div class="property-value">${this.app.fileManager.formatDate(fileInfo.createdTime || fileInfo.birthTime)}</div>
        </div>
      `;
      
      // 更新对话框标题
      const dialogTitle = document.querySelector('#properties-dialog .modal-header h3');
      if (dialogTitle) {
        dialogTitle.textContent = '文件属性';
      }
      
      // Show dialog
      this.modalOverlay.classList.remove('hidden');
      this.propertiesDialog.classList.remove('hidden');
    } catch (error) {
      console.error('Error showing properties:', error);
      this.app.uiManager.showError('Failed to show properties: ' + error.message);
    }
  }
  
  // Get file type icon
  getFileTypeIcon(fileType, extension) {
    switch (fileType) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'document':
        if (extension === 'pdf') return '📕';
        if (['doc', 'docx'].includes(extension)) return '📘';
        if (['xls', 'xlsx'].includes(extension)) return '📊';
        if (['ppt', 'pptx'].includes(extension)) return '📝';
        return '📄';
      case 'archive':
        return '📦';
      case 'code':
        return '💻';
      default:
        return '📄';
    }
  }
  
  // Get file type name
  getFileTypeName(fileType) {
    switch (fileType) {
      case 'image':
        return '图片';
      case 'video':
        return '视频';
      case 'audio':
        return '音频';
      case 'document':
        return '文档';
      case 'archive':
        return '压缩文件';
      case 'code':
        return '代码';
      default:
        return '文件';
    }
  }
  
  // Hide all dialogs
  hideAllDialogs() {
    this.modalOverlay.classList.add('hidden');
    this.convertDialog.classList.add('hidden');
    this.propertiesDialog.classList.add('hidden');
    
    // 移除任何临时对话框
    const tempDialog = document.querySelector('.temp-dialog');
    if (tempDialog) {
      tempDialog.remove();
    }
  }
  
  // 显示通用模态框
  showModal(options = {}) {
    try {
      // 设置默认选项
      const defaultOptions = {
        title: '提示',
        content: '',
        confirmText: '确认',
        cancelText: '取消',
        showCancel: true,
        onConfirm: null,
        onCancel: null,
        width: 'auto'
      };
      
      // 合并选项
      const modalOptions = { ...defaultOptions, ...options };
      
      // 移除任何现有的临时对话框
      const existingTempDialog = document.getElementById('temp-modal-dialog');
      if (existingTempDialog) {
        existingTempDialog.remove();
      }
      
      // 创建对话框元素
      const dialogElement = document.createElement('div');
      dialogElement.className = 'modal-dialog temp-dialog';
      dialogElement.id = 'temp-modal-dialog';
      if (modalOptions.width !== 'auto') {
        dialogElement.style.width = modalOptions.width;
      }
      
      // 设置对话框内容
      dialogElement.innerHTML = `
        <div class="modal-header">
          <h3>${modalOptions.title}</h3>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-content">
          ${modalOptions.content}
        </div>
        <div class="modal-footer">
          ${modalOptions.showCancel ? `<button class="btn-secondary">${modalOptions.cancelText}</button>` : ''}
          <button class="btn-primary">${modalOptions.confirmText}</button>
        </div>
      `;
      
      // 添加到模态层
      this.modalOverlay.appendChild(dialogElement);
      
      // 获取按钮元素
      const closeBtn = dialogElement.querySelector('.modal-close');
      const confirmBtn = dialogElement.querySelector('.btn-primary');
      const cancelBtn = dialogElement.querySelector('.btn-secondary');
      
      // 关闭按钮事件
      closeBtn.addEventListener('click', () => {
        if (modalOptions.onCancel && typeof modalOptions.onCancel === 'function') {
          modalOptions.onCancel();
        }
        this.hideAllDialogs();
      });
      
      // 确认按钮事件
      confirmBtn.addEventListener('click', () => {
        if (modalOptions.onConfirm && typeof modalOptions.onConfirm === 'function') {
          modalOptions.onConfirm();
        }
        if (!modalOptions.keepOpen) {
          this.hideAllDialogs();
        }
      });
      
      // 取消按钮事件
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          if (modalOptions.onCancel && typeof modalOptions.onCancel === 'function') {
            modalOptions.onCancel();
          }
          this.hideAllDialogs();
        });
      }
      
      // 显示对话框
      this.modalOverlay.classList.remove('hidden');
      
      return dialogElement;
    } catch (error) {
      console.error('显示模态框时出错:', error);
      return null;
    }
  }
}
