// 用于诊断API问题的调试工具

// 检查API状态并显示在页面上
function checkApiStatus() {
  const apiStatusDiv = document.createElement('div');
  apiStatusDiv.id = 'api-status';
  apiStatusDiv.style.position = 'fixed';
  apiStatusDiv.style.bottom = '10px';
  apiStatusDiv.style.right = '10px';
  apiStatusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  apiStatusDiv.style.color = 'white';
  apiStatusDiv.style.padding = '10px';
  apiStatusDiv.style.borderRadius = '5px';
  apiStatusDiv.style.zIndex = '9999';
  apiStatusDiv.style.maxWidth = '500px';
  apiStatusDiv.style.maxHeight = '300px';
  apiStatusDiv.style.overflow = 'auto';
  apiStatusDiv.style.fontSize = '12px';
  apiStatusDiv.style.fontFamily = 'monospace';
  apiStatusDiv.style.display = 'none'; // 默认隐藏
  
  // 检查API是否存在
  const apiExists = !!window.api;
  
  // 列出API方法
  const apiMethods = apiExists ? Object.keys(window.api) : [];
  
  // 生成HTML
  let html = `<h3>API状态检查</h3>`;
  html += `<p>window.api 存在: <span style="color: ${apiExists ? 'lime' : 'red'}">${apiExists}</span></p>`;
  
  if (apiExists) {
    html += `<h4>可用方法:</h4><ul>`;
    apiMethods.forEach(method => {
      const methodType = typeof window.api[method];
      html += `<li>${method}: <span style="color: lime">${methodType}</span></li>`;
    });
    html += `</ul>`;
    
    // 特别检查openDirectoryDialog方法
    if (window.api.openDirectoryDialog) {
      html += `<p>openDirectoryDialog 方法存在: <span style="color: lime">✓</span></p>`;
      html += `<button id="test-dialog-btn">测试目录选择对话框</button>`;
    } else {
      html += `<p>openDirectoryDialog 方法不存在: <span style="color: red">✗</span></p>`;
    }
  }
  
  apiStatusDiv.innerHTML = html;
  document.body.appendChild(apiStatusDiv);
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '5px';
  closeBtn.style.right = '5px';
  closeBtn.style.backgroundColor = '#f44336';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '3px';
  closeBtn.style.padding = '3px 8px';
  closeBtn.style.fontSize = '10px';
  closeBtn.style.cursor = 'pointer';
  
  closeBtn.addEventListener('click', () => {
    apiStatusDiv.style.display = 'none';
  });
  
  apiStatusDiv.appendChild(closeBtn);
  
  // 添加测试按钮事件
  const testBtn = document.getElementById('test-dialog-btn');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      try {
        console.log('测试目录选择对话框');
        const paths = await window.api.openDirectoryDialog();
        console.log('选择的路径:', paths);
        alert(`选择的路径: ${paths && paths.length ? paths.join(', ') : '未选择'}`);
      } catch (e) {
        console.error('测试对话框错误:', e);
        alert(`测试失败: ${e.message}`);
      }
    });
  }
  
  return apiStatusDiv;
}

// 监控API调用
function monitorApiCalls() {
  if (!window.api) {
    console.warn('无法监控API调用：API对象不存在');
    return;
  }

  // 创建悬浮日志显示区域
  const apiLogContainer = document.createElement('div');
  apiLogContainer.id = 'api-log-container';
  apiLogContainer.style.position = 'fixed';
  apiLogContainer.style.right = '10px';
  apiLogContainer.style.bottom = '10px';
  apiLogContainer.style.width = '350px';
  apiLogContainer.style.maxHeight = '300px';
  apiLogContainer.style.overflowY = 'auto';
  apiLogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  apiLogContainer.style.color = '#fff';
  apiLogContainer.style.padding = '10px';
  apiLogContainer.style.borderRadius = '5px';
  apiLogContainer.style.fontFamily = 'monospace';
  apiLogContainer.style.fontSize = '12px';
  apiLogContainer.style.zIndex = '9999';
  apiLogContainer.style.display = 'none'; // 默认隐藏

  // 添加标题和切换按钮
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '5px';
  header.style.borderBottom = '1px solid #666';
  header.style.paddingBottom = '5px';
  
  const title = document.createElement('span');
  title.textContent = 'API 调用日志';
  title.style.fontWeight = 'bold';
  
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = '隐藏';
  toggleBtn.style.backgroundColor = '#444';
  toggleBtn.style.border = 'none';
  toggleBtn.style.color = '#fff';
  toggleBtn.style.padding = '2px 5px';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.fontSize = '10px';
  
  const clearBtn = document.createElement('button');
  clearBtn.textContent = '清除';
  clearBtn.style.backgroundColor = '#555';
  clearBtn.style.border = 'none';
  clearBtn.style.color = '#fff';
  clearBtn.style.padding = '2px 5px';
  clearBtn.style.cursor = 'pointer';
  clearBtn.style.fontSize = '10px';
  clearBtn.style.marginRight = '5px';
  
  const logContent = document.createElement('div');
  logContent.id = 'api-log-content';
  
  header.appendChild(title);
  header.appendChild(clearBtn);
  header.appendChild(toggleBtn);
  
  apiLogContainer.appendChild(header);
  apiLogContainer.appendChild(logContent);
  
  document.body.appendChild(apiLogContainer);
  
  // 显示/隐藏日志
  toggleBtn.addEventListener('click', () => {
    const content = document.getElementById('api-log-content');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggleBtn.textContent = '隐藏';
    } else {
      content.style.display = 'none';
      toggleBtn.textContent = '显示';
    }
  });
  
  // 清除日志
  clearBtn.addEventListener('click', () => {
    const content = document.getElementById('api-log-content');
    content.innerHTML = '';
  });
  
  // 创建关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '关闭日志';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '5px';
  closeBtn.style.right = '5px';
  closeBtn.style.backgroundColor = '#f44336';
  closeBtn.style.color = 'white';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '3px';
  closeBtn.style.padding = '3px 8px';
  closeBtn.style.fontSize = '10px';
  closeBtn.style.cursor = 'pointer';
  
  closeBtn.addEventListener('click', () => {
    apiLogContainer.style.display = 'none';
  });
  
  apiLogContainer.appendChild(closeBtn);

  // 全局API日志函数
  window.logApiCall = function(methodName, args, result, error) {
    console.log(`API调用: ${methodName}`, { args, result, error });
    
    const content = document.getElementById('api-log-content');
    if (!content) return;
    
    const logEntry = document.createElement('div');
    logEntry.style.borderBottom = '1px dashed #555';
    logEntry.style.paddingBottom = '5px';
    logEntry.style.marginBottom = '5px';
    
    const timestamp = new Date().toLocaleTimeString();
    const status = error ? '❌' : '✅';
    const colorClass = error ? 'color: #ff5252;' : 'color: #4caf50;';
    
    logEntry.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: bold; ${colorClass}">${methodName}</span>
        <span style="color: #aaa; font-size: 10px;">${timestamp}</span>
      </div>
      <div style="margin: 2px 0; color: #ddd;">参数: ${JSON.stringify(args)}</div>
      <div style="font-size: 11px; color: #bbb;">
        ${error ? `错误: ${error.message || JSON.stringify(error)}` : 
                `结果: ${result === undefined ? 'void' : JSON.stringify(result)}`}
      </div>
    `;
    
    content.insertBefore(logEntry, content.firstChild);
  };

  // 记录现有API方法但不修改它们
  if (window.api) {
    console.log('可用的API方法:', Object.keys(window.api));
    
    // 不替换原始方法，只添加日志记录工具
    Object.keys(window.api).forEach(key => {
      if (typeof window.api[key] === 'function') {
        console.log(`监控API方法: ${key}`);
      }
    });
  } else {
    console.warn('API对象不存在，无法监控API调用');
  }

  // 监控fetch请求
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    const startTime = performance.now();
    console.log(`Fetch请求: ${url}`, options);
    
    try {
      const response = await originalFetch(url, options);
      const endTime = performance.now();
      console.log(`Fetch响应: ${url} (${(endTime - startTime).toFixed(2)}ms)`, response);
      return response;
    } catch (error) {
      console.error(`Fetch错误: ${url}`, error);
      throw error;
    }
  };
  
  return apiLogContainer;
}

// 测试API功能，这个函数不再自动创建按钮
function testApi() {
  if (!window.api) {
    console.error('调试: window.api 未定义');
    return false;
  }
  
  if (!window.api.openDirectoryDialog) {
    console.error('调试: window.api.openDirectoryDialog 方法未定义');
    return false;
  }
  
  return true;
}

// 创建API测试面板
function createApiTestPanel() {
  // 如果已经存在，不要重复创建
  if (document.getElementById('api-test-panel')) {
    document.getElementById('api-test-panel').style.display = 'block';
    return;
  }
  
  const panel = document.createElement('div');
  panel.id = 'api-test-panel';
  panel.style.position = 'fixed';
  panel.style.top = '50%';
  panel.style.left = '50%';
  panel.style.transform = 'translate(-50%, -50%)';
  panel.style.backgroundColor = '#fff';
  panel.style.border = '2px solid #333';
  panel.style.borderRadius = '8px';
  panel.style.padding = '20px';
  panel.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
  panel.style.zIndex = '10000';
  panel.style.minWidth = '500px';
  panel.style.maxWidth = '80%';
  panel.style.maxHeight = '80%';
  panel.style.overflow = 'auto';
  
  panel.innerHTML = `
    <h2 style="margin-top: 0; color: #333;">API测试面板</h2>
    <p>这个面板用于直接测试主要API函数，帮助诊断问题。</p>
    
    <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <button id="test-dir-dialog" style="padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          测试目录选择对话框
        </button>
        <div id="dir-dialog-result" style="margin-top: 5px; padding: 5px; background: #f5f5f5; min-height: 20px;"></div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <button id="test-file-dialog" style="padding: 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
          测试文件选择对话框
        </button>
        <div id="file-dialog-result" style="margin-top: 5px; padding: 5px; background: #f5f5f5; min-height: 20px;"></div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <label for="test-dir-path">测试目录路径:</label>
        <input id="test-dir-path" type="text" style="padding: 8px; width: 100%;" placeholder="输入要扫描的目录路径">
        <button id="test-scan-dir" style="padding: 10px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
          测试扫描目录
        </button>
        <div id="scan-dir-result" style="margin-top: 5px; padding: 5px; background: #f5f5f5; min-height: 20px;"></div>
      </div>
    </div>
    
    <div style="margin-top: 20px;">
      <button id="close-test-panel" style="padding: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
        关闭测试面板
      </button>
      <div style="margin-top: 10px; font-size: 12px; color: #666;">
        请查看控制台 (F12) 获取更详细的日志信息
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // 添加事件处理程序
  document.getElementById('test-dir-dialog').addEventListener('click', async () => {
    try {
      const resultDiv = document.getElementById('dir-dialog-result');
      resultDiv.textContent = '请求中...';
      resultDiv.style.color = 'blue';
      
      console.log('调用 openDirectoryDialog...');
      const paths = await window.api.openDirectoryDialog();
      console.log('openDirectoryDialog 返回:', paths);
      
      resultDiv.textContent = paths && paths.length 
        ? `选择的目录: ${paths.join(', ')}` 
        : '未选择目录';
      resultDiv.style.color = 'green';
    } catch (error) {
      console.error('测试目录选择对话框错误:', error);
      document.getElementById('dir-dialog-result').textContent = `错误: ${error.message}`;
      document.getElementById('dir-dialog-result').style.color = 'red';
    }
  });
  
  document.getElementById('test-scan-dir').addEventListener('click', async () => {
    try {
      const dirPath = document.getElementById('test-dir-path').value;
      if (!dirPath) {
        document.getElementById('scan-dir-result').textContent = '请输入目录路径';
        document.getElementById('scan-dir-result').style.color = 'red';
        return;
      }
      
      const resultDiv = document.getElementById('scan-dir-result');
      resultDiv.textContent = '扫描中...';
      resultDiv.style.color = 'blue';
      
      console.log('调用 scanDirectory...', dirPath);
      const files = await window.api.scanDirectory(dirPath);
      console.log('scanDirectory 返回:', files);
      
      resultDiv.textContent = files && files.length 
        ? `扫描到 ${files.length} 个文件` 
        : '该目录为空或未找到文件';
      resultDiv.style.color = 'green';
    } catch (error) {
      console.error('测试扫描目录错误:', error);
      document.getElementById('scan-dir-result').textContent = `错误: ${error.message}`;
      document.getElementById('scan-dir-result').style.color = 'red';
    }
  });
  
  document.getElementById('close-test-panel').addEventListener('click', () => {
    panel.style.display = 'none';
  });
  
  return panel;
}

// 集成所有调试工具到一个对象中
export const DebugTools = {
  // 调试工具相关函数
  checkApiStatus,
  monitorApiCalls,
  testApi,
  createApiTestPanel,
  
  // 启用所有调试工具
  init() {
    console.log('正在初始化调试工具...');
    this.testApi();
    return this;
  },
  
  // 只显示API状态检查
  showApiStatus() {
    const statusDiv = checkApiStatus();
    statusDiv.style.display = 'block';
    return this;
  },
  
  // 显示API调用日志
  showApiLogger() {
    const loggerDiv = monitorApiCalls();
    loggerDiv.style.display = 'block';
    return this;
  },
  
  // 显示API测试面板
  showTestPanel() {
    createApiTestPanel();
    return this;
  }
};

// 不再自动初始化
// document.addEventListener('DOMContentLoaded', () => {
//   setTimeout(() => {
//     console.log('正在加载调试工具...');
//     checkApiStatus();
//     monitorApiCalls();
//     testApi();
//     addTestPanelButton();
//   }, 1000);
// });

export default DebugTools; 