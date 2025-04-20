// Context menu class to handle right-click operations
export class ContextMenu {
  constructor(app) {
    this.app = app;
    this.contextMenu = document.getElementById('context-menu');
    this.currentFilePath = null;
    this.currentFileStats = null;
    this.clipboard = {
      files: [],
      operation: null
    };
    
    // 初始化
    this.init();
  }
  
  // 初始化上下文菜单
  init() {
    console.log('初始化上下文菜单');
    
    // 关闭上下文菜单（点击外部区域）
    document.addEventListener('click', () => {
      this.hide();
    });
    
    // 阻止上下文菜单自身点击事件冒泡
    this.contextMenu.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    
    // 设置上下文菜单项事件
    this.setupContextMenuEvents();
  }
  
  // 设置上下文菜单项事件
  setupContextMenuEvents() {
    const menuItems = this.contextMenu.querySelectorAll('.context-menu-item');
    
    menuItems.forEach(item => {
      item.addEventListener('click', (event) => {
        // 如果是禁用项，不执行任何操作
        if (item.classList.contains('disabled')) {
          event.stopPropagation();
          return;
        }
        
        event.stopPropagation();
        
        const action = item.dataset.action;
        console.log('右键菜单操作:', action);
        this.handleContextMenuAction(action);
        
        this.hide();
      });
    });
  }
  
  // 显示上下文菜单
  show(event, filePath, fileStats) {
    event.preventDefault();
    console.log('显示右键菜单:', filePath);
    
    // 设置当前文件路径和文件状态
    this.currentFilePath = filePath;
    this.currentFileStats = fileStats || null;
    
    // 先将菜单设为可见但不显示（用于计算尺寸）
    this.contextMenu.style.visibility = 'hidden';
    this.contextMenu.classList.remove('hidden');
    
    // 获取菜单尺寸
    const menuRect = this.contextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    
    // 获取视窗尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 计算菜单位置，确保完全在视窗内
    let posX = event.clientX;
    let posY = event.clientY;
    
    // 如果菜单会超出右边界，则将其显示在左侧
    if (posX + menuWidth > viewportWidth) {
      posX = Math.max(0, posX - menuWidth);
    }
    
    // 如果菜单会超出下边界，则将其显示在上方
    if (posY + menuHeight > viewportHeight) {
      posY = Math.max(0, posY - menuHeight);
    }
    
    // 设置菜单位置
    this.contextMenu.style.left = `${posX}px`;
    this.contextMenu.style.top = `${posY}px`;
    
    // 最后使菜单可见
    this.contextMenu.style.visibility = 'visible';
    
    // 根据文件类型更新上下文菜单项
    this.updateContextMenuItems(filePath);
  }
  
  // 隐藏上下文菜单
  hide() {
    this.contextMenu.classList.add('hidden');
  }
  
  // 根据文件类型更新上下文菜单项
  updateContextMenuItems(filePath) {
    try {
      console.log('更新上下文菜单项:', filePath);
      
      // 获取文件扩展名
      const extension = filePath ? this.getFileExtension(filePath) : '';
      
      // 确定文件类型
      const fileType = this.getFileTypeByExtension(extension);
      console.log('文件类型:', fileType);
      
      // 获取所有菜单项
      const menuItems = this.contextMenu.querySelectorAll('.context-menu-item');
      
      // 根据文件类型启用/禁用项目
      menuItems.forEach(item => {
        const action = item.dataset.action;
        
        // 重置状态
        item.classList.remove('disabled');
        
        switch (action) {
          case 'open':
            // 禁用不支持的文件类型的直接打开
            if (!['images', 'audio', 'videos', 'documents', 'code'].includes(fileType)) {
              item.classList.add('disabled');
            }
            break;
            
          case 'open-external':
            // 所有文件都可以使用外部应用打开
            break;
            
          case 'convert':
            // 禁用不支持的文件类型的转换
            if (!['images', 'audio', 'videos', 'documents'].includes(fileType)) {
              item.classList.add('disabled');
            }
            break;
            
          case 'compress':
            // 除了已经是压缩文件外，所有文件都可以压缩
            break;
            
          case 'paste':
            // 如果剪贴板为空则禁用粘贴
            if (!this.clipboard || !this.clipboard.files || this.clipboard.files.length === 0) {
              item.classList.add('disabled');
            }
            break;
            
          case 'delete':
            // 检查是否有权限删除
            if (this.isPathRestricted(filePath)) {
              item.classList.add('disabled');
            }
            break;
            
          case 'recycle':
            // 检查是否有权限移到回收站
            if (this.isPathRestricted(filePath)) {
              item.classList.add('disabled');
            }
            break;
        }
      });
    } catch (error) {
      console.error('更新上下文菜单项失败:', error);
    }
  }
  
  // 处理上下文菜单操作
  async handleContextMenuAction(action) {
    if (!this.currentFilePath) return;
    
    try {
      console.log('处理上下文菜单操作:', action, '文件:', this.currentFilePath);
      
      switch (action) {
        case 'open':
          this.app.openFile(this.currentFilePath);
          break;
          
        case 'open-external':
          await window.api.openFile(this.currentFilePath);
          break;
          
        case 'open-in-explorer':
          await window.api.openInExplorer(this.currentFilePath);
          break;
          
        case 'copy':
          this.clipboard.files = [this.currentFilePath];
          this.clipboard.operation = 'copy';
          console.log('已复制到剪贴板:', this.currentFilePath);
          this.app.uiManager.showSuccess('已复制到剪贴板');
          break;
          
        case 'move':
          this.clipboard.files = [this.currentFilePath];
          this.clipboard.operation = 'cut';
          console.log('准备移动文件:', this.currentFilePath);
          this.app.uiManager.showSuccess('准备移动文件');
          break;
          
        case 'paste':
          if (this.clipboard.files && this.clipboard.files.length) {
            await this.pasteFiles();
          }
          break;
          
        case 'refresh':
          if (this.app.currentDirectory) {
            await this.app.loadDirectory(this.app.currentDirectory);
            console.log('已刷新目录');
            this.app.uiManager.showSuccess('已刷新目录');
          }
          break;
          
        case 'convert':
          this.showConvertDialog(this.currentFilePath);
          break;
          
        case 'compress':
          this.showCompressDialog(this.currentFilePath);
          break;
          
        case 'recycle':
          await this.moveToRecycleBin();
          break;
          
        case 'delete':
          await this.deleteFile();
          break;
          
        case 'properties':
          this.showPropertiesDialog(this.currentFilePath);
          break;
      }
    } catch (error) {
      console.error('处理上下文菜单操作失败:', action, error);
      this.app.uiManager.showError(`操作失败: ${error.message}`);
    }
  }
  
  // 粘贴文件
  async pasteFiles() {
    try {
      const files = this.clipboard.files;
      const operation = this.clipboard.operation;
      const targetDir = this.app.currentDirectory;
      
      if (!targetDir) {
        console.error('没有指定目标目录');
        this.app.uiManager.showError('没有指定目标目录');
        return;
      }
      
      // 显示加载指示器
      this.app.uiManager.showLoading();
      
      console.log(`开始${operation === 'copy' ? '复制' : '移动'}文件到:`, targetDir);
      
      for (const file of files) {
        const fileName = file.split(/[/\\]/).pop();
        const targetPath = `${targetDir}/${fileName}`;
        
        // 检查是否存在同名文件
        const exists = await window.api.fileExists(targetPath);
        if (exists) {
          const confirmed = confirm(`文件 "${fileName}" 已存在，是否覆盖？`);
          if (!confirmed) continue;
        }
        
        if (operation === 'copy') {
          await window.api.copyFile(file, targetPath);
          console.log('已复制文件:', file, '到', targetPath);
        } else if (operation === 'cut') {
          await window.api.moveFile(file, targetPath);
          console.log('已移动文件:', file, '到', targetPath);
        }
      }
      
      // 如果是剪切操作，清空剪贴板
      if (operation === 'cut') {
        this.clipboard.files = [];
        this.clipboard.operation = null;
      }
      
      // 刷新目录
      await this.app.loadDirectory(targetDir);
      
      // 隐藏加载指示器
      this.app.uiManager.hideLoading();
      this.app.uiManager.showSuccess(`文件已${operation === 'copy' ? '复制' : '移动'}`);
    } catch (error) {
      console.error('粘贴文件失败:', error);
      this.app.uiManager.showError('粘贴文件失败: ' + error.message);
      this.app.uiManager.hideLoading();
    }
  }
  
  // 将文件移动到回收站
  async moveToRecycleBin() {
    try {
      const fileName = this.currentFilePath.split(/[/\\]/).pop();
      
      // 如果设置了确认删除，则显示确认对话框
      if (this.app.settings.confirmDelete) {
        const confirmed = confirm(`确定要将 "${fileName}" 移动到回收站吗？`);
        if (!confirmed) return;
      }
      
      // 显示加载指示器
      this.app.uiManager.showLoading();
      
      // 移动到回收站
      await window.api.deleteFile(this.currentFilePath, false);
      
      // 刷新目录
      if (this.app.currentDirectory) {
        await this.app.loadDirectory(this.app.currentDirectory);
      }
      
      // 隐藏加载指示器
      this.app.uiManager.hideLoading();
      this.app.uiManager.showSuccess(`已将 "${fileName}" 移动到回收站`);
    } catch (error) {
      console.error('移动到回收站失败:', error);
      this.app.uiManager.showError('移动到回收站失败: ' + error.message);
      this.app.uiManager.hideLoading();
    }
  }
  
  // 永久删除文件
  async deleteFile() {
    try {
      const fileName = this.currentFilePath.split(/[/\\]/).pop();
      
      // 显示警告确认对话框
      const confirmed = confirm(`警告：此操作将永久删除 "${fileName}"，且无法恢复！确定要继续吗？`);
      if (!confirmed) return;
      
      // 显示加载指示器
      this.app.uiManager.showLoading();
      
      // 永久删除文件
      await window.api.deleteFile(this.currentFilePath, true);
      
      // 刷新目录
      if (this.app.currentDirectory) {
        await this.app.loadDirectory(this.app.currentDirectory);
      }
      
      // 隐藏加载指示器
      this.app.uiManager.hideLoading();
      this.app.uiManager.showSuccess(`已永久删除 "${fileName}"`);
    } catch (error) {
      console.error('删除文件失败:', error);
      this.app.uiManager.showError('删除文件失败: ' + error.message);
      this.app.uiManager.hideLoading();
    }
  }
  
  // 显示文件属性
  showPropertiesDialog(filePath) {
    try {
      console.log('显示文件属性:', filePath);
      if (this.app.modalManager && typeof this.app.modalManager.showPropertiesDialog === 'function') {
        this.app.modalManager.showPropertiesDialog(filePath);
      } else {
        console.error('showPropertiesDialog方法不存在');
        this.app.uiManager.showError('无法显示文件属性：系统功能不可用');
      }
    } catch (error) {
      console.error('显示文件属性失败:', error);
      this.app.uiManager.showError('显示文件属性失败: ' + error.message);
    }
  }
  
  // 显示转换对话框
  showConvertDialog(filePath) {
    try {
      console.log('显示转换对话框:', filePath);
      if (this.app.modalManager && typeof this.app.modalManager.showConvertDialog === 'function') {
        this.app.modalManager.showConvertDialog(filePath);
      } else {
        console.error('showConvertDialog方法不存在');
        this.app.uiManager.showError('无法显示转换对话框：系统功能不可用');
      }
    } catch (error) {
      console.error('显示转换对话框失败:', error);
      this.app.uiManager.showError('显示转换对话框失败: ' + error.message);
    }
  }
  
  // 显示压缩对话框
  showCompressDialog(filePath) {
    console.log('显示压缩对话框:', filePath);
    
    // 获取文件名
    const fileName = filePath.split(/[/\\]/).pop();
    const extension = this.getFileExtension(filePath);
    const fileType = this.getFileTypeByExtension(extension);
    
    // 创建模态对话框内容
    const dialogContent = `
      <div class="compress-settings">
        <div class="setting-item">
          <label for="compress-format">压缩格式:</label>
          <select id="compress-format">
            <option value="zip" selected>ZIP (最广泛支持)</option>
            <option value="7z">7Z (更高压缩率)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="compression-level">压缩级别:</label>
          <select id="compression-level">
            <option value="1">极速压缩 (最低压缩率)</option>
            <option value="3">快速压缩</option>
            <option value="6" selected>标准压缩</option>
            <option value="9">最大压缩 (速度较慢)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="split-size">分卷大小:</label>
          <select id="split-size">
            <option value="0" selected>不分卷</option>
            <option value="10">10MB</option>
            <option value="100">100MB</option>
            <option value="700">700MB (CD)</option>
            <option value="4700">4.7GB (DVD)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="compression-strategy">压缩策略:</label>
          <select id="compression-strategy">
            <option value="balanced" selected>平衡 (推荐)</option>
            <option value="size">优先大小</option>
            <option value="speed">优先速度</option>
          </select>
        </div>
      </div>
    `;
    
    // 确认回调函数
    const confirmCallback = async () => {
      try {
        // 获取压缩选项
        const format = document.getElementById('compress-format').value;
        const compressionLevel = parseInt(document.getElementById('compression-level').value);
        const splitSize = parseInt(document.getElementById('split-size').value);
        const strategy = document.getElementById('compression-strategy').value;
        
        // 显示进度提示
        this.app.uiManager.showSuccess('开始压缩文件...');
        
        // 调用压缩API
        const options = {
          compressionLevel,
          splitSize,
          strategy
        };
        
        const result = await window.api.compressFiles([filePath], options);
        
        if (result.success) {
          this.app.uiManager.showSuccess(`文件已成功压缩至: ${result.outputPath}`);
          
          // 刷新当前目录
          if (this.app.currentDirectory) {
            await this.app.loadDirectory(this.app.currentDirectory);
          }
        } else {
          this.app.uiManager.showError(`压缩失败: ${result.error}`);
        }
      } catch (error) {
        console.error('压缩文件失败:', error);
        this.app.uiManager.showError('压缩文件失败: ' + (error.message || '未知错误'));
      }
    };
    
    // 显示模态对话框
    this.app.modalManager.showModal({
      title: '压缩文件',
      content: dialogContent,
      confirmText: '压缩',
      cancelText: '取消',
      onConfirm: confirmCallback
    });
  }
  
  // 获取文件扩展名
  getFileExtension(filePath) {
    return filePath.split('.').pop().toLowerCase();
  }
  
  // 根据扩展名获取文件类型
  getFileTypeByExtension(extension) {
    const categories = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp', 'ico'],
      videos: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'flv', 'mkv'],
      audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
      spreadsheets: ['xls', 'xlsx', 'csv', 'ods'],
      presentations: ['ppt', 'pptx', 'odp'],
      archives: ['zip', 'rar', '7z', 'gz', 'tar', 'bz2'],
      code: ['js', 'html', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'ts', 'jsx', 'tsx']
    };
    
    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }
    
    return 'others';
  }
  
  // 检查路径是否受限
  isPathRestricted(filePath) {
    if (!this.app.settings || !this.app.settings.restrictedPaths) return false;
    
    for (const restrictedPath of this.app.settings.restrictedPaths) {
      if (filePath.startsWith(restrictedPath)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 处理多文件压缩
  async compressMultipleFiles(filePaths) {
    console.log('压缩多个文件:', filePaths);
    
    if (!filePaths || filePaths.length === 0) {
      console.error('没有选择要压缩的文件');
      return;
    }
    
    // 创建模态对话框内容
    const dialogContent = `
      <p class="compress-intro">已选择 ${filePaths.length} 个文件进行压缩</p>
      
      <div class="compress-settings">
        <div class="setting-item">
          <label for="compress-format">压缩格式:</label>
          <select id="compress-format">
            <option value="zip" selected>ZIP (最广泛支持)</option>
            <option value="7z">7Z (更高压缩率)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="compression-level">压缩级别:</label>
          <select id="compression-level">
            <option value="1">极速压缩 (最低压缩率)</option>
            <option value="3">快速压缩</option>
            <option value="6" selected>标准压缩</option>
            <option value="9">最大压缩 (速度较慢)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="split-size">分卷大小:</label>
          <select id="split-size">
            <option value="0" selected>不分卷</option>
            <option value="10">10MB</option>
            <option value="100">100MB</option>
            <option value="700">700MB (CD)</option>
            <option value="4700">4.7GB (DVD)</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label for="archive-name">压缩包名称:</label>
          <input type="text" id="archive-name" value="archive_${Date.now()}" placeholder="输入压缩包名称">
        </div>
      </div>
    `;
    
    // 确认回调函数
    const confirmCallback = async () => {
      try {
        // 获取压缩选项
        const format = document.getElementById('compress-format').value;
        const compressionLevel = parseInt(document.getElementById('compression-level').value);
        const splitSize = parseInt(document.getElementById('split-size').value);
        const archiveName = document.getElementById('archive-name').value;
        
        // 显示进度提示
        this.app.uiManager.showSuccess('开始压缩多个文件...');
        
        // 调用压缩API
        const options = {
          compressionLevel,
          splitSize,
          strategy: 'balanced',
          archiveName: archiveName
        };
        
        const result = await window.api.compressFiles(filePaths, options);
        
        if (result.success) {
          let successMessage = `文件已成功压缩至: ${result.outputPath}`;
          
          if (result.isVolume) {
            successMessage = `已创建 ${result.volumeCount} 个分卷压缩文件: ${result.outputPath}`;
          }
          
          this.app.uiManager.showSuccess(successMessage);
          
          // 刷新当前目录
          if (this.app.currentDirectory) {
            await this.app.loadDirectory(this.app.currentDirectory);
          }
        } else {
          this.app.uiManager.showError(`压缩失败: ${result.error}`);
        }
      } catch (error) {
        console.error('压缩多个文件失败:', error);
        this.app.uiManager.showError('压缩文件失败: ' + (error.message || '未知错误'));
      }
    };
    
    // 显示模态对话框
    this.app.modalManager.showModal({
      title: '压缩多个文件',
      content: dialogContent,
      confirmText: '压缩',
      cancelText: '取消',
      onConfirm: confirmCallback
    });
  }
}
