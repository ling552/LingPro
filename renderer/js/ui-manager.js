// UI manager class to handle UI interactions
export class UIManager {
  constructor(app) {
    this.app = app;
    
    // 初始化类属性
    this.toastContainer = null;
    this.loadingIndicator = null;
    this.loadingCount = 0;
    this.toasts = [];
    this.maxToasts = 5;
    this.scanProgressElement = null;
    // 侧边栏展开状态
    this.isSidebarExpanded = localStorage.getItem('sidebarExpanded') === 'true';
    
    // 初始化时绑定方法到实例
    this.showWelcome = this.showWelcome.bind(this);
    
    // 初始化UI
    this.initUI();
  }
  
  // 初始化UI组件
  initUI() {
    try {
      console.log('初始化UI开始');
      
      // 先准备必要的UI元素，确保基本功能可用
      this.prepareBasicUIElements();
      
      // 添加侧边栏切换功能
      this.initSidebarToggle();
      
      // 检查应用对象是否就绪
      if (!this.app) {
        console.warn('App对象未就绪，UI可能无法完全初始化');
      }
      
      // 初始化虚拟滚动器（不阻塞其他功能）
      setTimeout(() => {
        try {
          this.initVirtualScrollers();
        } catch (e) {
          console.error('初始化虚拟滚动器失败:', e);
        }
      }, 500);
      
      // 添加窗口大小调整处理程序
      window.addEventListener('resize', this.handleResize.bind(this));
      
      // 更新UI状态（安全地检查所有属性）
      this.safelyUpdateUIState();
      
      console.log('初始化UI完成');
    } catch (error) {
      console.error('初始化UI失败:', error);
      // 尝试显示错误提示
      try {
        this.createErrorToast();
        this.displayErrorMessage('初始化界面失败，应用可能无法正常工作');
      } catch (e) {
        console.error('创建错误提示失败:', e);
      }
    }
  }
  
  // 准备基本UI元素
  prepareBasicUIElements() {
    try {
      // 创建基本UI元素，即使其他部分失败，也能有最基本的UI功能
      if (!document.getElementById('loading-indicator')) {
        this.createLoadingIndicator();
      } else {
        this.loadingIndicator = document.getElementById('loading-indicator');
      }
      
      if (!document.getElementById('error-toast')) {
        this.createErrorToast();
      } else {
        this.errorToast = document.getElementById('error-toast');
      }
      
      if (!document.getElementById('success-toast')) {
        this.createSuccessToast();
      } else {
        this.successToast = document.getElementById('success-toast');
      }
      
      // 初始化文件列表元素引用
      this.fileList = document.getElementById('file-list');
      
      // 初始化扫描进度元素
      if (!document.querySelector('.scan-progress-container')) {
        this.initScanProgressElements();
      }
    } catch (error) {
      console.error('准备基本UI元素失败:', error);
    }
  }
  
  // 安全地更新UI状态
  safelyUpdateUIState() {
    try {
      // 安全地获取设置
      const settings = this.app?.settings || {};
      
      // 更新限制路径
      if (Array.isArray(settings.restrictedPaths)) {
        this.updateRestrictedPaths(settings.restrictedPaths);
      }
      
      // 设置默认路径显示
      const defaultPathDisplay = document.getElementById('default-path-display');
      if (defaultPathDisplay && settings.defaultPath) {
        defaultPathDisplay.textContent = settings.defaultPath;
      }
      
      // 尝试显示欢迎页面，但不阻塞其他功能
      setTimeout(() => {
        try {
          this.showWelcome();
        } catch (e) {
          console.error('显示欢迎页面失败:', e);
        }
      }, 100);
    } catch (error) {
      console.error('更新UI状态失败:', error);
    }
  }
  
  // Initialize UI components
  // initUI() {
  //   // Create loading indicator
  //   this.createLoadingIndicator();
  //   
  //   // Create error toast
  //   this.createErrorToast();
  //   
  //   // Create success toast
  //   this.createSuccessToast();
  //   
  //   // Initialize UI state
  //   this.updateRestrictedPaths(this.app.settings.restrictedPaths || []);
  //   
  //   // Set default path display if exists
  //   if (this.app.settings.defaultPath) {
  //     document.getElementById('default-path-display').textContent = this.app.settings.defaultPath;
  //   }
  //   
  //   // Set active theme
  //   const activeTheme = this.app.settings.theme || 'theme-light';
  //   document.querySelectorAll('.theme-option').forEach(option => {
  //     if (option.dataset.theme === activeTheme) {
  //       option.classList.add('active');
  //     }
  //   });
  //   
  //   // Initialize virtual scrollers
  //   this.initVirtualScrollers();
  //   
  //   // Add window resize handler
  //   window.addEventListener('resize', this.handleResize.bind(this));
  //   
  //   // 显示欢迎页面
  //   this.showWelcome();
  // }
  
  // 初始化虚拟滚动器
  async initVirtualScrollers() {
    try {
      // 等待VirtualScroller模块加载
      const { VirtualScroller } = await import('./virtual-scroller.js');
      
      // 文件列表滚动器
      const fileListContainer = document.getElementById('file-list');
      if (fileListContainer) {
        fileListContainer.classList.add('virtual-scroller');
        
        this.fileListScroller = new VirtualScroller({
          container: fileListContainer,
          itemHeight: 42, // 每个文件项的高度
          renderItem: (file) => this.renderFileItem(file)
        });
      }
      
      // 搜索结果滚动器
      const searchResultsContainer = document.getElementById('search-results');
      if (searchResultsContainer) {
        searchResultsContainer.classList.add('virtual-scroller');
        
        this.searchResultsScroller = new VirtualScroller({
          container: searchResultsContainer,
          itemHeight: 42, // 每个文件项的高度
          renderItem: (file) => this.renderFileItem(file)
        });
      }
      
      // 回收站文件滚动器
      const recycleFileList = document.getElementById('recycle-file-list');
      if (recycleFileList) {
        recycleFileList.classList.add('virtual-scroller');
        
        this.recycleFileScroller = new VirtualScroller({
          container: recycleFileList,
          itemHeight: 42, // 每个文件项的高度
          renderItem: (file) => this.renderFileItem(file)
        });
      }
    } catch (error) {
      console.error('初始化虚拟滚动器失败:', error);
    }
  }
  
  // Handle window resize
  handleResize() {
    if (this.fileListScroller) {
      this.fileListScroller.resize();
    }
    
    if (this.searchResultsScroller) {
      this.searchResultsScroller.resize();
    }
  }
  
  // Render a file item for virtual scroller
  renderFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.path = file.path;
    
    // Get file icon based on category
    const fileIcon = this.getFileIcon(file.category);
    
    // Format file size
    const fileSize = this.app.fileManager.formatFileSize(file.size);
    
    // Format modified date
    const modifiedDate = this.app.fileManager.formatDate(file.modifiedTime);
    
    fileItem.innerHTML = `
      <div class="file-name">
        <span class="file-icon">${fileIcon}</span>
        ${file.path.split(/[/\\]/).pop()}
      </div>
      <div class="file-size">${fileSize}</div>
      <div class="file-date">${modifiedDate}</div>
    `;
    
    // Add click event to open file
    fileItem.addEventListener('click', () => {
      this.app.openFile(file.path);
    });
    
    // Add context menu event
    fileItem.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this.app.showContextMenu(event, file.path);
    });
    
    return fileItem;
  }
  
  // Create loading indicator
  createLoadingIndicator() {
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'loading-indicator hidden';
    this.loadingIndicator.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading...</div>
    `;
    document.body.appendChild(this.loadingIndicator);
    
    // Add CSS for loading indicator
    const style = document.createElement('style');
    style.textContent = `
      .loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loading-text {
        color: white;
        margin-top: 10px;
        font-size: 16px;
      }
      
      .hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create error toast
  createErrorToast() {
    this.errorToast = document.createElement('div');
    this.errorToast.className = 'toast error-toast hidden';
    this.errorToast.setAttribute('role', 'alert'); // 添加无障碍支持
    this.errorToast.innerHTML = `
      <div class="toast-icon">✕</div>
      <div class="toast-message"></div>
      <div class="toast-close" aria-label="关闭">×</div>
    `;
    
    // 添加关闭按钮事件监听器
    this.errorToast.querySelector('.toast-close').addEventListener('click', () => {
      this.hideToast(this.errorToast);
    });
    
    // 添加触摸滑动关闭支持
    this.addSwipeToClose(this.errorToast);
    
    document.body.appendChild(this.errorToast);
    
    // 添加CSS样式
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          transform: translateY(20px);
          max-width: 350px;
          min-width: 300px;
        }
        
        .toast.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .toast-icon {
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .toast-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .toast-close {
          margin-left: 12px;
          cursor: pointer;
          font-size: 18px;
          opacity: 0.7;
          transition: opacity 0.2s;
          padding: 5px; /* 增大点击区域 */
        }
        
        .toast-close:hover {
          opacity: 1;
        }
        
        .error-toast {
          background-color: #fff2f0;
          border: 1px solid #ffccc7;
          color: #cf1322;
        }
        
        .error-toast .toast-icon {
          background-color: #ff4d4f;
          color: white;
          font-size: 12px;
        }
        
        .success-toast {
          background-color: #f6ffed;
          border: 1px solid #b7eb8f;
          color: #52c41a;
        }
        
        .success-toast .toast-icon {
          background-color: #52c41a;
          color: white;
          font-size: 12px;
        }
        
        @media (max-width: 768px) {
          .toast {
            left: 20px;
            right: 20px;
            max-width: calc(100% - 40px);
            min-width: auto;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .error-toast {
            background-color: rgba(255, 77, 79, 0.2);
            border-color: rgba(255, 77, 79, 0.3);
            color: #ff7875;
          }
          
          .success-toast {
            background-color: rgba(82, 196, 26, 0.2);
            border-color: rgba(82, 196, 26, 0.3);
            color: #95de64;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // 添加滑动关闭功能
  addSwipeToClose(element) {
    let touchStartX = 0;
    let touchStartY = 0;
    
    element.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      // 如果水平滑动大于垂直滑动且滑动距离大于50px
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        // 向右滑动关闭
        if (diffX < 0) {
          this.hideToast(element);
          touchStartX = 0;
          touchStartY = 0;
        }
      }
    }, { passive: true });
  }
  
  // 隐藏Toast的统一方法
  hideToast(toast) {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }
  
  // Create success toast
  createSuccessToast() {
    this.successToast = document.createElement('div');
    this.successToast.className = 'toast success-toast hidden';
    this.successToast.setAttribute('role', 'status'); // 添加无障碍支持
    this.successToast.innerHTML = `
      <div class="toast-icon">✓</div>
      <div class="toast-message"></div>
      <div class="toast-close" aria-label="关闭">×</div>
    `;
    
    // 添加关闭按钮事件监听器
    this.successToast.querySelector('.toast-close').addEventListener('click', () => {
      this.hideToast(this.successToast);
    });
    
    // 添加触摸滑动关闭支持
    this.addSwipeToClose(this.successToast);
    
    document.body.appendChild(this.successToast);
  }
  
  // 显示欢迎页面
  showWelcome() {
    try {
      console.log('跳过欢迎页面，直接进入主界面');
      
      // 直接切换到主页视图
      if (this.app && this.app.changeView) {
        this.app.changeView('home');
        
        // 如果有默认路径，则加载它
        const defaultPath = this.app?.settings?.defaultPath;
        if (defaultPath) {
          console.log('加载默认路径:', defaultPath);
          this.app.loadDirectory(defaultPath);
        } else {
          console.log('无默认路径，等待用户选择目录');
        }
      } else {
        console.warn('无法切换视图，app对象或changeView方法不可用');
      }
    } catch (error) {
      console.error('跳转到主界面时出错:', error);
    }
  }
  
  // 显示成功消息
  displaySuccessMessage(message) {
    if (!this.successToast) {
      this.createSuccessToast();
    }
    
    // 设置消息内容
    this.successToast.querySelector('.toast-message').textContent = message;
    
    // 显示Toast
    this.successToast.classList.remove('hidden');
    setTimeout(() => this.successToast.classList.add('visible'), 10);
    
    // 清除之前的定时器
    if (this.successToastTimeout) {
      clearTimeout(this.successToastTimeout);
    }
    
    // 3秒后自动隐藏
    this.successToastTimeout = setTimeout(() => {
      this.hideToast(this.successToast);
    }, 3000);
  }
  
  // 显示错误消息
  displayErrorMessage(message) {
    if (!this.errorToast) {
      this.createErrorToast();
    }
    
    // 设置消息内容
    this.errorToast.querySelector('.toast-message').textContent = message;
    
    // 显示Toast
    this.errorToast.classList.remove('hidden');
    setTimeout(() => this.errorToast.classList.add('visible'), 10);
    
    // 清除之前的定时器
    if (this.errorToastTimeout) {
      clearTimeout(this.errorToastTimeout);
    }
    
    // 5秒后自动隐藏 (错误提示显示时间更长)
    this.errorToastTimeout = setTimeout(() => {
      this.hideToast(this.errorToast);
    }, 5000);
  }
  
  // 显示加载中
  showLoading() {
    if (document.getElementById('loading-overlay')) return;
    
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
    `;
    
    document.body.appendChild(loading);
    
    // 同时显示旧的加载指示器（兼容性）
    this.loadingIndicator.classList.remove('hidden');
  }
  
  // 隐藏加载中
  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      document.body.removeChild(loading);
    }
    
    // 同时隐藏旧的加载指示器（兼容性）
    this.loadingIndicator.classList.add('hidden');
  }
  
  // 初始化扫描进度元素
  initScanProgressElements() {
    // 创建扫描进度条容器
    this.scanProgressContainer = document.createElement('div');
    this.scanProgressContainer.className = 'scan-progress-container';
    this.scanProgressContainer.style.display = 'none';
    
    // 创建进度条内容
    this.scanProgressContainer.innerHTML = `
      <div class="scan-progress-header">
        <span class="scan-progress-title">扫描目录中...</span>
        <button class="scan-progress-close">×</button>
      </div>
      <div class="scan-progress-status">准备中...</div>
      <div class="scan-progress-bar-container">
        <div class="scan-progress-bar"></div>
      </div>
      <div class="scan-progress-stats">
        已扫描: <span class="scan-file-count">0</span> 个文件
      </div>
    `;
    
    // 添加到文档
    document.body.appendChild(this.scanProgressContainer);
    
    // 获取元素引用
    this.scanProgressBar = this.scanProgressContainer.querySelector('.scan-progress-bar');
    this.scanProgressStatus = this.scanProgressContainer.querySelector('.scan-progress-status');
    this.scanFileCount = this.scanProgressContainer.querySelector('.scan-file-count');
    
    // 添加关闭按钮事件
    const closeButton = this.scanProgressContainer.querySelector('.scan-progress-close');
    closeButton.addEventListener('click', () => {
      this.hideScanProgress();
    });
  }
  
  // 显示扫描进度条
  showScanProgress() {
    this.scanProgressContainer.style.display = 'block';
    this.scanProgressBar.style.width = '0%';
    this.scanFileCount.textContent = '0';
    this.scanProgressStatus.textContent = '准备中...';
    
    // 添加动画效果
    setTimeout(() => {
      this.scanProgressContainer.classList.add('show');
    }, 10);
  }
  
  // 隐藏扫描进度条
  hideScanProgress() {
    this.scanProgressContainer.classList.remove('show');
    setTimeout(() => {
      this.scanProgressContainer.style.display = 'none';
    }, 300);
  }
  
  // 更新扫描进度状态
  updateScanProgressStatus(message, percent) {
    this.scanProgressStatus.textContent = message;
    this.scanProgressBar.style.width = `${percent}%`;
  }
  
  // 更新已扫描文件数量
  updateScanProgressCount(count) {
    this.scanFileCount.textContent = count.toString();
  }
  
  // 显示空目录提示
  showEmptyDirectory() {
    if (!this.fileList) return;
    
    this.fileList.innerHTML = `
      <div class="empty-directory">
        <div class="empty-icon">📂</div>
        <div class="empty-message">此目录为空</div>
      </div>
    `;
  }
  
  // 更新面包屑导航
  updateBreadcrumb(dirPath) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    // 清空面包屑
    breadcrumb.innerHTML = '';
    
    // 添加根目录
    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item';
    rootItem.textContent = '根目录';
    rootItem.addEventListener('click', () => {
      this.app.loadDirectory(dirPath.split(path.sep)[0] + path.sep);
    });
    breadcrumb.appendChild(rootItem);
    
    // 分割路径
    const parts = dirPath.split(path.sep).filter(Boolean);
    let currentPath = '';
    
    // 添加每个路径部分
    parts.forEach((part, index) => {
      // 添加分隔符
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '>';
      breadcrumb.appendChild(separator);
      
      // 更新当前路径
      currentPath += part + path.sep;
      
      // 添加路径项
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = part;
      
      // 为最后一项添加当前类
      if (index === parts.length - 1) {
        item.classList.add('current');
      } else {
        // 为非最后一项添加点击事件
        item.addEventListener('click', () => {
          this.app.loadDirectory(currentPath);
        });
      }
      
      breadcrumb.appendChild(item);
    });
    
    // 更新当前路径显示
    const currentPathElement = document.getElementById('current-path');
    if (currentPathElement) {
      currentPathElement.textContent = dirPath;
    }
  }
  
  // Update file list
  updateFileList(files) {
    try {
      // 确保获取到文件列表元素
      if (!this.fileList) {
        this.fileList = document.getElementById('file-list');
        if (!this.fileList) {
          console.error('未找到文件列表元素');
          return;
        }
      }
      
      if (!files || files.length === 0) {
        this.fileList.innerHTML = '<div class="empty-message">没有文件</div>';
        return;
      }
      
      if (this.fileListScroller) {
        this.fileListScroller.setItems(files);
      } else {
        // 如果虚拟滚动器未初始化，尝试重新初始化
        this.initVirtualScrollers().then(() => {
          if (this.fileListScroller) {
            this.fileListScroller.setItems(files);
          } else {
            // 回退到传统渲染方式
            this.renderFileListTraditional(files);
          }
        }).catch(error => {
          console.error('初始化虚拟滚动器失败，使用传统渲染:', error);
          this.renderFileListTraditional(files);
        });
      }
    } catch (error) {
      console.error('更新文件列表失败:', error);
      // 回退到传统渲染方式
      this.renderFileListTraditional(files);
    }
  }
  
  // 传统方式渲染文件列表（不使用虚拟滚动）
  renderFileListTraditional(files) {
    // 确保获取到文件列表元素
    if (!this.fileList) {
      this.fileList = document.getElementById('file-list');
      if (!this.fileList) {
        console.error('文件列表元素不存在');
        return;
      }
    }
    
    this.fileList.innerHTML = '';
    
    if (!files || files.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = '没有文件';
      this.fileList.appendChild(emptyMessage);
      return;
    }
    
    files.forEach(file => {
      const fileItem = this.renderFileItem(file);
      this.fileList.appendChild(fileItem);
    });
  }
  
  // Update search results
  updateSearchResults(files) {
    if (this.searchResultsScroller) {
      this.searchResultsScroller.setItems(files);
    } else {
      // Fallback to traditional rendering if virtual scroller is not initialized
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = '';
      
      if (files.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '没有匹配的文件';
        searchResults.appendChild(emptyMessage);
        return;
      }
      
      files.forEach(file => {
        const fileItem = this.renderFileItem(file);
        searchResults.appendChild(fileItem);
      });
    }
  }
  
  // Update category counts
  updateCategoryCounts(counts) {
    try {
      console.log('更新分类计数:', counts);
      
      if (!counts) {
        console.error('分类计数为空');
        return;
      }
      
      Object.keys(counts).forEach(category => {
        try {
          const selector = `.category-card[data-category="${category}"] .category-count`;
          console.log('查找分类元素:', selector);
          
          const countElement = document.querySelector(selector);
          if (countElement) {
            console.log(`更新"${category}"分类计数为:`, counts[category]);
            countElement.textContent = counts[category];
          } else {
            console.warn(`未找到"${category}"分类计数元素`);
          }
        } catch (error) {
          console.error(`更新"${category}"分类计数时出错:`, error);
        }
      });
      
      console.log('分类计数更新完成');
    } catch (error) {
      console.error('更新分类计数失败:', error);
    }
  }
  
  // 更新限制路径列表
  updateRestrictedPaths(paths) {
    try {
      const restrictedPathsList = document.getElementById('restricted-paths');
      if (!restrictedPathsList) return;
      
      restrictedPathsList.innerHTML = '';
      
      if (!paths || paths.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '没有限制目录';
        restrictedPathsList.appendChild(emptyMessage);
        return;
      }
      
      paths.forEach((path, index) => {
        const pathItem = document.createElement('div');
        pathItem.className = 'restricted-path-item';
        
        pathItem.innerHTML = `
          <div class="path-text">${path}</div>
          <button class="remove-path-btn" data-index="${index}">删除</button>
        `;
        
        restrictedPathsList.appendChild(pathItem);
      });
      
      // 添加删除按钮事件
      document.querySelectorAll('.remove-path-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          this.app.settings.restrictedPaths.splice(index, 1);
          this.updateRestrictedPaths(this.app.settings.restrictedPaths);
          this.app.saveSettings();
          this.displaySuccessMessage('限制目录已删除');
        });
      });
    } catch (error) {
      console.error('更新限制路径列表失败:', error);
    }
  }
  
  // Get file icon based on category
  getFileIcon(category) {
    if (!category) {
      return '📄'; // 默认文件图标
    }
    
    switch (category) {
      case 'directory': return '📁';
      case 'images': return '🖼️';
      case 'videos': return '🎬';
      case 'audio': return '🎵';
      case 'documents': return '📄';
      case 'spreadsheets': return '📊';
      case 'presentations': return '📑';
      case 'archives': return '📦';
      case 'code': return '📝';
      case 'others': return '📄';
      default: return '📄';
    }
  }
  
  // Open image viewer
  openImageViewer(filePath) {
    // Create modal for image viewer
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="image-viewer">
        <div class="image-viewer-header">
          <div class="image-title">${filePath.split(/[/\\]/).pop()}</div>
          <button class="close-btn">✕</button>
        </div>
        <div class="image-container">
          <img src="file://${filePath}" alt="Image">
        </div>
      </div>
    `;
    
    // Add CSS for image viewer
    const style = document.createElement('style');
    style.textContent = `
      .image-viewer {
        background-color: var(--bg-secondary);
        border-radius: 10px;
        overflow: hidden;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }
      
      .image-viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .close-btn {
        background: transparent;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-primary);
      }
      
      .image-container {
        overflow: auto;
        max-height: calc(90vh - 50px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .image-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    `;
    document.head.appendChild(style);
    
    // Add close button event
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    document.body.appendChild(modal);
  }
  
  // Open text editor
  openTextEditor(filePath) {
    // This would be implemented to open a text editor for markdown and text files
    // For now, just open with system default
    window.api.openFile(filePath);
  }
  
  // Open PDF viewer
  openPdfViewer(filePath) {
    // Create modal for PDF viewer
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="pdf-viewer">
        <div class="pdf-viewer-header">
          <div class="pdf-title">${filePath.split(/[/\\]/).pop()}</div>
          <button class="close-btn">✕</button>
        </div>
        <div class="pdf-container">
          <iframe src="file://${filePath}" frameborder="0"></iframe>
        </div>
      </div>
    `;
    
    // Add CSS for PDF viewer
    const style = document.createElement('style');
    style.textContent = `
      .pdf-viewer {
        background-color: var(--bg-secondary);
        border-radius: 10px;
        overflow: hidden;
        width: 90vw;
        height: 90vh;
        display: flex;
        flex-direction: column;
      }
      
      .pdf-viewer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 20px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .pdf-title {
        font-weight: bold;
        color: var(--text-primary);
      }
      
      .close-btn {
        background: transparent;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: var(--text-primary);
      }
      
      .pdf-container {
        flex: 1;
        overflow: hidden;
      }
      
      .pdf-container iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    // Add close button event
    modal.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Fallback if iframe doesn't work for PDF
    const iframe = modal.querySelector('iframe');
    iframe.onerror = () => {
      // If iframe fails to load, use system default
      window.api.openFile(filePath);
      document.body.removeChild(modal);
    };
    
    document.body.appendChild(modal);
  }
  
  //兼容旧方法调用
  showSuccess(message) {
    this.displaySuccessMessage(message);
  }
  
  //兼容旧方法调用
  showError(message) {
    this.displayErrorMessage(message);
  }
  
  // 初始化侧边栏切换功能
  initSidebarToggle() {
    // 创建侧边栏切换按钮
    const toggle = document.createElement('button');
    toggle.className = 'sidebar-toggle';
    toggle.setAttribute('aria-label', this.isSidebarExpanded ? '收起侧边栏' : '展开侧边栏');
    toggle.setAttribute('title', this.isSidebarExpanded ? '收起侧边栏' : '展开侧边栏');
    toggle.setAttribute('tabindex', '0');
    toggle.innerHTML = `<span class="toggle-icon">${this.isSidebarExpanded ? '◀' : '▶'}</span>`;
    
    // 在DOM中移除可能已存在的按钮
    const existingToggle = document.querySelector('.sidebar-toggle');
    if (existingToggle) {
      existingToggle.remove();
    }
    
    // 添加到主容器，而不是sidebar内部，避免被其他内容遮挡
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.appendChild(toggle);
    } else {
      document.body.appendChild(toggle);
    }
    
    // 点击事件处理
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      
      // 切换侧边栏状态
      this.isSidebarExpanded = !this.isSidebarExpanded;
      
      // 更新类名和状态
      if (this.isSidebarExpanded) {
        sidebar.classList.add('expanded');
        toggle.setAttribute('aria-label', '收起侧边栏');
        toggle.setAttribute('title', '收起侧边栏');
        toggle.querySelector('.toggle-icon').textContent = '◀';
      } else {
        sidebar.classList.remove('expanded');
        toggle.setAttribute('aria-label', '展开侧边栏');
        toggle.setAttribute('title', '展开侧边栏');
        toggle.querySelector('.toggle-icon').textContent = '▶';
      }
      
      // 保存用户偏好
      localStorage.setItem('sidebarExpanded', this.isSidebarExpanded);
      
      // 防止冒泡，避免触发其他事件
      return false;
    });
    
    // 确保图标状态与侧边栏状态同步
    const updateToggleIcon = () => {
      const sidebar = document.querySelector('.sidebar');
      const icon = toggle.querySelector('.toggle-icon');
      if (sidebar && icon) {
        const isExpanded = sidebar.classList.contains('expanded');
        icon.textContent = isExpanded ? '◀' : '▶';
        toggle.setAttribute('aria-label', isExpanded ? '收起侧边栏' : '展开侧边栏');
        toggle.setAttribute('title', isExpanded ? '收起侧边栏' : '展开侧边栏');
      }
    };
    
    // 监听侧边栏悬停事件，以更新按钮图标
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.addEventListener('mouseenter', () => {
        setTimeout(updateToggleIcon, 100);
      });
      sidebar.addEventListener('mouseleave', () => {
        setTimeout(updateToggleIcon, 300);
      });
    }
    
    // 初始化时立即更新一次图标
    updateToggleIcon();
  }
  
  // 初始化活动侧边栏项
  initActiveSidebarItem() {
    try {
      // 获取所有侧边栏项
      const sidebarItems = document.querySelectorAll('.sidebar-item');
      
      // 为每个侧边栏项添加点击事件
      sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
          // 移除所有项的活动状态
          sidebarItems.forEach(i => i.classList.remove('active'));
          
          // 添加当前项的活动状态
          item.classList.add('active');
          
          // 保存活动项的ID或数据属性
          if (item.id || item.dataset.view) {
            const itemId = item.id || item.dataset.view;
            localStorage.setItem('activeSidebarItem', itemId);
          }
        });
      });
      
      // 加载已保存的活动项
      const savedActiveItem = localStorage.getItem('activeSidebarItem');
      if (savedActiveItem) {
        const activeItem = document.getElementById(savedActiveItem) || 
                          document.querySelector(`.sidebar-item[data-view="${savedActiveItem}"]`);
        if (activeItem) {
          // 移除所有项的活动状态
          sidebarItems.forEach(i => i.classList.remove('active'));
          
          // 添加保存的活动状态
          activeItem.classList.add('active');
        }
      } else {
        // 默认第一个项为活动状态
        if (sidebarItems.length > 0) {
          sidebarItems[0].classList.add('active');
        }
      }
    } catch (error) {
      console.error('初始化活动侧边栏项失败:', error);
    }
  }
  
  // 更新切换按钮状态
  updateToggleButton(sidebar, toggleBtn) {
    try {
      const isExpanded = sidebar.classList.contains('expanded');
      toggleBtn.title = isExpanded ? '收起侧边栏' : '展开侧边栏';
      toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      
      // 不需要手动设置图标旋转，通过CSS控制
      
      console.log(`侧边栏状态: ${isExpanded ? '展开' : '收起'}`);
    } catch (error) {
      console.error('更新切换按钮状态失败:', error);
    }
  }

  /**
   * 创建侧边栏切换按钮
   * @returns {HTMLElement} 侧边栏切换按钮
   */
  createSidebarToggleButton() {
    const button = document.createElement('button');
    button.id = 'sidebar-toggle';
    button.className = 'sidebar-toggle-btn';
    button.title = this.isSidebarExpanded ? '收起侧边栏' : '展开侧边栏';
    
    // 设置按钮图标
    const icon = document.createElement('i');
    icon.className = `fa-solid ${this.isSidebarExpanded ? 'fa-chevron-left' : 'fa-chevron-right'}`;
    button.appendChild(icon);
    
    // 添加点击事件监听器
    button.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      
      // 切换侧边栏展开状态
      this.isSidebarExpanded = !this.isSidebarExpanded;
      
      // 更新侧边栏类
      if (this.isSidebarExpanded) {
        sidebar.classList.remove('collapsed');
        button.title = '收起侧边栏';
        icon.className = 'fa-solid fa-chevron-left';
      } else {
        sidebar.classList.add('collapsed');
        button.title = '展开侧边栏';
        icon.className = 'fa-solid fa-chevron-right';
      }
      
      // 保存用户偏好
      localStorage.setItem('sidebarExpanded', this.isSidebarExpanded);
    });
    
    // 鼠标悬停效果
    button.addEventListener('mouseenter', () => {
      icon.classList.add('fa-beat-fade');
    });
    
    button.addEventListener('mouseleave', () => {
      icon.classList.remove('fa-beat-fade');
    });
    
    return button;
  }

  /**
   * 更新关于部分的版本号
   * @param {string} version 应用版本号
   */
  updateAboutVersion(version) {
    const versionElement = document.querySelector('.app-version');
    if (versionElement) {
      versionElement.textContent = `版本 ${version || '1.0.0'}`;
    } else {
      console.warn('找不到版本元素');
    }
  }
}
