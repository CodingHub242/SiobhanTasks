import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Task } from '../models/task.model';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.page.html',
  styleUrls: ['./task-modal.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class TaskModalPage implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() task?: Task;

  title: string = '';
  description: string = '';
  priority: 'low' | 'medium' | 'high' = 'medium';
  dueDate: string = '';

  constructor(
    private modalController: ModalController,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    if (this.mode === 'edit' && this.task) {
      this.title = this.task.title;
      this.description = this.task.description;
      this.priority = this.task.priority;
      this.dueDate = new Date(this.task.dueDate).toISOString().split('T')[0];
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.dueDate = tomorrow.toISOString().split('T')[0];
    }
  }

  dismiss(): void {
    this.modalController.dismiss();
  }

  save(): void {
    if (!this.title.trim()) {
      return;
    }

    const taskData = {
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      dueDate: new Date(this.dueDate),
      completed: this.task?.completed || false
    };

    if (this.mode === 'edit' && this.task) {
      this.taskService.updateTask(this.task.id, taskData);
    } else {
      this.taskService.addTask(taskData);
    }

    this.modalController.dismiss();
  }
}
