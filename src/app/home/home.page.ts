import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';
import { TaskModalPage } from '../task-modal/task-modal.page';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HomePage implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filter: 'all' | 'completed' | 'pending' = 'all';
  searchTerm: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private modalController: ModalController,
    private alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = this.filterTasks(tasks);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterTasks(tasks: Task[]): Task[] {
    let filtered = tasks;

    if (this.filter === 'completed') {
      filtered = tasks.filter(t => t.completed);
    } else if (this.filter === 'pending') {
      filtered = tasks.filter(t => !t.completed);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) || 
        t.description.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  setFilter(filter: 'all' | 'completed' | 'pending'): void {
    this.filter = filter;
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = this.filterTasks(tasks);
      });
  }

  onSearchChange(): void {
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        this.tasks = this.filterTasks(tasks);
      });
  }

  async openAddTaskModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalPage,
      componentProps: { mode: 'add' }
    });
    await modal.present();
  }

  async openEditTaskModal(task: Task): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalPage,
      componentProps: { mode: 'edit', task }
    });
    await modal.present();
  }

  toggleTask(task: Task): void {
    this.taskService.toggleTaskCompletion(task.id);
  }

  async deleteTask(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Delete', 
          handler: () => this.taskService.deleteTask(task.id) 
        }
      ]
    });
    await alert.present();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getDueDateStatus(task: Task): string {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (task.completed) return 'completed';
    if (days < 0) return 'overdue';
    if (days === 0) return 'due-today';
    if (days <= 2) return 'due-soon';
    return 'on-track';
  }
}
