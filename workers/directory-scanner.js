const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// 批处理大小 - 每批发送的文件数量
const BATCH_SIZE = 100;

// Function to scan directory recursively
async function scanDirectory(dirPath, maxDepth = Infinity, currentDepth = 0, filesBatch = []) {
  try {
    const files = [];
    const items = await fs.promises.readdir(dirPath);
    
    // 发送进度更新
    if (currentDepth === 0) {
      parentPort.postMessage({
        type: 'progress',
        message: `正在扫描 ${dirPath}...`,
        total: items.length
      });
    }
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        const stats = await fs.promises.stat(itemPath);
        const isDir = stats.isDirectory();
        
        // Create file info object
        const fileInfo = {
          path: itemPath,
          name: item,
          size: stats.size,
          modifiedTime: stats.mtime,
          isDirectory: isDir
        };
        
        // Add to files array
        files.push(fileInfo);
        filesBatch.push(fileInfo);
        
        // 当批处理达到一定大小时，发送数据并清空批处理数组
        if (filesBatch.length >= BATCH_SIZE) {
          parentPort.postMessage({
            type: 'batch',
            files: [...filesBatch]
          });
          filesBatch.length = 0;
        }
        
        // If it's a directory and we haven't reached max depth, scan it recursively
        if (isDir && currentDepth < maxDepth) {
          // Recursively scan subdirectory
          const subFiles = await scanDirectory(itemPath, maxDepth, currentDepth + 1, filesBatch);
          
          // Add subfiles to files array
          files.push(...subFiles);
        }
      } catch (error) {
        // Send error message but continue with other files
        parentPort.postMessage({
          type: 'error',
          message: `读取项目错误 ${itemPath}: ${error.message}`
        });
      }
    }
    
    return files;
  } catch (error) {
    // Send error message
    parentPort.postMessage({
      type: 'error',
      message: `扫描目录错误 ${dirPath}: ${error.message}`
    });
    
    return [];
  }
}

// Main worker function
async function main() {
  try {
    // Extract parameters from worker data
    const { dirPath, maxDepth = Infinity } = workerData;
    const filesBatch = [];
    
    // Send start message
    parentPort.postMessage({
      type: 'start',
      message: `开始扫描 ${dirPath}...`
    });
    
    // Scan directory
    const files = await scanDirectory(dirPath, maxDepth, 0, filesBatch);
    
    // 发送最后一批文件（如果有的话）
    if (filesBatch.length > 0) {
      parentPort.postMessage({
        type: 'batch',
        files: [...filesBatch]
      });
    }
    
    // Send complete message
    parentPort.postMessage({
      type: 'complete',
      message: `扫描完成，共找到 ${files.length} 个文件/文件夹`,
      total: files.length
    });
  } catch (error) {
    // Send error message
    parentPort.postMessage({
      type: 'error',
      message: `Worker错误: ${error.message}`
    });
  }
}

// Start the worker
main();
