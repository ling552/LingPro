// 设置管理器类
export class SettingsManager {
  constructor() {
    this.settings = {
      theme: 'system', // 默认使用系统主题
      defaultPath: '', // 默认打开路径
      restrictedPaths: [], // 限制访问的路径
      confirmDelete: true, // 删除前确认
    };
    
    // 加载设置
    this.loadSettings();
  }
  
  // 加载设置
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('lingpro-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('加载设置失败:', error);
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
  
  // 获取设置
  getSetting(key) {
    return this.settings[key];
  }
  
  // 设置单个设置项
  setSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }
  
  // 获取所有设置
  getAllSettings() {
    return { ...this.settings };
  }
  
  // 应用主题
  applyTheme(theme) {
    const body = document.body;
    
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
    this.setSetting('theme', theme);
  }
  
  // 添加限制访问路径
  addRestrictedPath(path) {
    if (!this.settings.restrictedPaths.includes(path)) {
      this.settings.restrictedPaths.push(path);
      this.saveSettings();
    }
  }
  
  // 移除限制访问路径
  removeRestrictedPath(path) {
    this.settings.restrictedPaths = this.settings.restrictedPaths.filter(p => p !== path);
    this.saveSettings();
  }
  
  // 设置默认路径
  setDefaultPath(path) {
    this.settings.defaultPath = path;
    this.saveSettings();
  }
  
  // 设置删除前确认
  setConfirmDelete(confirm) {
    this.settings.confirmDelete = confirm;
    this.saveSettings();
  }
}
