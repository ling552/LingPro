# 「零」文件 - 多功能文件管理器

「零」文件是一款基于Electron开发的现代化文件管理工具，专注于文件分类、格式转换与高效管理，为用户提供流畅、简洁的文件操作体验。

![应用预览](./screenshots/preview.png)

## 主要功能

### 🗂️ 智能文件分类

- **自动分类**：自动将文件按类型分为图片、视频、音频、文档、表格、演示文稿、压缩文件和代码等八大类
- **类别统计**：显示每个类别的文件数量，方便快速了解文件分布
- **分类浏览**：点击不同类别卡片可筛选查看对应类型文件

### 🔄 格式转换

- **图片转换**：支持JPG、PNG、WebP等格式互转，优化文件大小
- **音视频转换**：基于ffmpeg提供音视频格式转换功能
- **批量处理**：支持同时选择多个文件进行批量格式转换

### 📊 文件管理

- **多选操作**：便捷选择多个文件进行复制、移动、删除等操作
- **属性查看**：查看文件详细信息，包括创建时间、修改时间等元数据
- **回收站集成**：文件删除默认移至系统回收站，支持恢复和清空操作
- **路径导航**：简易面包屑导航，方便在不同目录间切换

### 🎬 内置媒体预览

- **图片预览**：支持常见图片格式的查看和缩放
- **音频播放器**：内置音乐播放功能，支持播放列表
- **视频播放器**：集成视频播放器，支持全屏和常见视频格式

### 🔍 搜索功能

- **实时搜索**：快速搜索当前目录下的文件
- **类型筛选**：支持按文件类型筛选搜索结果
- **关键词匹配**：智能匹配文件名关键词

### 🔐 安全特性

- **受限目录**：可设置禁止访问的目录路径，防止误操作重要文件
- **操作确认**：重要操作提供二次确认，降低误操作风险
- **安全删除**：支持直接删除或移至回收站两种删除方式

### 🎨 个性化设置

- **主题切换**：内置多种主题风格，包括亮色、暗色、粉蓝搭配等
- **默认路径**：可设置默认打开路径，便于快速访问常用目录
- **转换参数**：可自定义格式转换的默认参数设置

## 技术特点

- **跨平台兼容**：基于Electron框架，支持Windows系统
- **高性能文件操作**：使用fs-extra提供高效文件管理
- **响应式设计**：适配不同屏幕尺寸，提供良好的移动设备支持
- **模块化架构**：采用组件化设计，易于扩展和维护
- **异步处理**：大型目录扫描和文件操作均采用异步处理，避免阻塞UI

## 系统要求

- 操作系统：Windows 10/11 64位
- 存储空间：100MB以上可用空间
- 内存：2GB及以上

## 安装使用

### 安装版

1. 下载最新的安装包
2. 运行安装程序，按提示完成安装
3. 从开始菜单或桌面快捷方式启动

### 便携版

1. 下载便携版zip包
2. 解压到任意位置
3. 运行「零」文件.exe启动应用

## 快捷键

| 功能 | 快捷键 |
|------|--------|
| 刷新 | F5 |
| 搜索 | Ctrl+F |
| 复制 | Ctrl+C |
| 粘贴 | Ctrl+V |
| 剪切 | Ctrl+X |
| 全选 | Ctrl+A |
| 删除 | Delete |
| 属性 | Alt+Enter |
| 返回上级目录 | Backspace |
| 多选模式 | F2 |

## 常见问题

**问：如何设置默认打开目录？**  
答：在设置页面的"路径设置"中设置默认路径。

**问：为什么某些文件无法访问？**  
答：可能是该路径已被添加到受限目录中，或者缺少必要的系统权限。

**问：如何恢复已删除的文件？**  
答：在回收站页面找到对应文件，点击右键菜单中的"恢复"选项。

**问：支持哪些图片格式转换？**  
答：目前支持JPG、PNG、WebP、GIF、BMP、TIFF等常见图片格式互转。

**问：如何批量选择文件？**  
答：点击工具栏上的"多选"按钮进入多选模式，然后点击文件选择。可使用"全选"按钮快速选择当前目录下所有文件。

## 隐私声明

「零」文件不会收集任何用户数据，所有文件操作均在本地完成，不会上传至任何服务器。应用不需要网络连接即可正常工作。

## 版本历史

**v1.0.0 (2024-05-01)**
- 首次发布
- 基础文件管理功能
- 文件分类浏览
- 媒体文件预览

## 许可协议

本项目遵循ISC许可证分发，详情请参阅LICENSE文件。

## 联系与反馈

如有问题或建议，请通过以下方式联系我们：

- 项目主页：https://github.com/ling/lingpro
- 电子邮件：support@lingpro.com

---

版权所有 © 2024-2025 Ling。保留所有权利。 