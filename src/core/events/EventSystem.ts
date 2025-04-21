/**
 * EventSystem 类 - 事件系统
 * 
 * 提供事件发布-订阅功能，用于游戏中各组件之间的通信。
 * 采用观察者模式，允许组件注册事件监听器，并在事件触发时接收通知。
 */

// 事件处理函数类型
type EventHandler = (data?: any) => void;

export class EventSystem {
  // 存储事件及其处理函数的映射
  private _eventHandlers: Map<string, EventHandler[]> = new Map();
  
  /**
   * 注册事件监听器
   * @param eventName 事件名称
   * @param handler 事件处理函数
   */
  public on(eventName: string, handler: EventHandler): void {
    // 获取现有的处理函数列表，如果不存在则创建新的
    const handlers = this._eventHandlers.get(eventName) || [];
    
    // 添加新的处理函数
    handlers.push(handler);
    
    // 更新处理函数列表
    this._eventHandlers.set(eventName, handlers);
  }
  
  /**
   * 取消事件监听器
   * @param eventName 事件名称
   * @param handler 要取消的处理函数，如果不提供则取消该事件的所有监听器
   */
  public off(eventName: string, handler?: EventHandler): void {
    if (!handler) {
      // 如果没有提供处理函数，则清除该事件的所有监听器
      this._eventHandlers.delete(eventName);
    } else {
      // 获取现有的处理函数列表
      const handlers = this._eventHandlers.get(eventName);
      
      if (handlers) {
        // 移除指定的处理函数
        const newHandlers = handlers.filter(h => h !== handler);
        
        if (newHandlers.length === 0) {
          // 如果没有剩余的处理函数，则删除该事件
          this._eventHandlers.delete(eventName);
        } else {
          // 更新处理函数列表
          this._eventHandlers.set(eventName, newHandlers);
        }
      }
    }
  }
  
  /**
   * 触发事件，调用所有注册的处理函数
   * @param eventName 事件名称
   * @param data 事件数据
   */
  public emit(eventName: string, data?: any): void {
    // 获取该事件的所有处理函数
    const handlers = this._eventHandlers.get(eventName);
    
    if (handlers) {
      // 调用所有处理函数
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${eventName}':`, error);
        }
      });
    }
  }
  
  /**
   * 注册一次性事件监听器，触发后自动移除
   * @param eventName 事件名称
   * @param handler 事件处理函数
   */
  public once(eventName: string, handler: EventHandler): void {
    // 创建一个包装函数，在调用原始处理函数后自动取消监听
    const onceHandler = (data?: any) => {
      // 调用原始处理函数
      handler(data);
      
      // 取消监听
      this.off(eventName, onceHandler);
    };
    
    // 注册包装的处理函数
    this.on(eventName, onceHandler);
  }
  
  /**
   * 获取某个事件当前的监听器数量
   * @param eventName 事件名称
   * @returns 监听器数量
   */
  public listenerCount(eventName: string): number {
    const handlers = this._eventHandlers.get(eventName);
    return handlers ? handlers.length : 0;
  }
  
  /**
   * 获取所有已注册事件的名称
   * @returns 事件名称数组
   */
  public eventNames(): string[] {
    return Array.from(this._eventHandlers.keys());
  }
  
  /**
   * 清除所有事件和监听器
   */
  public clear(): void {
    this._eventHandlers.clear();
  }
} 