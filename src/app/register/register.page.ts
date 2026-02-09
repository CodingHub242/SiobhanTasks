import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterPage {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: UserRole = 'employee';
  department: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private navController: NavController,
    private toastController: ToastController
  ) {}

  async register(): Promise<void> {
    if (!this.name || !this.email || !this.password) {
      this.showToast('Please fill in all required fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showToast('Passwords do not match');
      return;
    }

    if (this.password.length < 6) {
      this.showToast('Password must be at least 6 characters');
      return;
    }

    this.isLoading = true;

    this.authService.register({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      department: this.department || undefined
    }).subscribe({
      next: (resp:any) => {
        this.isLoading = false;
        //if registration message is User registered successfully,avigate to the appropriate dashboard

        //else stay on register page and show error message
        // if(resp.message !== 'User registered successfully'){
        //   this.showToast(resp.message);
        //   return;
        // }
        this.navigateToDashboard();
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('Registration failed');
      }
    });
  }

  navigateToLogin(): void {
    this.navController.navigateBack('/login');
  }

  private navigateToDashboard(): void {
    if (this.authService.isAdmin()) {
      this.navController.navigateRoot('/admin-dashboard');
    } else {
      this.navController.navigateRoot('/employee-dashboard');
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'danger'
    });
    await toast.present();
  }
}
