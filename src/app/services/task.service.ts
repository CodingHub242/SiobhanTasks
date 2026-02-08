import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.loadTasks();
  }

  private loadTasks(): void {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasksSubject.next(JSON.parse(savedTasks));
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    this.tasksSubject.next(tasks);
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasksSubject.value.find(task => task.id === id);
  }

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const tasks = [...this.tasksSubject.value, newTask];
    this.saveTasks(tasks);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const tasks = this.tasksSubject.value.map(task => {
      if (task.id === id) {
        return { ...task, ...updates, updatedAt: new Date() };
      }
      return task;
    });
    this.saveTasks(tasks);
    return this.getTaskById(id);
  }

  deleteTask(id: string): void {
    const tasks = this.tasksSubject.value.filter(task => task.id !== id);
    this.saveTasks(tasks);
  }

  toggleTaskCompletion(id: string): void {
    const task = this.getTaskById(id);
    if (task) {
      this.updateTask(id, { completed: !task.completed });
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
