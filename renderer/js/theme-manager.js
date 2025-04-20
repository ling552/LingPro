// Theme manager class to handle theme switching
export class ThemeManager {
  constructor() {
    this.currentTheme = 'theme-light';
    this.themes = [
      'theme-light',
      'theme-dark',
      'theme-pink-blue',
      'theme-pink-black',
      'theme-white-pink',
      'theme-purple-blue'
    ];
  }
  
  // Apply a theme to the application
  applyTheme(theme) {
    // Check if theme is valid
    if (!this.themes.includes(theme)) {
      console.error('Invalid theme:', theme);
      return;
    }
    
    // Remove current theme class
    document.body.classList.remove(...this.themes);
    
    // Add new theme class
    document.body.classList.add(theme);
    
    // Update current theme
    this.currentTheme = theme;
    
    // Update active theme in UI
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('active');
      if (option.dataset.theme === theme) {
        option.classList.add('active');
      }
    });
  }
  
  // Get current theme
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  // Get all available themes
  getThemes() {
    return this.themes;
  }
}
