// File manager class to handle file operations
export class FileManager {
  constructor() {
    // File categories and their extensions
    this.fileCategories = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp', 'ico'],
      videos: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'flv'],
      audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      presentations: ['ppt', 'pptx'],
      archives: ['zip', 'rar', '7z', 'gz', 'tar', 'bz2'],
      others: []
    };
    
    // Store all scanned files
    this.files = [];
    
    // Store files by category
    this.filesByCategory = {
      images: [],
      videos: [],
      audio: [],
      documents: [],
      spreadsheets: [],
      presentations: [],
      archives: [],
      others: []
    };
  }
  
  // Scan a directory and categorize files
  async scanDirectory(dirPath) {
    try {
      // Clear previous files
      this.files = [];
      Object.keys(this.filesByCategory).forEach(category => {
        this.filesByCategory[category] = [];
      });
      
      // Scan directory using the main process
      const files = await window.api.scanDirectory(dirPath);
      
      // Process and categorize files
      files.forEach(file => {
        this.categorizeFile(file);
      });
      
      return this.files;
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw error;
    }
  }
  
  // Categorize a file based on its extension
  categorizeFile(file) {
    if (file.isDirectory) {
      // 目录单独处理，不分类
      file.category = 'directory';
      this.files.push(file);
      return;
    }
    
    const extension = this.getFileExtension(file.path).toLowerCase();
    let category = 'others';
    
    // Find the category for this extension
    for (const [cat, extensions] of Object.entries(this.fileCategories)) {
      if (extensions.includes(extension)) {
        category = cat;
        break;
      }
    }
    
    // Add category to file object
    file.category = category;
    
    // Add to files array and category array
    this.files.push(file);
    this.filesByCategory[category].push(file);
  }
  
  // Get file extension
  getFileExtension(filePath) {
    return filePath.split('.').pop() || '';
  }
  
  // Get file type based on extension
  getFileType(filePath) {
    const extension = this.getFileExtension(filePath).toLowerCase();
    
    if (this.fileCategories.images.includes(extension)) return 'image';
    if (this.fileCategories.videos.includes(extension)) return 'video';
    if (this.fileCategories.audio.includes(extension)) return 'audio';
    if (extension === 'txt') return 'text';
    if (extension === 'md' || extension === 'markdown') return 'markdown';
    if (this.fileCategories.documents.includes(extension)) return 'document';
    if (this.fileCategories.spreadsheets.includes(extension)) return 'spreadsheet';
    if (this.fileCategories.presentations.includes(extension)) return 'presentation';
    if (this.fileCategories.archives.includes(extension)) return 'archive';
    
    return 'other';
  }
  
  // Get file counts by category
  getFileCounts() {
    const counts = {};
    Object.keys(this.filesByCategory).forEach(category => {
      counts[category] = this.filesByCategory[category].length;
    });
    return counts;
  }
  
  // Get files by category
  getFilesByCategory(category) {
    return this.filesByCategory[category] || [];
  }
  
  // Get all files
  getAllFiles() {
    return this.files;
  }
  
  // Search files by query and type
  searchFiles(query, type = 'all') {
    query = query.toLowerCase();
    
    // Filter files by type if needed
    let filesToSearch = this.files;
    if (type !== 'all') {
      filesToSearch = this.filesByCategory[type] || [];
    }
    
    // Check if query is a regex pattern
    let isRegex = false;
    let regex;
    
    try {
      // Check for common regex patterns
      if (query.includes('*') || query.includes('\\d') || 
          (query.startsWith('/') && query.endsWith('/')) ||
          query.includes('[') && query.includes(']')) {
        
        // Convert glob patterns to regex
        let regexPattern = query;
        if (query.includes('*')) {
          regexPattern = query.replace(/\*/g, '.*');
        }
        
        regex = new RegExp(regexPattern, 'i');
        isRegex = true;
      }
    } catch (error) {
      console.error('Invalid regex pattern:', error);
      isRegex = false;
    }
    
    // Search files
    return filesToSearch.filter(file => {
      const fileName = file.path.split(/[/\\]/).pop().toLowerCase();
      
      if (isRegex) {
        return regex.test(fileName);
      } else {
        return fileName.includes(query);
      }
    });
  }
  
  // Get file info
  async getFileInfo(filePath) {
    try {
      return await window.api.getFileInfo(filePath);
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }
  
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Format date
  formatDate(date) {
    return new Date(date).toLocaleString();
  }
}
