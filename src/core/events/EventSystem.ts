/**
 * EventSystem 类 - 事件发布订阅系统
 * 
 * 提供游戏内事件的发布与订阅机制，实现组件间的松耦合通信
 */

type EventCallback = (...args: any[]) => void;

export class EventSystem {
  private listeners: Map<string, EventCallback[]> = new Map();
  
  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param callback 事件回调函数
   * @returns 取消订阅的函数
   */
  public on(eventName: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    const eventCallbacks = this.listeners.get(eventName)!;
    eventCallbacks.push(callback);
    
    // 返回取消订阅的函数
    return () => {
      const callbackIndex = eventCallbacks.indexOf(callback);
      if (callbackIndex !== -1) {
        eventCallbacks.splice(callbackIndex, 1);
      }
    };
  }
  
  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param callback 要取消的回调函数
   */
  public off(eventName: string, callback: EventCallback): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    
    const eventCallbacks = this.listeners.get(eventName)!;
    const callbackIndex = eventCallbacks.indexOf(callback);
    
    if (callbackIndex !== -1) {
      eventCallbacks.splice(callbackIndex, 1);
    }
  }
  
  /**
   * 一次性订阅事件，触发后自动取消订阅
   * @param eventName 事件名称
   * @param callback 事件回调函数
   */
  public once(eventName: string, callback: EventCallback): void {
    const unsubscribe = this.on(eventName, (...args) => {
      callback(...args);
      unsubscribe();
    });
  }
  
  /**
   * 发布事件
   * @param eventName 事件名称
   * @param args 传递给事件处理函数的参数
   */
  public emit(eventName: string, ...args: any[]): void {
    if (!this.listeners.has(eventName)) {
      return;
    }
    
    const eventCallbacks = this.listeners.get(eventName)!;
    eventCallbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event ${eventName} callback:`, error);
      }
    });
  }
  
  /**
   * 清除特定事件的所有监听器
   * @param eventName 事件名称
   */
  public clearEvent(eventName: string): void {
    this.listeners.delete(eventName);
  }
  
  /**
   * 清除所有事件监听器
   */
  public clearAllEvents(): void {
    this.listeners.clear();
  }
} 