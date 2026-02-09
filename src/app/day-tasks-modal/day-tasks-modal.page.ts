import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController, ActionSheetController, ToastController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { Task } from '../models/task.model';
import { User } from '../models/user.model';
import { TaskService } from '../services/task.service';
import { TaskModalPage } from '../task-modal/task-modal.page';

@Component({
  selector: 'app-day-tasks-modal',
  templateUrl: './day-tasks-modal.page.html',
  styleUrls: ['./day-tasks-modal.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DayTasksModalPage implements OnInit, OnDestroy {
  @Input() selectedDate: Date = new Date();
  @Input() tasks: Task[] = [];
  @Input() users: User[] = [];

  dayTasks: Task[] = [];
  employees: User[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private modalController: ModalController,
    private taskService: TaskService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ionViewWillEnter(): void {
    this.refreshData();
  }

  ngOnInit(): void {
    this.filterTasksForDay();
    this.loadEmployees();
    
    // Subscribe to task changes to keep modal updated
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks: any) => {
        this.tasks = tasks;
        this.filterTasksForDay();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshData(): void {
    // Reload tasks from service to ensure we have the latest data
    this.taskService.loadTasks();
    this.filterTasksForDay();
    this.loadEmployees();
  }

  filterTasksForDay(): void {
    const selectedDateStr = this.selectedDate.toDateString();
    this.dayTasks = this.tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === selectedDateStr;
    });
    
    // Update employees list to only show employees with tasks on this date
    this.updateEmployeesWithTasks();
  }

  updateEmployeesWithTasks(): void {
    // Get unique employee IDs from tasks for this date
    const employeeIds = new Set<string>();
    this.dayTasks.forEach(task => {
      if (task.employeeId) {
        employeeIds.add(task.employeeId);
      }
    });
    
    // Filter employees to only those with tasks on this date
    this.employees = this.users.filter(user => employeeIds.has(user.id));
  }

  loadEmployees(): void {
    // Filter users who are employees (not admins)
    this.employees = this.users.filter(user => user.role === 'employee' || !user.role);
  }

  dismiss(): void {
    this.modalController.dismiss();
  }

  // Stats methods
  getTotalTasks(): number {
    return this.dayTasks.length;
  }

  getCompletedTasks(): number {
    return this.dayTasks.filter(t => t.completed).length;
  }

  getPendingTasks(): number {
    return this.dayTasks.filter(t => !t.completed).length;
  }

  getEmployeeName(employeeId?: string): string {
    if (!employeeId) return '';
    const user = this.users.find(u => u.id === employeeId);
    return user ? user.name : '';
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0];
  }

  getEmployeeTaskCount(employeeId: string): number {
    return this.dayTasks.filter(t => t.employeeId === employeeId).length;
  }

  async addTask(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalPage,
      componentProps: { mode: 'add', selectedDate: this.selectedDate, users: this.users }
    });
    
    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.showToast('Task created successfully');
        this.taskService.loadTasks();
        // Refresh tasks after modal closes
        setTimeout(() => this.filterTasksForDay(), 100);
      }
    });
    
    await modal.present();
  }

  async editTask(task: Task): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalPage,
      componentProps: { mode: 'edit', task, users: this.users }
    });
    
    modal.onDidDismiss().then((result) => {
      if (result.data?.success) {
        this.showToast('Task updated successfully');
        this.taskService.loadTasks();
        setTimeout(() => this.filterTasksForDay(), 100);
      }
    });
    
    await modal.present();
  }

  async viewTask(task: Task): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskModalPage,
      componentProps: { mode: 'view', task, users: this.users }
    });
    
    await modal.present();
  }

  async deleteTask(task: Task): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Delete', 
          handler: () => {
            this.taskService.deleteTask(task.id).subscribe({
              next: () => {
                this.showToast('Task deleted successfully');
                this.taskService.loadTasks();
                setTimeout(() => this.filterTasksForDay(), 100);
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  toggleTask(task: Task): void {
    this.taskService.toggleTaskCompletion(task.id);
    // Force refresh after a short delay
    setTimeout(() => {
      this.filterTasksForDay();
    }, 100);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }
}
