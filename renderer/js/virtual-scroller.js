// Virtual scroller class for efficiently rendering large lists
export class VirtualScroller {
  constructor(options) {
    this.container = options.container;
    this.itemHeight = options.itemHeight || 40;
    this.buffer = options.buffer || 5;
    this.renderItem = options.renderItem;
    this.items = [];
    
    this.visibleItems = [];
    this.firstVisibleIndex = 0;
    this.lastVisibleIndex = 0;
    this.scrollTop = 0;
    
    // Create inner container for actual items
    this.innerContainer = document.createElement('div');
    this.innerContainer.className = 'virtual-scroller-inner';
    this.container.appendChild(this.innerContainer);
    
    // Create spacer elements
    this.topSpacer = document.createElement('div');
    this.topSpacer.className = 'virtual-scroller-spacer';
    this.bottomSpacer = document.createElement('div');
    this.bottomSpacer.className = 'virtual-scroller-spacer';
    
    this.innerContainer.appendChild(this.topSpacer);
    this.innerContainer.appendChild(this.bottomSpacer);
    
    // Add CSS
    const style = document.createElement('style');
    style.textContent = `
      .virtual-scroller {
        overflow-y: auto;
        position: relative;
      }
      
      .virtual-scroller-inner {
        position: relative;
      }
      
      .virtual-scroller-spacer {
        position: absolute;
        width: 100%;
        left: 0;
      }
    `;
    document.head.appendChild(style);
    
    // Set up scroll event listener
    this.container.addEventListener('scroll', this.onScroll.bind(this));
    
    // Initial render
    this.render();
  }
  
  // Set items
  setItems(items) {
    this.items = items;
    this.render();
  }
  
  // Handle scroll event
  onScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }
  
  // Render visible items
  render() {
    // Calculate visible range
    const totalHeight = this.items.length * this.itemHeight;
    const viewportHeight = this.container.clientHeight;
    
    // Calculate visible indices
    const firstVisible = Math.floor(this.scrollTop / this.itemHeight);
    const lastVisible = Math.min(
      this.items.length - 1,
      Math.ceil((this.scrollTop + viewportHeight) / this.itemHeight)
    );
    
    // Add buffer
    const firstIndex = Math.max(0, firstVisible - this.buffer);
    const lastIndex = Math.min(this.items.length - 1, lastVisible + this.buffer);
    
    // Check if visible range has changed
    if (firstIndex !== this.firstVisibleIndex || lastIndex !== this.lastVisibleIndex) {
      this.firstVisibleIndex = firstIndex;
      this.lastVisibleIndex = lastIndex;
      
      // Update spacers
      this.topSpacer.style.height = `${firstIndex * this.itemHeight}px`;
      this.bottomSpacer.style.height = `${(this.items.length - lastIndex - 1) * this.itemHeight}px`;
      this.bottomSpacer.style.top = `${(lastIndex + 1) * this.itemHeight}px`;
      
      // Clear current items
      this.visibleItems.forEach(item => {
        if (item.element && item.element.parentNode) {
          this.innerContainer.removeChild(item.element);
        }
      });
      
      this.visibleItems = [];
      
      // Render visible items
      for (let i = firstIndex; i <= lastIndex; i++) {
        const item = this.items[i];
        const element = this.renderItem(item, i);
        
        element.style.position = 'absolute';
        element.style.top = `${i * this.itemHeight}px`;
        element.style.width = '100%';
        
        this.innerContainer.appendChild(element);
        this.visibleItems.push({ index: i, element });
      }
    }
  }
  
  // Refresh the scroller (re-render all visible items)
  refresh() {
    // Force re-render by resetting visible indices
    this.firstVisibleIndex = -1;
    this.lastVisibleIndex = -1;
    this.render();
  }
  
  // Scroll to a specific item
  scrollToItem(index) {
    this.container.scrollTop = index * this.itemHeight;
  }
  
  // Get total height
  getTotalHeight() {
    return this.items.length * this.itemHeight;
  }
  
  // Resize handler (call when container size changes)
  resize() {
    this.render();
  }
}
