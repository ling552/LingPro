// Media player class to handle audio and video playback
export class MediaPlayer {
  constructor() {
    this.currentMedia = null;
    this.mediaType = null; // 'audio' or 'video'
    this.mediaElement = null;
    this.isPlaying = false;
    this.isFullscreen = false;
    this.isClosing = false; // 添加标记，避免关闭过程中触发错误处理
    this.duration = 0;
    this.currentTime = 0;
    this.isDragging = false;
    
    // 缓存DOM元素引用
    this.cacheElements();
    
    // 事件处理函数绑定this
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 调整内容区域，防止播放器被遮挡
    this.adjustContentArea();
  }
  
  // 调整内容区域
  adjustContentArea() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    // 监听播放器状态变化，调整内容区域
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'style')) {
          
          // 根据播放器状态调整内容区域
          if (this.mediaPlayer.classList.contains('hidden')) {
            contentArea.style.paddingBottom = '10px';
          } else if (this.mediaPlayer.classList.contains('collapsed')) {
            contentArea.style.paddingBottom = '90px';
          } else if (this.mediaPlayer.classList.contains('expanded')) {
            contentArea.style.paddingBottom = '50vh';
          } else if (this.mediaPlayer.classList.contains('fullscreen')) {
            contentArea.style.visibility = 'hidden';
          }
        }
      });
    });
    
    // 开始观察
    observer.observe(this.mediaPlayer, { 
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  // 缓存DOM元素引用
  cacheElements() {
    // 获取媒体播放器元素
    this.mediaPlayer = document.getElementById('media-player');
    this.mediaTitle = document.getElementById('media-title');
    this.mediaContainer = document.getElementById('media-container');
    this.lyricsContainer = document.getElementById('lyrics-container');
    
    // 获取控制按钮
    this.playPauseButton = document.getElementById('media-play-pause');
    this.fullscreenButton = document.getElementById('media-fullscreen');
    this.expandButton = document.getElementById('media-expand');
    this.closeButton = document.getElementById('media-close');
    
    // 获取进度条元素
    this.progressContainer = document.querySelector('.media-progress');
    this.progressBar = document.getElementById('media-progress-bar');
    this.progressHandle = document.getElementById('media-progress-handle');
    this.currentTimeElement = document.getElementById('media-current-time');
    this.durationElement = document.getElementById('media-duration');
  }
  
  // 设置事件监听器
  setupEventListeners() {
    // 播放/暂停按钮
    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', () => this.togglePlay());
    }
    
    // 全屏按钮
    this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
    
    // 展开/收起按钮
    this.expandButton.addEventListener('click', () => this.toggleExpand());
    
    // 关闭按钮
    this.closeButton.addEventListener('click', () => this.close());
    
    // 进度条点击事件 - 使用防抖处理
    this.progressContainer.addEventListener('click', this.debounce((e) => {
      if (this.mediaElement && this.duration > 0) {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.seekTo(pos * this.duration);
      }
    }, 50));
    
    // 进度条拖动事件
    this.progressHandle.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      document.addEventListener('mousemove', this.handleDrag);
      document.addEventListener('mouseup', this.handleDragEnd);
      e.preventDefault();
    });
    
    // 点击播放器内容区域展开
    this.mediaContainer.addEventListener('click', (e) => {
      // 只有在点击媒体元素以外的区域时才展开
      if (e.target === this.mediaContainer && this.mediaPlayer.classList.contains('collapsed')) {
        this.toggleExpand();
      }
    });
    
    // 监听主题变化
    this.listenForThemeChanges();
    
    // 添加键盘快捷键
    this.setupKeyboardShortcuts();
  }
  
  // 添加键盘快捷键
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 只有当媒体播放器可见时才处理快捷键
      if (this.mediaPlayer.classList.contains('hidden')) return;
      
      switch (e.code) {
        case 'Space':
          this.togglePlay();
          e.preventDefault();
          break;
        case 'ArrowRight':
          this.seekTo(this.currentTime + 5);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          this.seekTo(this.currentTime - 5);
          e.preventDefault();
          break;
        case 'KeyF':
          this.toggleFullscreen();
          e.preventDefault();
          break;
        case 'Escape':
          if (this.isFullscreen) {
            this.toggleFullscreen();
          } else {
            this.close();
          }
          e.preventDefault();
          break;
      }
    });
  }
  
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  // 播放/暂停切换
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  // 监听主题变化
  listenForThemeChanges() {
    // 检查是否存在主题选择器
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        this.applyThemeStyles();
      });
    }
    
    // 初始应用主题样式
    this.applyThemeStyles();
  }
  
  // 应用主题样式
  applyThemeStyles() {
    // 获取当前主题
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    // 应用适当的样式
    if (this.mediaElement) {
      this.mediaElement.style.backgroundColor = isDarkTheme ? '#121212' : '#f8f9fa';
    }
  }
  
  // 播放音频文件
  playAudio(filePath) {
    try {
      this.mediaType = 'audio';
      
      // 创建或重用音频元素
      this.createOrReuseMediaElement('audio');
      
      // 设置源
      this.mediaElement.src = `file://${filePath}`;
      
      // 设置标题
      this.mediaTitle.textContent = this.getFileName(filePath);
      
      // 显示播放器
      this.showPlayer();
      
      // 播放
      this.play();
      
      // 尝试加载歌词
      this.loadLyrics(filePath);
    } catch (error) {
      console.error('播放音频错误:', error);
      this.showErrorMessage('无法播放音频文件', error.message);
    }
  }
  
  // 播放视频文件
  playVideo(filePath) {
    try {
      console.log('开始播放视频:', filePath);
      this.mediaType = 'video';
    
      // 创建或重用视频元素
      this.createOrReuseMediaElement('video');
      
      // 确保媒体容器可见且有适当的样式
      if (this.mediaContainer) {
        this.mediaContainer.style.visibility = 'visible';
        this.mediaContainer.style.display = 'flex';
        this.mediaContainer.style.alignItems = 'center';
        this.mediaContainer.style.justifyContent = 'center';
        this.mediaContainer.style.backgroundColor = 'transparent';
      }
      
      // 确保媒体元素有正确的样式
      if (this.mediaElement) {
        this.mediaElement.style.display = 'block';
        this.mediaElement.style.visibility = 'visible';
        this.mediaElement.style.width = 'auto';
        this.mediaElement.style.maxWidth = '95%';
        this.mediaElement.style.height = 'auto';
        this.mediaElement.style.maxHeight = '95%';
        this.mediaElement.style.objectFit = 'contain';
        this.mediaElement.style.margin = '0 auto';
        this.mediaElement.style.backgroundColor = 'transparent';
        
        // 添加圆角和阴影
        this.mediaElement.style.borderRadius = '4px';
        this.mediaElement.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        
        // 清除任何可能的错误状态
        this.mediaElement.style.opacity = '1';
      }
      
      // 监听加载完成事件，以确保视频可以正确播放
      const loadedHandler = () => {
        console.log('视频元数据已加载，准备播放');
        // 一旦加载完成，触发窗口调整事件以确保正确显示
        window.dispatchEvent(new Event('resize'));
        
        // 移除此事件监听器以避免重复调用
        this.mediaElement.removeEventListener('loadedmetadata', loadedHandler);
      };
      
      this.mediaElement.addEventListener('loadedmetadata', loadedHandler);
    
    // 设置源
    this.mediaElement.src = `file://${filePath}`;
    
    // 设置标题
      this.mediaTitle.textContent = this.getFileName(filePath);
      
      // 显示播放器
      this.showPlayer();
    
    // 播放
    this.play();
    
      // 延迟100ms后触发窗口调整事件，强制重新计算布局
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      
      console.log('视频播放初始化完成');
    } catch (error) {
      console.error('播放视频错误:', error);
      this.showErrorMessage('无法播放视频文件', error.message);
    }
  }
  
  // 获取文件名
  getFileName(filePath) {
    return filePath.split(/[/\\]/).pop();
  }
  
  // 显示播放器
  showPlayer() {
    this.mediaPlayer.classList.remove('hidden');
    this.mediaPlayer.classList.add('collapsed');
    this.mediaPlayer.classList.remove('expanded');
    this.mediaPlayer.classList.remove('fullscreen');
  }
  
  // 创建或重用媒体元素
  createOrReuseMediaElement(type) {
    try {
      const isCorrectType = type === 'audio' 
        ? this.mediaElement instanceof HTMLAudioElement
        : this.mediaElement instanceof HTMLVideoElement;
        
      // 如果已有元素且类型不符，或者元素不存在，则创建新元素
      if (!this.mediaElement || !isCorrectType) {
        console.log(`创建新的${type}元素`);
        
        // 移除旧元素
        if (this.mediaElement) {
          try {
            // 停止播放并清除事件监听器
            this.mediaElement.pause();
            this.mediaElement.src = '';
            this.mediaElement.load();
            
            // 克隆节点并替换，以移除所有事件监听器
            const oldElement = this.mediaElement;
            const newElement = oldElement.cloneNode(false);
            if (oldElement.parentNode) {
              oldElement.parentNode.replaceChild(newElement, oldElement);
            }
            
            // 从DOM中移除
            if (this.mediaContainer && this.mediaContainer.contains(this.mediaElement)) {
              this.mediaContainer.removeChild(this.mediaElement);
            }
          } catch (e) {
            console.error('移除旧媒体元素失败:', e);
          }
        }
        
        // 确保容器可见
        if (this.mediaContainer) {
          this.mediaContainer.style.visibility = 'visible';
          this.mediaContainer.style.display = 'flex';
          this.mediaContainer.style.alignItems = 'center';
          this.mediaContainer.style.justifyContent = 'center';
        }
        
        // 创建新元素
        this.mediaElement = document.createElement(type);
        
        // 设置通用属性
        this.mediaElement.setAttribute('playsinline', '');
        this.mediaElement.setAttribute('webkit-playsinline', '');
        this.mediaElement.setAttribute('preload', 'metadata');
        this.mediaElement.crossOrigin = 'anonymous';
        
        // 根据类型设置特定样式
        if (type === 'audio') {
          this.mediaElement.style.width = '100%';
          this.mediaElement.style.maxHeight = '100%';
          this.mediaElement.style.display = 'block';
          this.mediaElement.style.margin = '0 auto';
        } else { // video
          this.mediaElement.style.width = 'auto';
          this.mediaElement.style.maxWidth = '100%';
          this.mediaElement.style.height = 'auto';
          this.mediaElement.style.maxHeight = '100%';
          this.mediaElement.style.objectFit = 'contain';
          this.mediaElement.style.backgroundColor = 'transparent';
          this.mediaElement.style.display = 'block';
          this.mediaElement.style.margin = '0 auto';
          this.mediaElement.style.visibility = 'visible';
          
          // 视频特定属性
          this.mediaElement.playsInline = true;
          this.mediaElement.webkitPlaysInline = true;
        }
        
        // 添加事件监听器
        this.setupMediaEvents();
        
        // 添加到容器
        this.mediaContainer.appendChild(this.mediaElement);
        
        // 创建媒体元素后触发窗口大小调整事件
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 50);
        
        console.log(`${type}元素创建成功`);
      } else {
        console.log(`重用现有${type}元素`);
      }
    } catch (error) {
      console.error(`创建${type}元素失败:`, error);
      // 尝试创建最基本的元素作为后备
      this.mediaElement = document.createElement(type);
      this.mediaContainer.appendChild(this.mediaElement);
    }
  }
  
  // 设置媒体事件
  setupMediaEvents() {
    // 播放事件
    this.mediaElement.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayPauseButton();
    });
    
    // 暂停事件
    this.mediaElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayPauseButton();
    });
    
    // 结束事件
    this.mediaElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayPauseButton();
    });
    
    // 加载元数据事件
    this.mediaElement.addEventListener('loadedmetadata', () => {
      this.duration = this.mediaElement.duration;
      this.durationElement.textContent = this.formatTime(this.duration);
    });
    
    // 时间更新事件 - 使用节流函数减少更新频率
    this.mediaElement.addEventListener('timeupdate', 
      this.throttle(() => {
        if (!this.isDragging) {
          this.currentTime = this.mediaElement.currentTime;
          this.updateProgress();
        }
      }, 100) // 100ms节流，减少不必要的更新
    );
    
    // 错误事件
    this.mediaElement.addEventListener('error', (e) => this.handleMediaError(e));
  }
  
  // 处理媒体错误
  handleMediaError(e) {
    // 检查是否是在关闭过程中产生的错误
    if (this.isClosing) {
      console.log('媒体播放器关闭过程中的错误事件，已忽略');
      return;
    }
    
    // 检查错误类型
    let errorMessage = '未知错误';
    
    if (this.mediaElement.error) {
      const errorCode = this.mediaElement.error.code;
      
      switch (errorCode) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = '播放已中止';
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = '网络错误';
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = '解码错误，可能是文件损坏或格式不支持';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = '不支持的媒体格式';
          break;
        default:
          errorMessage = `播放错误 (${errorCode})`;
      }
    }
    
    console.error('媒体播放错误:', errorMessage, e);
    
    // 显示错误提示
    this.showErrorMessage('播放失败', errorMessage);
  }
  
  // 显示错误消息
  showErrorMessage(title, message) {
    // 检查是否已经存在UIManager实例
    if (window.UIManager) {
      window.UIManager.displayErrorMessage(`${title}: ${message}`);
    } else {
      alert(`${title}: ${message}`);
    }
  }
  
  // 节流函数
  throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
  // 播放
  play() {
    if (this.mediaElement) {
      this.mediaElement.play().catch(error => {
        console.error('播放失败:', error);
        this.showErrorMessage('播放失败', error.message);
      });
    }
  }
  
  // 暂停
  pause() {
    if (this.mediaElement) {
      this.mediaElement.pause();
    }
  }
  
  // 切换展开/收起
  toggleExpand() {
    try {
      if (this.isFullscreen) {
        return; // 全屏模式下不允许切换展开/收起
      }
      
      const isCollapsed = this.mediaPlayer.classList.contains('collapsed');
      const contentArea = document.querySelector('.content-area');
      
      if (isCollapsed) {
        this.mediaPlayer.classList.remove('collapsed');
        this.mediaPlayer.classList.add('expanded');
        this.expandButton.textContent = '⬇️';
        
        // 调整内容区域的填充
        if (contentArea) {
          contentArea.style.paddingBottom = '50vh';
        }
        
        // 如果是视频，尝试调整大小以最佳展示
        if (this.mediaType === 'video' && this.mediaElement) {
          this.mediaElement.style.maxHeight = '70vh';
        }
      } else {
        this.mediaPlayer.classList.add('collapsed');
        this.mediaPlayer.classList.remove('expanded');
        this.expandButton.textContent = '⬆️';
        
        // 调整内容区域的填充
        if (contentArea) {
          contentArea.style.paddingBottom = '90px';
        }
        
        // 重置视频大小
        if (this.mediaType === 'video' && this.mediaElement) {
          this.mediaElement.style.maxHeight = '';
        }
      }
    } catch (error) {
      console.error('切换展开/收起状态失败:', error);
    }
  }
  
  // 切换全屏
  toggleFullscreen() {
    try {
      // 记录当前播放状态
      const wasPlaying = !this.mediaElement.paused;
      
      // 切换全屏状态
      if (!this.isFullscreen) {
        // 进入全屏模式
        this.mediaPlayer.classList.add('fullscreen');
        
        // 确保媒体容器可见
        if (this.mediaContainer) {
          this.mediaContainer.style.visibility = 'visible';
          this.mediaContainer.style.display = 'flex';
          this.mediaContainer.style.alignItems = 'center';
          this.mediaContainer.style.justifyContent = 'center';
          this.mediaContainer.style.width = '100%';
          this.mediaContainer.style.height = '100%';
          this.mediaContainer.style.padding = '20px';
          this.mediaContainer.style.overflow = 'hidden';
          this.mediaContainer.style.backgroundColor = 'transparent';
        }
        
        // 调整媒体元素样式，确保居中显示
        if (this.mediaElement) {
          if (this.mediaType === 'video') {
            this.mediaElement.style.maxWidth = '85%';
            this.mediaElement.style.maxHeight = '85%';
            this.mediaElement.style.margin = '0 auto';
            this.mediaElement.style.display = 'block';
            this.mediaElement.style.borderRadius = '6px';
            this.mediaElement.style.boxShadow = '0 0 30px rgba(0, 0, 0, 0.4)';
            this.mediaElement.style.backgroundColor = 'transparent';
          }
        }
        
        // 检查是否有歌词元素，并移动到全屏容器
        if (this.lyricsContainer && this.lyricsContainer.childNodes.length > 0) {
          this.lyricsContainer.classList.add('fullscreen-lyrics');
        }
        
        // 使用Fullscreen API
        if (this.mediaPlayer.requestFullscreen) {
          this.mediaPlayer.requestFullscreen().catch(err => {
            console.error('全屏请求失败:', err);
          });
        } else if (this.mediaPlayer.webkitRequestFullscreen) {
          this.mediaPlayer.webkitRequestFullscreen();
        } else if (this.mediaPlayer.msRequestFullscreen) {
          this.mediaPlayer.msRequestFullscreen();
        }
        
        this.isFullscreen = true;
        this.fullscreenButton.textContent = '⛶';
        this.fullscreenButton.title = '退出全屏';
      } else {
        // 退出全屏模式
        this.mediaPlayer.classList.remove('fullscreen');
        
        // 恢复媒体元素样式
        if (this.mediaElement && this.mediaType === 'video') {
          this.mediaElement.style.maxWidth = '95%';
          this.mediaElement.style.maxHeight = '95%';
          this.mediaElement.style.borderRadius = '4px';
          this.mediaElement.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        }
        
        // 恢复容器样式
        if (this.mediaContainer) {
          this.mediaContainer.style.padding = '10px';
        }
        
        // 恢复歌词容器样式
        if (this.lyricsContainer) {
          this.lyricsContainer.classList.remove('fullscreen-lyrics');
        }
        
        // 使用Fullscreen API退出
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.error('退出全屏失败:', err);
          });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        
        this.isFullscreen = false;
        this.fullscreenButton.textContent = '⛶';
        this.fullscreenButton.title = '全屏';
      }
      
      // 强制媒体容器和元素更新尺寸
      setTimeout(() => {
        // 触发窗口调整事件以更新布局
        window.dispatchEvent(new Event('resize'));
        
        // 如果在全屏前正在播放，恢复播放
        if (wasPlaying) {
          this.mediaElement.play().catch(err => {
            console.error('恢复播放失败:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('切换全屏时发生错误:', error);
      // 在发生错误时恢复UI状态
      this.isFullscreen = false;
      this.mediaPlayer.classList.remove('fullscreen');
      this.fullscreenButton.textContent = '⛶';
      this.fullscreenButton.title = '全屏';
    }
  }
  
  // 关闭播放器
  close() {
    try {
      console.log('开始关闭媒体播放器');
      this.isClosing = true;
      
      // 停止更新进度
      if (this.progressUpdateInterval) {
        clearInterval(this.progressUpdateInterval);
      }
      
      // 移除文档上的事件监听器
      document.removeEventListener('mousemove', this.handleDrag);
      document.removeEventListener('mouseup', this.handleDragEnd);
      
      // 停止播放
      if (this.mediaElement) {
        try {
          console.log('停止媒体播放');
          this.mediaElement.pause();
          this.mediaElement.src = '';
          this.mediaElement.removeAttribute('src'); // 彻底清除源
          this.mediaElement.load();
        } catch (e) {
          console.log('停止媒体播放时发生错误:', e);
        }
      }
      
      // 确保退出全屏状态
      if (this.isFullscreen) {
        console.log('从全屏状态恢复');
        this.mediaPlayer.classList.remove('fullscreen');
        document.body.classList.remove('no-scroll');
        
        // 使用Fullscreen API退出
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
              console.error('退出全屏失败:', err);
            });
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
          }
        } catch (err) {
          console.error('退出全屏API调用失败:', err);
        }
        
        this.isFullscreen = false;
        
        // 恢复内容区域可见性和交互性
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
          contentArea.style.visibility = 'visible';
          contentArea.style.display = 'block';
          contentArea.style.pointerEvents = 'auto';
        }
        
        // 确保所有控制元素可交互
        document.querySelectorAll('.sidebar, .navigation-bar, .title-bar, button').forEach(el => {
          el.style.pointerEvents = 'auto';
        });
      }
      
      // 重置媒体播放器样式
      this.mediaPlayer.style.zIndex = '';
      
      // 清除媒体容器
      if (this.mediaContainer) {
        console.log('清空媒体容器');
        this.mediaContainer.innerHTML = '';
        // 重置媒体容器样式
        this.mediaContainer.style.visibility = '';
        this.mediaContainer.style.display = '';
        this.mediaContainer.style.backgroundColor = '';
      }
      
      // 隐藏播放器
      if (this.mediaPlayer) {
        console.log('隐藏媒体播放器');
        this.mediaPlayer.classList.add('hidden');
        this.mediaPlayer.classList.remove('fullscreen');
        this.mediaPlayer.classList.remove('expanded');
      }
      
      // 移除body上的样式
      document.body.classList.remove('no-scroll');
      
      // 恢复内容区域的显示和交互性
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        contentArea.style.paddingBottom = '10px';
        contentArea.style.visibility = 'visible';
        contentArea.style.pointerEvents = 'auto';
        contentArea.style.zIndex = '';
      }
      
      // 确保控制元素可交互
      document.querySelectorAll('.sidebar, .navigation-bar, .title-bar, button').forEach(el => {
        el.style.pointerEvents = 'auto';
        if (el.style.zIndex === '0') {
          el.style.zIndex = '';
        }
      });
      
      // 移除任何可能的全局遮罩
      const overlays = document.querySelectorAll('.media-overlay');
      overlays.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
      
      // 清除媒体引用
      this.mediaElement = null;
      
      // 重置状态
      this.isPlaying = false;
      this.isFullscreen = false;
      this.duration = 0;
      this.currentTime = 0;
      
      // 重置进度条和时间显示
      if (this.progressBar) {
        this.progressBar.style.width = '0%';
      }
      if (this.progressHandle) {
        this.progressHandle.style.left = '0%';
      }
      if (this.currentTimeElement) {
        this.currentTimeElement.textContent = '00:00';
      }
      if (this.durationElement) {
        this.durationElement.textContent = '00:00';
      }
      
      // 清空歌词容器
      if (this.lyricsContainer) {
        this.lyricsContainer.innerHTML = '';
        this.lyricsContainer.style.display = 'none';
      }
      
      // 触发窗口调整事件，确保UI正确更新
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // 最后一次确保可交互性
        document.body.style.pointerEvents = 'auto';
      }, 100);
      
      // 重置状态标志
      this.isClosing = false;
      console.log('媒体播放器关闭完成');
    } catch (error) {
      console.error('关闭播放器失败:', error);
      this.isClosing = false;
      
      // 确保UI处于一致状态
      try {
        this.mediaPlayer.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        // 强制恢复交互性
        document.body.style.pointerEvents = 'auto';
        document.querySelectorAll('.sidebar, .navigation-bar, .title-bar, button, .content-area').forEach(el => {
          el.style.pointerEvents = 'auto';
          el.style.visibility = 'visible';
        });
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
          contentArea.style.visibility = 'visible';
        }
      } catch (e) {
        console.error('恢复UI状态失败:', e);
      }
    }
  }
  
  // 更新播放/暂停按钮
  updatePlayPauseButton() {
    if (this.playPauseButton) {
      this.playPauseButton.textContent = this.isPlaying ? '⏸️' : '▶️';
      this.playPauseButton.title = this.isPlaying ? '暂停' : '播放';
    }
  }
  
  // 更新进度条
  updateProgress() {
    if (!this.mediaElement || this.isDragging) return;
    
    try {
      const percent = (this.currentTime / this.duration) * 100 || 0;
      this.progressBar.style.width = `${percent}%`;
      this.progressHandle.style.left = `${percent}%`;
      this.currentTimeElement.textContent = this.formatTime(this.currentTime);
      
      // 更新歌词
      this.updateLyricsHighlight();
    } catch (error) {
      console.error('更新进度条失败:', error);
    }
  }
  
  // 格式化时间
  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // 跳转到指定时间
  seekTo(seconds) {
    try {
      if (this.mediaElement) {
        // 确保时间在有效范围内
        seconds = Math.max(0, Math.min(seconds, this.duration));
        this.mediaElement.currentTime = seconds;
        this.currentTime = seconds;
        this.updateProgress();
      }
    } catch (error) {
      console.error('跳转到指定时间失败:', error);
    }
  }
  
  // 处理拖动
  handleDrag = (e) => {
    if (this.isDragging && this.mediaElement && this.duration > 0) {
      try {
        const rect = this.progressContainer.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(pos, 1));
        
        const seekTime = pos * this.duration;
        
        // 更新进度条显示，但不立即更新媒体时间
        const percent = pos * 100;
        this.progressBar.style.width = `${percent}%`;
        this.progressHandle.style.left = `${percent}%`;
        this.currentTimeElement.textContent = this.formatTime(seekTime);
        
        // 预览显示跳转时间
        if (!this.timePreview) {
          this.timePreview = document.createElement('div');
          this.timePreview.className = 'time-preview';
          this.progressContainer.appendChild(this.timePreview);
        }
        
        // 更新预览位置和内容
        this.timePreview.textContent = this.formatTime(seekTime);
        this.timePreview.style.left = `${percent}%`;
        this.timePreview.style.display = 'block';
      } catch (error) {
        console.error('拖动进度条失败:', error);
      }
    }
  }
  
  // 处理拖动结束
  handleDragEnd = () => {
    if (this.isDragging && this.mediaElement && this.duration > 0) {
      try {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = parseFloat(this.progressBar.style.width) / 100;
        
        // 跳转到新的时间
        this.seekTo(pos * this.duration);
        
        // 移除时间预览
        if (this.timePreview) {
          this.timePreview.style.display = 'none';
        }
      } catch (error) {
        console.error('完成拖动失败:', error);
      }
    }
    
    // 移除事件监听器
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    this.isDragging = false;
  }
  
  // 加载歌词
  async loadLyrics(audioFilePath) {
    try {
      // 只对音频文件加载歌词
      if (this.mediaType !== 'audio') {
        this.hideLyrics();
        return;
      }
      
      // 构建歌词文件路径
      const lyricsPath = audioFilePath.substring(0, audioFilePath.lastIndexOf('.')) + '.lrc';
      
      // 尝试加载歌词文件
      try {
        const response = await fetch(`file://${lyricsPath}`);
        
        if (response.ok) {
          const lyricsContent = await response.text();
          const lyrics = this.parseLyrics(lyricsContent);
          this.displayLyrics(lyrics);
        } else {
          this.hideLyrics();
        }
      } catch (error) {
        console.log('歌词文件未找到:', lyricsPath);
        this.hideLyrics();
      }
    } catch (error) {
      console.error('加载歌词失败:', error);
      this.hideLyrics();
    }
  }
  
  // 隐藏歌词
  hideLyrics() {
    if (this.lyricsContainer) {
      this.lyricsContainer.style.display = 'none';
      this.lyricsContainer.innerHTML = '';
    }
  }
  
  // 解析歌词内容
  parseLyrics(lyricsContent) {
    try {
      const result = [];
      
      // 匹配时间标签 [mm:ss.xx] 或 [mm:ss]
      const regex = /\[(\d{2}):(\d{2})(?:\.(\d{2}))?\]/g;
      
      // 按行分割
      const lines = lyricsContent.split('\n');
      
      for (const line of lines) {
        let match;
        let timeStart = 0;
        let content = line.trim();
        
        // 提取所有时间标签
        while ((match = regex.exec(line)) !== null) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const hundredths = match[3] ? parseInt(match[3], 10) : 0;
          
          // 计算总秒数
          const time = minutes * 60 + seconds + hundredths / 100;
          timeStart = match.index + match[0].length;
          
          // 提取这个时间点对应的歌词文本
          const text = line.substring(timeStart).trim();
          
          // 忽略空文本和ID标签等元信息
          if (text && !text.startsWith('[')) {
            result.push({ time, text });
          }
        }
        
        // 处理可能的非标准格式或注释
        if (timeStart === 0 && !content.startsWith('[') && content) {
          // 可能是注释或标题
          result.push({ time: -1, text: content, isComment: true });
        }
      }
      
      // 按时间排序
      return result.sort((a, b) => a.time - b.time);
    } catch (error) {
      console.error('解析歌词失败:', error);
      return [];
    }
  }
  
  // 显示歌词
  displayLyrics(lyrics) {
    try {
      if (!lyrics || lyrics.length === 0 || !this.lyricsContainer) {
        this.hideLyrics();
        return;
      }
      
      // 保存歌词数据
      this.lyrics = lyrics;
      
      // 清空并显示歌词容器
      this.lyricsContainer.innerHTML = '';
      this.lyricsContainer.style.display = 'block';
      
      // 使用文档片段提高性能
      const fragment = document.createDocumentFragment();
      
      // 为每行歌词创建元素
      lyrics.forEach((line, index) => {
        const lyricLine = document.createElement('div');
        lyricLine.className = 'lyric-line';
        lyricLine.dataset.time = line.time;
        lyricLine.dataset.index = index;
        
        // 对于注释或元信息使用不同样式
        if (line.isComment) {
          lyricLine.classList.add('lyric-comment');
        }
        
        lyricLine.textContent = line.text;
        
        // 添加点击事件，点击歌词跳转到对应时间
        if (line.time >= 0) {
          lyricLine.addEventListener('click', () => {
            this.seekTo(line.time);
          });
        }
        
        fragment.appendChild(lyricLine);
      });
      
      // 一次性添加到DOM
      this.lyricsContainer.appendChild(fragment);
      
      // 更新当前歌词高亮
      this.updateLyricsHighlight();
    } catch (error) {
      console.error('显示歌词失败:', error);
      this.hideLyrics();
    }
  }
  
  // 更新歌词高亮
  updateLyricsHighlight() {
    try {
      if (!this.lyrics || !this.lyricsContainer || !this.mediaElement) {
        return;
      }
      
      const currentTime = this.mediaElement.currentTime;
      let activeIndex = -1;
      
      // 找到当前时间对应的歌词
      for (let i = this.lyrics.length - 1; i >= 0; i--) {
        if (this.lyrics[i].time <= currentTime && this.lyrics[i].time >= 0) {
          activeIndex = i;
          break;
        }
      }
      
      // 如果找到了活动行
      if (activeIndex >= 0) {
        // 移除所有行的活动状态
        const allLines = this.lyricsContainer.querySelectorAll('.lyric-line');
        allLines.forEach(line => line.classList.remove('active'));
        
        // 为当前行添加活动状态
        const activeLine = this.lyricsContainer.querySelector(`.lyric-line[data-index="${activeIndex}"]`);
        if (activeLine) {
          activeLine.classList.add('active');
          
          // 滚动到当前行
          this.scrollLyricsToActiveLine(activeLine);
        }
      }
    } catch (error) {
      console.error('更新歌词高亮失败:', error);
    }
  }
  
  // 滚动歌词到当前行
  scrollLyricsToActiveLine(activeLine) {
    if (!this.lyricsContainer || !activeLine) return;
    
    try {
      // 使用平滑滚动
      const containerHeight = this.lyricsContainer.clientHeight;
      const lineTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;
      
      // 将活动行滚动到容器中央
      const scrollTo = lineTop - (containerHeight / 2) + (lineHeight / 2);
      
      // 使用平滑滚动
      this.lyricsContainer.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('滚动歌词失败:', error);
    }
  }
}
