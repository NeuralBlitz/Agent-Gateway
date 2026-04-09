---
name: angular
description: TypeScript-based web application framework by Google
category: web-development
difficulty: advanced
tags: [frontend, typescript, framework, enterprise]
author: Google
version: 17
last_updated: 2024-01-10
---

# Angular

## What I Do

I am Angular, a platform and framework for building single-page client applications using HTML and TypeScript. Developed and maintained by Google, I provide a comprehensive solution for enterprise-scale web application development. My architecture is built around component-based design, where applications are composed of reusable, nested components with well-defined inputs and outputs. I leverage TypeScript for type safety, enabling better tooling, autocompletion, and compile-time error detection. My dependency injection system promotes loose coupling and testability, while my RxJS integration provides powerful reactive programming capabilities. I include a complete routing solution, form handling (both reactive and template-driven), HTTP client for API communication, and testing utilities out of the box. My opinionated structure and strong conventions make me ideal for large teams building maintainable, scalable applications. The latest versions introduce standalone components, signals for fine-grained reactivity, and server-side rendering capabilities.

## When to Use Me

- Building enterprise-grade web applications
- Developing large-scale single-page applications (SPAs)
- Creating component-based UI libraries
- Projects requiring strict TypeScript integration
- Applications needing complex state management
- Teams requiring standardized project structure
- Building progressive web applications (PWAs)
- Applications with complex form requirements
- Projects requiring comprehensive testing infrastructure

## Core Concepts

**Components**: The fundamental building blocks that combine a TypeScript class with an HTML template and CSS styles, decorated with `@Component()`.

**Dependency Injection**: A design pattern where services are provided to components rather than components creating them, enabling loose coupling and testability.

**Modules**: NgModules organize application code into cohesive feature sets with `NgModule()` decorators that declare components, services, and dependencies.

**Standalone Components**: Modern Angular approach eliminating the need for NgModules, allowing direct component composition.

**Signals**: New reactive primitive providing fine-grained reactivity with `signal()`, `computed()`, and `effect()` for granular updates.

**RxJS Observables**: Streams of data that components can subscribe to for handling events, HTTP requests, and asynchronous operations.

**Routing**: Full-featured client-side router with lazy loading, guards, resolvers, and nested route support.

**Change Detection**: Automatic mechanism that checks bindings and updates the view when data changes, with OnPush strategy for performance.

## Code Examples

### Example 1: Standalone Component with Signals
```typescript
// user-list.component.ts
import { Component, signal, computed, effect } from '@angular/core'
import { CommonModule } from '@angular/common'
import { UserService } from './user.service'
import { UserCardComponent } from './user-card.component'

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, UserCardComponent],
  template: `
    <div class="user-list">
      <div class="header">
        <h2>Users ({{ users().length }})</h2>
        <button (click)="refresh()" [disabled]="loading()">
          Refresh
        </button>
      </div>
      
      <div *ngIf="loading()" class="loading">Loading...</div>
      <div *ngIf="error()" class="error">{{ error() }}</div>
      
      <div class="users">
        <app-user-card 
          *ngFor="let user of filteredUsers(); trackBy: trackByUserId"
          [user]="user"
          (selected)="selectUser($event)">
        </app-user-card>
      </div>
      
      <div *ngIf="!loading() && filteredUsers().length === 0" class="empty">
        No users found
      </div>
    </div>
  `,
  styles: [`
    .user-list { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .error { color: red; padding: 10px; background: #fee; border-radius: 4px; }
    .users { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
  `]
})
export class UserListComponent {
  private userService = inject(UserService)
  
  users = signal<User[]>([])
  searchQuery = signal('')
  loading = signal(false)
  error = signal<string | null>(null)
  
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase()
    return this.users().filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })
  
  constructor() {
    effect(() => {
      console.log(`Displaying ${this.filteredUsers().length} users`)
    })
  }
  
  loadUsers() {
    this.loading.set(true)
    this.error.set(null)
    
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => this.error.set(err.message),
      complete: () => this.loading.set(false)
    })
  }
  
  refresh() {
    this.loadUsers()
  }
  
  selectUser(user: User) {
    console.log('Selected user:', user)
  }
  
  trackByUserId(index: number, user: User) {
    return user.id
  }
}
```

### Example 2: Dependency Injection with Services
```typescript
// auth.service.ts
import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient)
  private router = inject(Router)
  
  private state = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  })
  
  state$ = this.state.asObservable()
  
  get currentUser() {
    return this.state.value.user
  }
  
  get isAuthenticated() {
    return this.state.value.isAuthenticated
  }
  
  login(email: string, password: string): Observable<{token: string; user: User}> {
    return this.http.post<{token: string; user: User}>('/api/auth/login', { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token)
          this.state.next({
            user: response.user,
            token: response.token,
            isAuthenticated: true
          })
        })
      )
  }
  
  logout() {
    localStorage.removeItem('token')
    this.state.next({ user: null, token: null, isAuthenticated: false })
    this.router.navigate(['/login'])
  }
  
  refreshToken(): Observable<{token: string}> {
    return this.http.post<{token: string}>('/api/auth/refresh', {})
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token)
          this.state.next({ ...this.state.value, token: response.token })
        }),
        catchError(error => {
          this.logout()
          return throwError(() => error)
        })
      )
  }
  
  initialize() {
    const token = localStorage.getItem('token')
    if (token) {
      this.http.get<User>('/api/auth/me').subscribe({
        next: (user) => {
          this.state.next({ user, token, isAuthenticated: true })
        },
        error: () => {
          localStorage.removeItem('token')
        }
      })
    }
  }
}
```

### Example 3: Reactive Forms with Validation
```typescript
// user-form.component.ts
import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms'
import { UserService } from './user.service'

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="name">Name</label>
        <input id="name" type="text" formControlName="name" />
        <div *ngIf="form.get('name')?.touched && form.get('name')?.errors" class="errors">
          <small *ngIf="form.get('name')?.errors?.['required']">Name is required</small>
          <small *ngIf="form.get('name')?.errors?.['minlength']">Minimum 2 characters</small>
        </div>
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        <div *ngIf="form.get('email')?.touched && form.get('email')?.errors" class="errors">
          <small *ngIf="form.get('email')?.errors?.['required']">Email is required</small>
          <small *ngIf="form.get('email')?.errors?.['email']">Invalid email format</small>
        </div>
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" />
        <div *ngIf="form.get('password')?.touched && form.get('password')?.errors" class="errors">
          <small *ngIf="form.get('password')?.errors?.['required']">Password is required</small>
          <small *ngIf="form.get('password')?.errors?.['minlength']">Minimum 8 characters</small>
        </div>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" formControlName="confirmPassword" />
        <small *ngIf="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched">
          Passwords do not match
        </small>
      </div>
      
      <div class="form-group">
        <label for="role">Role</label>
        <select id="role" formControlName="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="guest">Guest</option>
        </select>
      </div>
      
      <button type="submit" [disabled]="form.invalid || submitting">
        {{ submitting ? 'Saving...' : 'Save User' }}
      </button>
    </form>
  `,
  styles: [`
    form { max-width: 500px; margin: 0 auto; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 4px; font-weight: 500; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
    .errors small { color: red; display: block; margin-top: 4px; }
    button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { background: #ccc; }
  `]
})
export class UserFormComponent {
  private fb = inject(FormBuilder)
  private userService = inject(UserService)
  
  submitting = false
  
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: [''],
    role: ['user']
  }, { validators: this.passwordMatchValidator })
  
  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')
    const confirmPassword = control.get('confirmPassword')
    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }
    return null
  }
  
  onSubmit() {
    if (this.form.valid) {
      this.submitting = true
      const { confirmPassword, ...userData } = this.form.value
      this.userService.createUser(userData as User).subscribe({
        next: () => this.form.reset(),
        complete: () => this.submitting = false
      })
    }
  }
}
```

### Example 4: HTTP Interceptor for Auth
```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from './auth.service'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = localStorage.getItem('token')
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    })
    return next(cloned)
  }
  
  return next(req)
}

// auth-error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        inject(AuthService).logout()
      }
      return throwError(() => error)
    })
  )
}

// app.config.ts
import { ApplicationConfig, provideHttpClient, withInterceptors } from '@angular/core'
import { routes } from './app.routes'
import { authInterceptor, errorInterceptor } from './interceptors'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
}
```

### Example 5: Route Guards and Lazy Loading
```typescript
// auth.guard.ts
import { inject } from '@angular/core'
import { Router, CanActivateFn } from '@angular/router'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)
  
  if (authService.isAuthenticated) {
    return true
  }
  
  return router.createUrlTree(['/login'], { 
    queryParams: { redirect: state.url } 
  })
}

// role.guard.ts
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService)
  const router = inject(Router)
  const requiredRole = route.data['role']
  
  if (authService.currentUser?.role === requiredRole) {
    return true
  }
  
  return router.createUrlTree(['/unauthorized'])
}

// routes.ts
import { Routes } from '@angular/router'
import { authGuard, roleGuard } from './guards'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      { path: 'users', loadComponent: () => import('./users.component') },
      { path: 'settings', loadComponent: () => import('./settings.component') }
    ]
  },
  { path: '**', redirectTo: '' }
]
```

## Best Practices

- Use standalone components and avoid NgModules unless necessary
- Leverage signals for local state and computed values
- Use OnPush change detection strategy for better performance
- Implement proper route guards for authentication and authorization
- Use lazy loading for feature modules to reduce initial bundle size
- Write unit tests with Jest or Jasmine and Angular Testing Library
- Use reactive forms over template-driven forms for complex validation
- Implement proper error handling with HttpInterceptor
- Follow consistent naming conventions: FeatureComponent, feature.service.ts
- Use Angular DevTools for debugging and performance profiling

## Core Competencies

- Component-based architecture with TypeScript
- Dependency injection for testable, maintainable code
- Standalone components and modern Angular patterns
- Signals for fine-grained reactivity
- RxJS observables for asynchronous programming
- Full-featured client-side routing with guards
- Reactive forms with complex validation
- HTTP client with interceptors
- Lazy loading for optimized bundles
- Comprehensive testing utilities
- Server-side rendering with Angular Universal
- Progressive web application support
