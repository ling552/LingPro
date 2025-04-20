console.log('app.js 已加载');
console.log('window.api', window.api);

// Import modules
import { FileManager } from './file-manager.js';
import { UIManager } from './ui-manager.js';
import { MediaPlayer } from './media-player.js';
import { ContextMenu } from './context-menu.js';
import { ModalManager } from './modal-manager.js';

// 主应用类
class App {
  constructor() {
    console.log('App 构造函数调用');
    // 状态变量
    this.currentDirectory = null;
    this.currentCategory = null;
    this.currentFiles = [];
    this.searchQuery = '';
    
    // 组件实例
    this.fileManager = new FileManager();
    this.uiManager = new UIManager(this);
    this.mediaPlayer = new MediaPlayer();
    this.contextMenu = new ContextMenu(this);
    this.modalManager = new ModalManager(this);
    
    // 设置
    this.settings = {};
    
    // 多文件选择状态
    this.selectedFiles = [];
    this.isMultiSelectMode = false;
    
    // 初始化应用
    this.initialize();
  }
  
  // 初始化应用
  async initialize() {
    console.log('Initializing application...');
    
    try {
      this.loadSettings();
      
      // 使用已保存的主题，确保传入正确的theme参数
      if (this.settings && this.settings.theme) {
        this.applyTheme(this.settings.theme);
      } else {
        this.applyTheme('light'); // 默认使用亮色主题
      }
      
      // 隐藏欢迎页面，直接显示文件管理器
      const welcomeContainer = document.getElementById('welcome-container');
      const fileManagerContainer = document.getElementById('file-manager-container');
      
      if (welcomeContainer && fileManagerContainer) {
        welcomeContainer.style.display = 'none';
        fileManagerContainer.style.display = 'flex';
        
        // 检查是否有默认路径，如果有则加载
        const defaultPath = this.settings.defaultPath;
        if (defaultPath) {
          this.fileManager.loadPath(defaultPath);
        } else {
          // 如果没有默认路径，显示空状态提示
          this.showEmptyStateMessage();
        }
      } else {
        console.warn('Welcome or file manager container not found.');
      }
      
      // 绑定控制按钮事件
      this.setupEventListeners();
      
      // 初始化扫描进度监听
      this.initScanProgressListener();
      
      // 获取并显示应用版本
      if (window.api && typeof window.api.getAppVersion === 'function') {
        window.api.getAppVersion().then(version => {
          this.uiManager.updateAboutVersion(version);
        }).catch(err => {
          console.error('获取应用版本失败:', err);
        });
      }
      
      console.log('应用初始化完成');
    } catch (error) {
      console.error('Error initializing application:', error);
    }
  }
  
  // 加载设置
  async loadSettings() {
    try {
      const savedSettings = localStorage.getItem('lingpro-settings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
        
        // 不再在这里应用主题，只更新主题选择UI状态
        if (this.settings.theme) {
          this.updateThemeSelection(this.settings.theme);
        }
        
        // 加载默认路径
        if (this.settings.defaultPath) {
          const defaultPathDisplay = document.getElementById('default-path-display');
          if (defaultPathDisplay) {
            defaultPathDisplay.textContent = this.settings.defaultPath;
          }
        }
        
        // 加载删除前确认设置
        if (this.settings.confirmDelete !== undefined) {
          const confirmDeleteCheckbox = document.getElementById('confirm-delete');
          if (confirmDeleteCheckbox) {
            confirmDeleteCheckbox.checked = this.settings.confirmDelete;
          }
        }
        
        // 加载限制路径
        this.loadRestrictedPaths();
      } else {
        // 默认设置
        this.settings = {
          theme: 'light',
          confirmDelete: true,
          restrictedPaths: []
        };
        
        // 应用默认主题
        this.applyTheme('light');
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      
      // 设置默认值
      this.settings = {
        theme: 'light',
        confirmDelete: true,
        restrictedPaths: []
      };
      
      // 应用默认主题
      this.applyTheme('light');
    }
  }
  
  // 保存设置
  saveSettings() {
    try {
      localStorage.setItem('lingpro-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }
  
  // 应用主题
  applyTheme(theme) {
    const body = document.body;
    
    // 如果没有指定主题，则使用保存的主题或默认主题
    if (!theme && this.settings && this.settings.theme) {
      theme = this.settings.theme;
    } else if (!theme) {
      theme = 'light'; // 默认主题
    }
    
    // 移除所有主题类
    body.classList.remove(
      'theme-light', 
      'theme-dark', 
      'theme-pink-blue', 
      'theme-pink-black', 
      'theme-white-pink', 
      'theme-purple-blue'
    );
    
    if (theme === 'system') {
      // 检测系统主题
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('theme-dark');
      } else {
        body.classList.add('theme-light');
      }
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
          body.classList.remove('theme-light');
          body.classList.add('theme-dark');
        } else {
          body.classList.remove('theme-dark');
          body.classList.add('theme-light');
        }
      });
    } else {
      // 应用指定主题
      body.classList.add(`theme-${theme}`);
    }
    
    // 保存主题设置
    if (theme) {
      this.settings.theme = theme;
      this.saveSettings();
      this.updateThemeSelection(theme);
    }
  }
  
  // 保证事件绑定在 DOMContentLoaded 后执行
  setupEventListeners() {
    try {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this._bindAllEvents());
      } else {
        this._bindAllEvents();
      }
    } catch (error) {
      console.error('setupEventListeners 初始化失败:', error);
    }
  }
  
  // 统一事件绑定逻辑
  _bindAllEvents() {
    console.log('_bindAllEvents 调用');
    
    // 检查 window.api
    if (!window.api) {
      console.error('window.api 未注入');
    } else {
      console.log('window.api 已注入', window.api);
    }
    
    // 窗口控制按钮
    const minimizeBtn = document.getElementById('minimize-btn');
    if (minimizeBtn) {
      console.log('找到最小化按钮', minimizeBtn);
      minimizeBtn.addEventListener('click', () => {
        console.log('最小化按钮点击');
        try { 
          window.api.minimizeWindow && window.api.minimizeWindow(); 
        } catch (e) { 
          console.error('最小化失败', e); 
        }
      });
    } else {
      console.warn('未找到最小化按钮');
    }
    
    const maximizeBtn = document.getElementById('maximize-btn');
    if (maximizeBtn) {
      console.log('找到最大化按钮', maximizeBtn);
      maximizeBtn.addEventListener('click', () => {
        console.log('最大化按钮点击');
        try { 
          window.api.maximizeWindow && window.api.maximizeWindow(); 
        } catch (e) { 
          console.error('最大化失败', e); 
        }
      });
    } else {
      console.warn('未找到最大化按钮');
    }
    
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      console.log('找到关闭按钮', closeBtn);
      closeBtn.addEventListener('click', () => {
        console.log('关闭按钮点击');
        try { 
          window.api.closeWindow && window.api.closeWindow(); 
        } catch (e) { 
          console.error('关闭失败', e); 
        }
      });
    } else {
      console.warn('未找到关闭按钮');
    }
    
    // 侧边栏导航
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    if (sidebarItems.length === 0) {
      console.warn('未找到任何侧边栏导航项');
    } else {
      console.log('找到侧边栏导航项', sidebarItems.length);
    }
    
    // 为所有侧边栏导航项添加点击事件
    // 移除了对回收站的处理
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        console.log('侧边栏项点击', item.dataset.view);
        const view = item.dataset.view;
        if (!view) { 
          console.error('导航项缺少 data-view'); 
          return; 
        }
        try {
          this.changeView(view);
        } catch (e) {
          console.error(e);
        }
      });
    });
    
    // 主页面功能按钮
    const selectDirBtn = document.getElementById('select-directory-btn');
    if (selectDirBtn) {
      console.log('找到选择目录按钮', selectDirBtn);
      selectDirBtn.addEventListener('click', () => {
        console.log('选择目录按钮点击');
        try { 
          this.selectDirectory && this.selectDirectory(); 
        } catch (e) { 
          console.error('选择目录失败', e); 
        }
      });
    } else {
      console.warn('未找到选择目录按钮');
    }
    
    // 设置页按钮
    const defaultPathBtn = document.getElementById('default-path-btn');
    if (defaultPathBtn) {
      console.log('找到默认路径按钮', defaultPathBtn);
      defaultPathBtn.addEventListener('click', () => {
        console.log('默认路径按钮点击');
        try { 
          this.setDefaultPath && this.setDefaultPath(); 
        } catch (e) { 
          console.error('设置默认路径失败', e); 
        }
      });
    } else {
      console.warn('未找到默认路径按钮');
    }
    
    // 添加限制目录按钮
    const addRestrictedPathBtn = document.getElementById('add-restricted-path');
    if (addRestrictedPathBtn) {
      console.log('找到添加限制目录按钮', addRestrictedPathBtn);
      addRestrictedPathBtn.addEventListener('click', () => {
        console.log('添加限制目录按钮点击');
        try { 
          this.addRestrictedPath && this.addRestrictedPath(); 
        } catch (e) { 
          console.error('添加限制目录失败', e); 
        }
      });
    } else {
      console.warn('未找到添加限制目录按钮');
    }
    
    // 删除确认选项
    const confirmDeleteCheckbox = document.getElementById('confirm-delete');
    if (confirmDeleteCheckbox) {
      console.log('找到删除确认复选框', confirmDeleteCheckbox);
      confirmDeleteCheckbox.addEventListener('change', () => {
        console.log('删除确认复选框变更:', confirmDeleteCheckbox.checked);
        this.settings.confirmDelete = confirmDeleteCheckbox.checked;
        this.saveSettings();
      });
    } else {
      console.warn('未找到删除确认复选框');
    }
    
    // 返回按钮
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    if (backToHomeBtn) {
      console.log('找到返回主页按钮', backToHomeBtn);
      backToHomeBtn.addEventListener('click', () => {
        console.log('返回主页按钮点击');
        try {
          this.changeView('home');
        } catch (e) {
          console.error('返回主页失败', e);
        }
      });
    }
    
    // 主题切换
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        console.log('主题选项点击', option.dataset.theme);
        const theme = option.dataset.theme;
        if (theme) {
          // 首先移除所有选项的active类
          document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('active');
          });
          
          // 添加当前选项的active类
          option.classList.add('active');
          
          // 应用主题并保存设置
          this.applyTheme(theme);
        }
      });
    });
    
    // 分类卡片点击事件
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        console.log('分类卡片点击', card.dataset.category);
        const category = card.dataset.category;
        if (category) {
          this.showCategoryFiles(category);
        }
      });
    });
    
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      console.log('找到搜索输入框', searchInput);
      searchInput.addEventListener('input', () => {
        console.log('搜索输入:', searchInput.value);
        this.searchQuery = searchInput.value;
        this.searchFiles();
      });
    } else {
      console.warn('未找到搜索输入框');
    }
    
    // 搜索类型下拉框
    const searchType = document.getElementById('search-type');
    if (searchType) {
      console.log('找到搜索类型下拉框', searchType);
      searchType.addEventListener('change', () => {
        console.log('搜索类型变更:', searchType.value);
        this.searchFiles();
      });
    } else {
      console.warn('未找到搜索类型下拉框');
    }
    
    // 图片格式下拉框
    const imageFormatSelect = document.getElementById('default-image-format');
    if (imageFormatSelect) {
      console.log('找到图片格式下拉框', imageFormatSelect);
      imageFormatSelect.addEventListener('change', () => {
        console.log('图片格式变更:', imageFormatSelect.value);
        if (!this.settings.conversion) {
          this.settings.conversion = {};
        }
        this.settings.conversion.defaultImageFormat = imageFormatSelect.value;
        this.saveSettings();
      });
    }
    
    // 视频格式下拉框
    const videoFormatSelect = document.getElementById('default-video-format');
    if (videoFormatSelect) {
      console.log('找到视频格式下拉框', videoFormatSelect);
      videoFormatSelect.addEventListener('change', () => {
        console.log('视频格式变更:', videoFormatSelect.value);
        if (!this.settings.conversion) {
          this.settings.conversion = {};
        }
        this.settings.conversion.defaultVideoFormat = videoFormatSelect.value;
        this.saveSettings();
      });
    }
    
    // 多文件选择模式按钮事件绑定
    const multiSelectBtn = document.getElementById('multi-select-btn');
    if (multiSelectBtn) {
      multiSelectBtn.addEventListener('click', () => this.toggleMultiSelectMode());
    }
    
    // 全选按钮
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.toggleSelectAll());
    }
    
    // 压缩选中文件按钮
    const compressSelectedBtn = document.getElementById('compress-selected-btn');
    if (compressSelectedBtn) {
      compressSelectedBtn.addEventListener('click', () => this.compressSelectedFiles());
    }
    
    console.log('所有事件绑定完成');
  }
  
  // 初始化扫描进度监听
  initScanProgressListener() {
    console.log('初始化扫描进度监听');
    try {
      if (!window.api || !window.api.onScanProgress) {
        console.error('API未注入或onScanProgress方法不存在');
        return;
      }
      
      // 监听扫描进度更新
      this.scanProgressUnsubscribe = window.api.onScanProgress((progress) => {
        console.log('收到扫描进度更新', progress);
        
        if (!progress) {
          console.error('进度数据为空');
          return;
        }
        
        // 防止处理不兼容的进度数据
        const total = progress.total || 0;
        const processed = progress.processed || 0;
        const status = progress.status || '';
        const message = progress.message || '';
        
        if (total > 0) {
          const percent = Math.round((processed / total) * 100);
          
          // 更新进度条
          const progressBar = document.querySelector('.scan-progress-bar');
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
          
          // 更新进度文本
          const progressText = document.querySelector('.scan-progress-text');
          if (progressText) {
            progressText.textContent = `扫描中... ${processed}/${total} (${percent}%)`;
          }
          
          // 显示进度条
          const progressContainer = document.querySelector('.scan-progress-container');
          if (progressContainer) {
            progressContainer.classList.remove('hidden');
          }
        }
        
        // 如果是批处理状态，更新UI
        if (status === 'batch') {
          // 可以在这里实现增量更新UI的逻辑
          const count = progress.count || 0;
          const batchSize = progress.batchSize || 0;
          console.log(`已处理文件: ${count}, 当前批次: ${batchSize}`);
        }
        
        // 如果是完成状态，隐藏进度条
        if (status === 'complete') {
          this.hideScanProgress();
        }
      });
      
      // 监听扫描完成
      if (window.api.onScanComplete) {
        this.scanCompleteUnsubscribe = window.api.onScanComplete(() => {
          console.log('扫描完成');
          this.hideScanProgress();
        });
      }
      
      console.log('扫描进度监听器初始化完成');
    } catch (error) {
      console.error('初始化扫描进度监听失败', error);
    }
  }
  
  // 隐藏扫描进度
  hideScanProgress() {
    console.log('隐藏扫描进度');
    // 隐藏进度条
    const progressContainer = document.querySelector('.scan-progress-container');
    if (progressContainer) {
      progressContainer.classList.add('hidden');
    }
    
    // 重置进度条
    const progressBar = document.querySelector('.scan-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }
  
  // 加载目录
  async loadDirectory(dirPath) {
    try {
      console.log('加载目录开始:', dirPath);
      
      // 检查路径是否受限
      if (await this.isPathRestricted(dirPath)) {
        this.uiManager.showError(`无法访问受限目录: ${dirPath}`);
        return;
      }
      
      this.currentDirectory = dirPath;
      this.currentCategory = null;
      
      // 显示加载中状态
      this.uiManager.showLoading();
      
      console.log('调用 scanDirectory:', dirPath);
      // 扫描目录
      const files = await window.api.scanDirectory(dirPath);
      console.log('scanDirectory 返回文件数量:', files ? files.length : 0);
      
      // 隐藏加载中状态
      this.uiManager.hideLoading();
      
      if (!files || files.length === 0) {
        console.log('目录为空');
        this.uiManager.showEmptyDirectory();
        return;
      }
      
      // 处理文件分类
      console.log('处理文件分类');
      const processedFiles = files.map(file => {
        // 添加分类信息
        if (file.isDirectory) {
          file.category = 'directory';
        } else {
          const extension = this.getFileExtension(file.path).toLowerCase();
          file.category = this.getCategoryByExtension(extension);
        }
        return file;
      });
      
      console.log('处理后文件数量:', processedFiles.length);
      console.log('目录数量:', processedFiles.filter(f => f.isDirectory).length);
      
      // 保存文件列表
      this.currentFiles = processedFiles;
      
      // 更新FileManager中的文件数据
      this.updateFileManagerData(processedFiles);
      
      // 更新UI
      this.uiManager.updateBreadcrumb(dirPath);
      this.updateFileList(processedFiles);
      
      // 更新分类计数
      const counts = this.getFileCounts(processedFiles);
      this.uiManager.updateCategoryCounts(counts);
      
      // 切换到文件视图
      this.changeView('home');

      // 添加返回上一级目录按钮，如果不是根目录
      console.log('更新导航控件');
      this.updateNavigationControls(dirPath);
      
      console.log('加载目录完成');
    } catch (error) {
      console.error('加载目录失败:', error);
      this.uiManager.hideLoading();
      this.uiManager.showError(`加载目录失败: ${error.message}`);
    }
  }
  
  // 获取文件扩展名
  getFileExtension(filePath) {
    return filePath.split('.').pop() || '';
  }
  
  // 根据扩展名获取文件分类
  getCategoryByExtension(extension) {
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
  
  // 获取文件分类计数
  getFileCounts(files) {
    const counts = {
      directory: 0,
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
      spreadsheets: 0,
      presentations: 0,
      archives: 0,
      code: 0,
      others: 0
    };
    
    files.forEach(file => {
      if (file.isDirectory) {
        counts.directory++;
      } else if (file.category) {
        if (counts[file.category] !== undefined) {
          counts[file.category]++;
        } else {
          counts.others++;
        }
      }
    });
    
    console.log('文件分类计数:', counts);
    return counts;
  }
  
  // 显示分类文件
  showCategoryFiles(category) {
    try {
      console.log('显示分类文件', category);
      this.currentCategory = category;
      
      // 从当前文件列表中筛选出指定分类的文件
      const files = this.currentFiles.filter(file => file.category === category);
      
      console.log(`找到${files.length}个${category}文件`);
      
      if (files.length === 0) {
        console.warn(`没有找到${this.getCategoryName(category)}文件`);
        this.uiManager.showError(`没有${this.getCategoryName(category)}文件`);
        return;
      }
      
      // 更新分类标题
      const categoryTitle = document.getElementById('category-title');
      if (categoryTitle) {
        categoryTitle.textContent = `${this.getCategoryName(category)}文件`;
      } else {
        console.warn('未找到分类标题元素');
      }
      
      // 更新文件列表
      const categoryFileList = document.getElementById('category-file-list');
      if (categoryFileList) {
        // 清空现有内容
        categoryFileList.innerHTML = '';
        
        // 添加文件
        files.forEach(file => {
          try {
            const fileItem = this.renderFileItem(file);
            categoryFileList.appendChild(fileItem);
          } catch (e) {
            console.error('添加文件项失败', e);
          }
        });
      } else {
        console.warn('未找到分类文件列表元素');
      }
      
      // 切换到文件视图
      this.changeView('files');
    } catch (error) {
      console.error('显示分类文件失败:', error);
      this.uiManager.showError(`显示分类文件失败: ${error.message}`);
    }
  }
  
  // 重写渲染文件项方法，添加多选功能
  renderFileItem(file) {
    console.log('渲染文件项:', file.name);
    
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.path = file.path;
    fileItem.dataset.isDirectory = file.isDirectory;
    
    // 文件名区域（包含图标和名称）
    const fileNameCell = document.createElement('div');
    fileNameCell.className = 'file-name-cell';
    
    const fileIcon = document.createElement('span');
    fileIcon.className = 'file-icon';
    fileIcon.textContent = file.isDirectory ? '📁' : this.getFileIcon(file.category);
    
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    fileNameCell.appendChild(fileIcon);
    fileNameCell.appendChild(fileName);
    
    // 文件大小
    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = file.isDirectory ? '--' : this.formatFileSize(file.size);
    
    // 修改日期
    const fileDate = document.createElement('div');
    fileDate.className = 'file-date';
    fileDate.textContent = this.formatDate(file.modifiedTime);
    
    // 添加到文件项
    fileItem.appendChild(fileNameCell);
    fileItem.appendChild(fileSize);
    fileItem.appendChild(fileDate);
    
    // 处理多选模式样式
    if (this.isMultiSelectMode) {
      fileItem.classList.add('multi-select-mode');
      if (this.selectedFiles.includes(file.path)) {
        fileItem.classList.add('selected');
      }
    }
    
    // 添加点击事件
    fileItem.addEventListener('click', (event) => {
      if (this.isMultiSelectMode) {
        // 在多选模式下，点击切换选择状态
        this.toggleFileSelection(file.path, event);
      } else {
        // 在普通模式下，打开文件或目录
        if (file.isDirectory) {
          this.loadDirectory(file.path);
        } else {
          this.openFile(file.path);
        }
      }
    });
    
    // 右键菜单
    fileItem.addEventListener('contextmenu', (event) => {
      this.showContextMenu(event, file.path, file);
    });
    
    return fileItem;
  }
  
  // 获取文件图标
  getFileIcon(category) {
    switch (category) {
      case 'directory':
        return '📁';
      case 'images':
        return '🖼️';
      case 'videos':
        return '🎬';
      case 'audio':
        return '🎵';
      case 'documents':
        return '📄';
      case 'spreadsheets':
        return '📊';
      case 'presentations':
        return '📑';
      case 'archives':
        return '🗜️';
      case 'code':
        return '👨‍💻';
      default:
        return '📝';
    }
  }
  
  // 获取分类的中文名称
  getCategoryName(category) {
    const categoryNames = {
      'images': '图片',
      'videos': '视频',
      'audio': '音频',
      'documents': '文档',
      'spreadsheets': '表格',
      'presentations': '演示文稿',
      'archives': '压缩文件',
      'code': '代码',
      'others': '其他'
    };
    
    return categoryNames[category] || category;
  }
  
  // 更新FileManager中的文件数据
  updateFileManagerData(files) {
    console.log('更新FileManager数据，文件数:', files.length);
    
    // 初始化分类数据
    this.fileManager.filesByCategory = {
      directory: [],
      images: [],
      videos: [],
      audio: [],
      documents: [],
      spreadsheets: [],
      presentations: [],
      archives: [],
      code: [],
      others: []
    };
    
    // 添加文件到对应分类
    files.forEach(file => {
      if (file.isDirectory) {
        this.fileManager.filesByCategory.directory.push(file);
      } else if (file.category && this.fileManager.filesByCategory[file.category]) {
        this.fileManager.filesByCategory[file.category].push(file);
      } else {
        this.fileManager.filesByCategory.others.push(file);
      }
    });
    
    // 更新所有文件
    this.fileManager.files = files;
    
    console.log('FileManager更新完成，目录数:', this.fileManager.filesByCategory.directory.length);
  }
  
  // 搜索文件
  searchFiles() {
    if (!this.currentFiles || this.currentFiles.length === 0) {
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    const searchType = document.getElementById('search-type').value;
    
    if (!query) {
      // 如果搜索查询为空，显示所有文件
      this.updateSearchResults(this.currentFiles);
      return;
    }
    
    // 过滤文件
    let filteredFiles = this.currentFiles.filter(file => {
      const fileName = file.path.split(/[/\\]/).pop().toLowerCase();
      return fileName.includes(query);
    });
    
    // 如果选择了特定类别，进一步过滤
    if (searchType !== 'all') {
      filteredFiles = filteredFiles.filter(file => file.category === searchType);
    }
    
    // 更新搜索结果
    this.updateSearchResults(filteredFiles);
  }
  
  // 更新搜索结果
  updateSearchResults(files) {
    try {
      console.log('更新搜索结果', files.length);
      
      const searchResultsElement = document.getElementById('search-results');
      if (!searchResultsElement) {
        console.error('未找到搜索结果元素');
        return;
      }
      
      // 清空现有结果
      searchResultsElement.innerHTML = '';
      
      if (files.length === 0) {
        searchResultsElement.innerHTML = '<div class="empty-message">没有找到匹配的文件</div>';
        return;
      }
      
      // 添加搜索结果
      files.forEach(file => {
        try {
          const fileItem = this.renderFileItem(file);
          searchResultsElement.appendChild(fileItem);
        } catch (error) {
          console.error('添加搜索结果项失败', error);
        }
      });
      
      console.log('搜索结果更新完成');
    } catch (error) {
      console.error('更新搜索结果失败', error);
    }
  }
  
  // 切换视图
  changeView(view) {
    // 排除回收站视图
    if (view === 'recycle') {
      console.log('回收站功能已禁用');
      return;
    }
    
    // 隐藏所有视图
    document.querySelectorAll('.view-container').forEach(container => {
      container.classList.add('hidden');
    });
    
    // 显示指定视图
    const viewContainer = document.getElementById(`${view}-view`);
    if (viewContainer) {
      viewContainer.classList.remove('hidden');
    }
    
    // 更新侧边栏选中项
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.view === view) {
        item.classList.add('active');
      }
    });
  }
  
  // 打开文件
  async openFile(filePath) {
    try {
      const extension = this.getFileExtension(filePath).toLowerCase();
      
      // 图片文件
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
        // 使用图片查看器打开
        this.uiManager.openImageViewer(filePath);
      }
      // 视频文件
      else if (['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv'].includes(extension)) {
        // 使用媒体播放器播放视频
        this.mediaPlayer.playVideo(filePath);
      }
      // 音频文件
      else if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(extension)) {
        // 使用媒体播放器播放音频
        this.mediaPlayer.playAudio(filePath);
      }
      // 文本文件
      else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(extension)) {
        // 使用文本编辑器打开
        this.uiManager.openTextEditor(filePath);
      }
      // PDF文件
      else if (extension === 'pdf') {
        // 使用PDF查看器打开
        this.uiManager.openPdfViewer(filePath);
      }
      // 其他文件
      else {
        // 使用系统默认程序打开
        await window.api.openFile(filePath);
      }
    } catch (error) {
      console.error('打开文件失败:', error);
      this.uiManager.showError(`打开文件失败: ${error.message}`);
    }
  }
  
  // 加载回收站内容 - 已禁用
  async loadRecycleBin() {
    console.log('回收站功能已禁用');
    return;
  }
  
  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
  }
  
  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  // 检查路径是否受限
  async isPathRestricted(filePath) {
    if (!this.settings.restrictedPaths || this.settings.restrictedPaths.length === 0) {
      return false;
    }
    
    // 检查路径是否在限制列表中
    for (const restrictedPath of this.settings.restrictedPaths) {
      if (filePath.startsWith(restrictedPath)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 更新主题选择
  updateThemeSelection(theme) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.theme === theme) {
        option.classList.add('active');
      }
    });
  }
  
  // 加载限制路径
  loadRestrictedPaths() {
    const restrictedPaths = this.settings.restrictedPaths || [];
    const restrictedPathsContainer = document.getElementById('restricted-paths');
    
    if (restrictedPathsContainer) {
      restrictedPathsContainer.innerHTML = '';
      
      restrictedPaths.forEach(path => {
        const pathItem = document.createElement('div');
        pathItem.className = 'restricted-path-item';
        
        const pathText = document.createElement('div');
        pathText.className = 'restricted-path-text';
        pathText.textContent = path;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-path-btn';
        removeBtn.textContent = '✖';
        removeBtn.addEventListener('click', () => {
          this.settings.restrictedPaths = this.settings.restrictedPaths.filter(p => p !== path);
          this.saveSettings();
          this.loadRestrictedPaths();
        });
        
        pathItem.appendChild(pathText);
        pathItem.appendChild(removeBtn);
        restrictedPathsContainer.appendChild(pathItem);
      });
    }
  }
  
  // 选择目录方法
  async selectDirectory() {
    try {
      console.log('选择目录方法开始执行');
      
      if (!window.api) {
        console.error('API未注入');
        this.uiManager.showError('无法选择目录：API未初始化');
        return;
      }
      
      if (!window.api.openDirectoryDialog) {
        console.error('openDirectoryDialog方法不存在');
        this.uiManager.showError('无法选择目录：目录选择对话框功能不可用');
        return;
      }
      
      console.log('调用openDirectoryDialog');
      const paths = await window.api.openDirectoryDialog();
      console.log('openDirectoryDialog返回:', paths);
      
      if (!paths || paths.length === 0) {
        console.log('未选择任何目录');
        return; // 用户取消了选择，不显示错误
      }
      
      const dirPath = paths[0];
      console.log('选择的目录:', dirPath);
      
      // 显示加载中状态
      this.uiManager.showLoading();
      
      try {
        await this.loadDirectory(dirPath);
        
        // 更新UI显示路径
        const currentPathElement = document.getElementById('current-path');
        if (currentPathElement) {
          currentPathElement.textContent = dirPath;
        }
      } catch (loadError) {
        console.error('加载目录失败:', loadError);
        this.uiManager.showError(`加载目录失败: ${loadError.message}`);
      } finally {
        // 确保加载状态被隐藏
        this.uiManager.hideLoading();
      }
    } catch (error) {
      console.error('选择目录过程发生错误:', error);
      this.uiManager.showError(`选择目录失败: ${error.message}`);
    }
  }
  
  // 设置默认路径方法
  async setDefaultPath() {
    try {
      if (!window.api || !window.api.openDirectoryDialog) {
        console.error('API未注入或openDirectoryDialog方法不存在');
        return;
      }
      
      const paths = await window.api.openDirectoryDialog();
      
      if (paths && paths.length > 0) {
        const dirPath = paths[0];
        
        // 更新设置
        this.settings.defaultPath = dirPath;
        this.saveSettings();
        
        // 更新UI
        const defaultPathDisplay = document.getElementById('default-path-display');
        if (defaultPathDisplay) {
          defaultPathDisplay.textContent = dirPath;
        }
      }
    } catch (error) {
      console.error('设置默认路径失败:', error);
    }
  }
  
  // 更新文件列表
  updateFileList(files) {
    try {
      console.log('更新文件列表', files.length);
      console.log('目录数量:', files.filter(f => f.isDirectory).length);
      
      const fileListElement = document.getElementById('file-list');
      
      if (!fileListElement) {
        console.error('未找到文件列表元素');
        return;
      }
      
      // 清空现有列表
      fileListElement.innerHTML = '';
      
      // 添加文件项
      files.forEach(file => {
        try {
          console.log('添加文件项:', file.path, '是否是目录:', file.isDirectory);
          const fileItem = this.renderFileItem(file);
          fileListElement.appendChild(fileItem);
        } catch (error) {
          console.error('添加文件项失败', error);
        }
      });
      
      console.log('文件列表更新完成');
    } catch (error) {
      console.error('更新文件列表失败', error);
    }
  }
  
  // 在App类中添加一个方法，用于从UIManager调用ContextMenu
  showContextMenu(event, filePath, fileStats) {
    if (this.contextMenu) {
      this.contextMenu.show(event, filePath, fileStats);
    } else {
      console.error('上下文菜单未初始化');
    }
  }
  
  // 显示文件属性
  showFileProperties(filePath) {
    if (this.modalManager) {
      this.modalManager.showPropertiesDialog(filePath);
    } else {
      console.error('模态管理器未初始化');
      this.uiManager.showError('无法显示文件属性：系统功能不可用');
    }
  }

  // 添加更新导航控件的方法
  updateNavigationControls(dirPath) {
    try {
      console.log('更新导航控件', dirPath);
      
      const navigationBar = document.getElementById('navigation-bar');
      if (!navigationBar) {
        console.error('未找到导航栏元素');
        return;
      }
      
      // 清空现有导航
      navigationBar.innerHTML = '';
      
      // 检查 API 可用性
      if (!window.api) {
        console.error('window.api 不可用');
        return;
      }
      
      // 检查 path 参数
      if (!dirPath) {
        console.error('无效的目录路径');
        return;
      }
      
      // 创建返回上一级按钮 - 使用基本的字符串操作替代path.dirname
      let parentDir = null;
      if (dirPath.includes('/') || dirPath.includes('\\')) {
        // 获取最后一个分隔符的位置
        const lastSeparatorIndex = Math.max(
          dirPath.lastIndexOf('/'), 
          dirPath.lastIndexOf('\\')
        );
        
        if (lastSeparatorIndex > 0) {
          parentDir = dirPath.substring(0, lastSeparatorIndex);
        }
      }
      
      console.log('父目录:', parentDir);
      
      if (parentDir && parentDir !== dirPath) {
        const backButton = document.createElement('button');
        backButton.className = 'nav-button back-button';
        backButton.innerHTML = '<span>⬅️ 返回上一级</span>';
        backButton.addEventListener('click', () => {
          console.log('点击返回上一级', parentDir);
          this.loadDirectory(parentDir);
        });
        navigationBar.appendChild(backButton);
      }
      
      // 显示当前路径
      const pathDisplay = document.createElement('div');
      pathDisplay.className = 'current-path-display';
      pathDisplay.textContent = dirPath;
      navigationBar.appendChild(pathDisplay);
    } catch (error) {
      console.error('更新导航控件错误:', error);
    }
  }

  // 添加限制目录方法
  async addRestrictedPath() {
    try {
      console.log('添加限制目录');
      if (!window.api || !window.api.openDirectoryDialog) {
        console.error('API未注入或openDirectoryDialog方法不存在');
        return;
      }
      
      const paths = await window.api.openDirectoryDialog();
      
      if (paths && paths.length > 0) {
        const dirPath = paths[0];
        
        // 初始化限制目录数组（如果不存在）
        if (!this.settings.restrictedPaths) {
          this.settings.restrictedPaths = [];
        }
        
        // 检查是否已存在该路径
        if (this.settings.restrictedPaths.includes(dirPath)) {
          this.uiManager.showError('该目录已在限制列表中');
          return;
        }
        
        // 添加到限制目录
        this.settings.restrictedPaths.push(dirPath);
        this.saveSettings();
        
        // 刷新限制目录列表
        this.loadRestrictedPaths();
        
        this.uiManager.showSuccess('已添加限制目录');
      }
    } catch (error) {
      console.error('添加限制目录失败:', error);
      this.uiManager.showError('添加限制目录失败: ' + error.message);
    }
  }
  
  // 清空回收站方法 - 已禁用
  async emptyRecycleBin() {
    console.log('回收站功能已禁用');
    return;
  }

  // 根据文件路径获取文件类型
  getFileTypeFromPath(filePath) {
    if (!filePath) return 'others';
    
    // 获取文件扩展名
    const extension = this.getFileExtension(filePath).toLowerCase();
    
    // 根据扩展名返回文件类型分类
    return this.getCategoryByExtension(extension);
  }

  showEmptyStateMessage() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    // 清空内容区域
    contentArea.innerHTML = '';
    
    // 创建空状态消息
    const noPathMessage = document.createElement('div');
    noPathMessage.className = 'no-path-message';
    
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    // 添加图标
    const icon = document.createElement('i');
    icon.className = 'fas fa-folder-open';
    emptyState.appendChild(icon);
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '请选择一个文件夹';
    emptyState.appendChild(title);
    
    // 添加描述
    const description = document.createElement('p');
    description.textContent = '没有找到默认文件夹。请选择一个文件夹开始使用应用程序。';
    emptyState.appendChild(description);
    
    // 添加选择文件夹按钮
    const selectButton = document.createElement('button');
    selectButton.className = 'btn btn-primary';
    selectButton.innerHTML = '<i class="fas fa-folder"></i> 选择文件夹';
    selectButton.addEventListener('click', () => {
      if (window.api && typeof window.api.openDirectoryDialog === 'function') {
        window.api.openDirectoryDialog().then(result => {
          if (result && result.success && result.path) {
            // 加载选择的路径
            this.fileManager.loadPath(result.path);
            // 设置为默认路径
            this.settings.defaultPath = result.path;
            this.saveSettings();
          }
        }).catch(err => {
          console.error('Error selecting directory:', err);
          UIManager.displayErrorMessage('选择文件夹时出错');
        });
      } else {
        console.error('API method not available: openDirectoryDialog');
        UIManager.displayErrorMessage('API方法不可用');
      }
    });
    emptyState.appendChild(selectButton);
    
    // 将空状态添加到内容区域
    noPathMessage.appendChild(emptyState);
    contentArea.appendChild(noPathMessage);
    
    // 获取并显示应用程序版本
    if (window.api && typeof window.api.getAppVersion === 'function') {
      window.api.getAppVersion().then(version => {
        const versionText = document.createElement('p');
        versionText.className = 'version-text';
        versionText.textContent = `版本: ${version}`;
        versionText.style.marginTop = '20px';
        versionText.style.fontSize = '0.8rem';
        versionText.style.color = 'var(--text-tertiary)';
        emptyState.appendChild(versionText);
      }).catch(err => {
        console.error('Error getting app version:', err);
      });
    }
  }

  // 切换多文件选择模式
  toggleMultiSelectMode() {
    this.isMultiSelectMode = !this.isMultiSelectMode;
    this.selectedFiles = [];
    
    // 更新UI显示
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
      item.classList.toggle('multi-select-mode', this.isMultiSelectMode);
      item.classList.remove('selected');
    });
    
    // 更新多选按钮状态
    const multiSelectBtn = document.getElementById('multi-select-btn');
    if (multiSelectBtn) {
      multiSelectBtn.classList.toggle('active', this.isMultiSelectMode);
      multiSelectBtn.title = this.isMultiSelectMode ? '取消多选' : '多选模式';
    }
    
    // 更新多选操作栏状态
    const multiSelectActions = document.getElementById('multi-select-actions');
    if (multiSelectActions) {
      multiSelectActions.style.display = this.isMultiSelectMode ? 'flex' : 'none';
    }
    
    // 更新选择计数器
    this.updateSelectedCount();
  }
  
  // 更新已选文件计数
  updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
      countElement.textContent = this.selectedFiles.length > 0 
        ? `已选择 ${this.selectedFiles.length} 项` 
        : '未选择文件';
    }
  }
  
  // 处理文件选择
  toggleFileSelection(filePath, event) {
    if (!this.isMultiSelectMode) return;
    
    // 阻止事件冒泡，避免触发父元素的点击事件
    event.stopPropagation();
    
    // 找到对应的DOM元素
    const fileItem = event.currentTarget;
    
    // 检查文件是否已经选中
    const index = this.selectedFiles.indexOf(filePath);
    
    if (index === -1) {
      // 添加文件到选择列表
      this.selectedFiles.push(filePath);
      fileItem.classList.add('selected');
    } else {
      // 从选择列表中移除
      this.selectedFiles.splice(index, 1);
      fileItem.classList.remove('selected');
    }
    
    // 添加视觉反馈
    fileItem.style.transition = 'background-color 0.15s';
    
    // 更新计数器
    this.updateSelectedCount();
    
    // 如果有选中的文件，启用操作按钮
    const actionButtons = document.querySelectorAll('.multi-select-actions button');
    if (actionButtons.length > 0) {
      const hasSelection = this.selectedFiles.length > 0;
      actionButtons.forEach(btn => {
        btn.disabled = !hasSelection;
        if (hasSelection) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
      });
    }
  }
  
  // 全选/取消全选
  toggleSelectAll() {
    if (!this.isMultiSelectMode) return;
    
    const fileItems = document.querySelectorAll('.file-item');
    
    if (this.selectedFiles.length === fileItems.length) {
      // 如果所有文件都已选中，则取消全选
      this.selectedFiles = [];
      fileItems.forEach(item => item.classList.remove('selected'));
    } else {
      // 否则全选
      this.selectedFiles = [];
      fileItems.forEach(item => {
        const filePath = item.dataset.path;
        if (filePath) {
          this.selectedFiles.push(filePath);
          item.classList.add('selected');
        }
      });
    }
    
    // 更新计数器
    this.updateSelectedCount();
  }
  
  // 压缩选中的文件
  compressSelectedFiles() {
    if (this.selectedFiles.length === 0) {
      this.uiManager.showError('请先选择要压缩的文件');
      return;
    }
    
    // 调用上下文菜单的多文件压缩功能
    this.contextMenu.compressMultipleFiles(this.selectedFiles);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM内容加载完成，初始化应用');
  try {
    window.app = new App();
    console.log('app实例创建成功');
  } catch (e) {
    console.error('app实例创建失败', e);
  }
});

// 全局错误捕获
window.onerror = function (msg, url, line, col, error) {
  console.error('全局错误', msg, url, line, col, error);
};
